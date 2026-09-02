import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import CustomStore from 'devextreme/data/custom_store';
import { environment } from '../environments/environment';

/**
 * Standard `devextreme-aspnet-data` / `DataSourceLoader.LoadAsync` response shape, returned by
 * every remote-operations grid endpoint in this codebase (tenant-list, requested-cars,
 * consignment-list, delivery-schedule, daily-entries-list, payments, receipts, and the new
 * paged report endpoints). Duplicated locally as `DxLoadResult<T>` in platform.service.ts,
 * requested-car.service.ts, consignment.service.ts, consignment-sale.service.ts,
 * daily-entry.service.ts and delivery.service.ts -- reports code should import this one instead
 * of adding a seventh copy.
 */
export interface DxLoadResult<T> {
  data: T[];
  totalCount: number;
  groupCount?: number;
  summary?: unknown[];
}

/**
 * Serializes DevExtreme `LoadOptions` (as produced by a `CustomStore.load` callback when
 * `remoteOperations` is enabled) into query-string parameters matching what
 * `CarERP.Api/Models/DataSourceLoadOptions.cs`'s `DataSourceLoadOptionsBinder` /
 * `DataSourceLoadOptionsParser.Parse` expects server-side: object/array values (filter, sort,
 * group, ...) are JSON-encoded, everything else is sent as a plain string. This is the same
 * approach already used ad hoc in platform.service.ts (`loadTenantsGrid`) and
 * requested-car.service.ts (`loadDataGrid`) -- pulled out here so report screens (and any future
 * screen) share one implementation instead of re-copying it.
 */
