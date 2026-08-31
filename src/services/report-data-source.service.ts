import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  },
): CustomStore<T> {
  return new CustomStore<T>({
    key: options?.key ?? 'id',
    load: async (loadOptions) => {
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
      const response = await firstValueFrom(
        http.get<DxLoadResult<T>>(url, { params, observe: 'response' }),
      );
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
   * `'AccountReports/general-journal/query'`. (The older `AccountReportService.apiUrl`, which
   * points at `${environment.origin}reports`, predates the `api/[controller]` convention and
   * appears to be a pre-existing dead route for the legacy full-array endpoints -- out of scope
   * here; this service intentionally does not reuse that base.)
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