export function toLoadOptionsParams(loadOptions: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  for (const key of Object.keys(loadOptions)) {
    const value = loadOptions[key];
    if (value !== undefined && value !== null) {
      params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
  }
  return params;
}

/**
 * Extra fixed filters/params to merge into every load call (e.g. a selected account id for
 * Account Statement) -- either a static object or a function evaluated on each load so screens
 * can react to filter changes made after the store was created.
 */
export type ReportExtraParams =
  | Record<string, unknown>
  | (() => Record<string, unknown>);

/**
 * Builds a DevExtreme `CustomStore` wired for full server-side remote operations
 * (filtering/sorting/paging/grouping/summary) against a report endpoint that accepts
 * `DataSourceLoadOptions` query-string parameters and returns a `DxLoadResult<T>` JSON body --
 * the same contract `ReportGridComponent`'s `remoteDataSource` input expects (see
 * report-grid.component.ts). Reuses the exact query-serialization approach already proven by
 * platform.service.ts's `loadTenantsGrid` / tenant-list.component.ts, generalized so any report
 * (or any future paged screen) can get a working remote store in one call instead of hand-rolling
 * the CustomStore each time.
 *
 * @param http    Injected HttpClient (pass `inject(HttpClient)` from the calling service/component).
 * @param url     Full endpoint URL (e.g. `${environment.origin}reports/general-journal/grid`).
 * @param options.key         DevExtreme store key field, default `'id'`.
 * @param options.extraParams Extra fixed/dynamic query params merged into every load (e.g. a
 *                             selected accountId) -- sent alongside, not instead of, the
 *                             serialized LoadOptions.
 */
/** Extracts a human-readable message from whatever `firstValueFrom(http.get(...))` rejects with,
 *  so a CustomStore `load()` failure always rejects with a real Error carrying a real `.message`
 *  -- never the raw HttpErrorResponse object. DevExtreme's grid displays a failed load's
 *  rejection reason directly; an object with no meaningful `toString()` renders as the literal
 *  string "[object Object]" in the grid, which is exactly what an unwrapped HttpErrorResponse
 *  does (it doesn't extend Error, so it has no useful message representation of its own). */
function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error === 'string' && error.error.trim()) return error.error;
    const body = error.error as { message?: string; title?: string } | null;
    if (body?.message) return body.message;
    if (body?.title) return body.title;
    if (error.status === 0) return 'Network error: unable to reach the server';
    return `Request failed (${error.status})`;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function createReportRemoteStore<T = unknown>(
  http: HttpClient,
  url: string,
  options?: {
    key?: string | string[];
    extraParams?: ReportExtraParams;
    /**
     * Called with the raw response Headers after every successful load -- lets a screen pick up
     * out-of-band metadata that doesn't fit the LoadResult shape, e.g. Account Statement's
     * `X-Opening-Balance` header (see AccountReportsController.GetAccountStatementQuery).
     */
    onHeaders?: (headers: import('@angular/common/http').HttpHeaders) => void;
    /**
     * Checked at the start of every load(); when true, returns an empty page immediately without
     * making the HTTP call. For a report that requires a selection the backend validates (e.g.
     * Account Statement's AccountId <= 0 -> 400), the grid otherwise fires that doomed request
     * the moment it renders -- before the user has picked anything -- surfacing a raw error in
     * the grid instead of just... not loading yet.
     */
    shouldSkip?: () => boolean;
  },
): CustomStore<T> {
  return new CustomStore<T>({
    key: options?.key ?? 'id',
    load: async (loadOptions) => {
      if (options?.shouldSkip?.()) {
        return { data: [], totalCount: 0 };
      }
      let params = toLoadOptionsParams(loadOptions as Record<string, unknown>);
      const extra = typeof options?.extraParams === 'function' ? options.extraParams() : options?.extraParams;
      if (extra) {
        for (const key of Object.keys(extra)) {
          const value = extra[key];
          if (value !== undefined && value !== null && value !== '') {
            params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        }
      }
      let response;
      try {
        response = await firstValueFrom(
          http.get<DxLoadResult<T>>(url, { params, observe: 'response' }),
        );
      } catch (error) {
        throw new Error(extractErrorMessage(error));
      }
      if (options?.onHeaders && response.headers) {
        options.onHeaders(response.headers);
      }
      const result = response.body;
      return {
        data: result?.data ?? [],
        totalCount: result?.totalCount ?? 0,
        groupCount: result?.groupCount,
        summary: result?.summary,
      };
    },
  });
}

/**
 * Injectable convenience wrapper around {@link createReportRemoteStore} for report screens that
 * prefer DI over importing the free function directly. Both are equivalent; use whichever fits
 * the screen's existing style (constructor injection vs `inject()`).
 */
@Injectable({ providedIn: 'root' })
export class ReportDataSourceService {
  private http = inject(HttpClient);

  /**
   * Base URL for the real report controllers (`AccountReportsController`,
   * `CarReportsController`, ...), e.g. `http://localhost:5003/api` (no trailing slash). NOTE:
   * this is deliberately `api`, not `reports` -- every report controller in this codebase is
   * `[Route("api/[controller]")]` (see AccountReportsController.cs / CarReportsController.cs),
   * so a path passed to `createStore` must be controller-relative, e.g.
   * `'AccountReports/general-journal/query'`. (`AccountReportService.apiUrl` is a separate,
   * now-also-fixed base for that service's own POST report-generation endpoints -- this service
   * intentionally does not reuse it, since those are a different route shape entirely.)
   */
  readonly reportsBaseUrl = `${environment.origin}api`.replace(/\/+$/, '');

  /**
   * Builds a remote CustomStore for a report endpoint given a path relative to `api/`
   * (e.g. `'AccountReports/general-journal/query'`) or a full absolute URL.
   */
  createStore<T = unknown>(
    path: string,
    options?: {
      key?: string | string[];
      extraParams?: ReportExtraParams;
      onHeaders?: (headers: import('@angular/common/http').HttpHeaders) => void;
      shouldSkip?: () => boolean;
    },
  ): CustomStore<T> {
    const url = /^https?:\/\//i.test(path) ? path : `${this.reportsBaseUrl}/${path.replace(/^\/+/, '')}`;
    return createReportRemoteStore<T>(this.http, url, options);
  }

  /** Plain GET against a report endpoint with LoadOptions-style params, for one-off non-store calls. */
  loadOnce<T>(path: string, loadOptions: Record<string, unknown>): Observable<DxLoadResult<T>> {
    const url = /^https?:\/\//i.test(path) ? path : `${this.reportsBaseUrl}/${path.replace(/^\/+/, '')}`;
    return this.http.get<DxLoadResult<T>>(url, { params: toLoadOptionsParams(loadOptions) });
  }
}
