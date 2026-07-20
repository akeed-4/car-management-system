import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { PlatformDashboardDto } from '../models/platform/dashboard.model';
import { CreateTenantDto, TenantDto, UpdateTenantDto } from '../models/platform/tenant.model';
import {
  CreateSubscriptionPlanDto,
  SubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from '../models/platform/subscription-plan.model';
import { SubscriptionDto } from '../models/platform/subscription.model';
import { DomainDto } from '../models/platform/domain.model';
import { GlobalSettingDto } from '../models/platform/global-setting.model';

export interface DxLoadResult<T> {
  data: T[];
  totalCount: number;
  groupCount?: number;
  summary?: unknown[];
}

/**
 * Client for the platform/SaaS admin API (Tenants, Subscription Plans, Subscriptions, Domains,
 * Global Settings). All Platform.* backend controllers are new -- see the SaaS Subscription
 * System roadmap Phase 6/9 for when they land; this service already targets the endpoint shapes
 * agreed there so no rewrite is needed once they're wired up.
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private http = inject(HttpClient);
  private baseUrl = environment.origin.replace(/\/+$/, '') + '/api/platform';

  // ----- Dashboard -----

  getDashboard(): Observable<PlatformDashboardDto> {
    return this.http.get<PlatformDashboardDto>(`${this.baseUrl}/dashboard`);
  }

  // ----- Tenants -----

  /** Plain list (client-side paging use cases, dropdowns, etc.). */
  getTenants(): Observable<TenantDto[]> {
    return this.http.get<TenantDto[]>(`${this.baseUrl}/tenants`);
  }

  /** Server-side paging/filtering/sorting/search for the DevExtreme grid, against the same
   *  GET /api/platform/tenants endpoint -- the backend distinguishes plain vs. DataSourceLoadOptions
   *  requests by the presence of DevExtreme's query params (skip/take/filter/sort/...). */
  loadTenantsGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<TenantDto>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<TenantDto>>(`${this.baseUrl}/tenants`, { params });
  }

  getTenantById(id: number): Observable<TenantDto> {
    return this.http.get<TenantDto>(`${this.baseUrl}/tenants/${id}`);
  }

  createTenant(dto: CreateTenantDto): Observable<TenantDto> {
    return this.http.post<TenantDto>(`${this.baseUrl}/tenants`, dto);
  }

  updateTenant(id: number, dto: UpdateTenantDto): Observable<TenantDto> {
    return this.http.put<TenantDto>(`${this.baseUrl}/tenants/${id}`, dto);
  }

  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenants/${id}`);
  }

  // ----- Subscription Plans -----

  getPlans(): Observable<SubscriptionPlanDto[]> {
    return this.http.get<SubscriptionPlanDto[]>(`${this.baseUrl}/plans`);
  }

  getPlanById(id: number): Observable<SubscriptionPlanDto> {
    return this.http.get<SubscriptionPlanDto>(`${this.baseUrl}/plans/${id}`);
  }

  createPlan(dto: CreateSubscriptionPlanDto): Observable<SubscriptionPlanDto> {
    return this.http.post<SubscriptionPlanDto>(`${this.baseUrl}/plans`, dto);
  }

  updatePlan(id: number, dto: UpdateSubscriptionPlanDto): Observable<SubscriptionPlanDto> {
    return this.http.put<SubscriptionPlanDto>(`${this.baseUrl}/plans/${id}`, dto);
  }

  /** Duplicate is a client-side compose (fetch + createPlan with a new code/name) -- no dedicated
   *  backend endpoint is needed since it's just "create with copied field values". */
  duplicatePlan(source: SubscriptionPlanDto, newCode: string, newName: string): Observable<SubscriptionPlanDto> {
    const dto: CreateSubscriptionPlanDto = {
      code: newCode,
      name: newName,
      priceMonthly: source.priceMonthly,
      priceQuarterly: source.priceQuarterly,
      priceSemiAnnual: source.priceSemiAnnual,
      priceYearly: source.priceYearly,
      priceLifetime: source.priceLifetime,
      isActive: true,
      sortOrder: source.sortOrder + 1,
      limits: source.limits.map(l => ({ metricKey: l.metricKey, maxValue: l.maxValue })),
      features: source.features.map(f => ({ featureKey: f.featureKey, isEnabled: f.isEnabled })),
    };
    return this.createPlan(dto);
  }

  deactivatePlan(id: number): Observable<SubscriptionPlanDto> {
    return this.updatePlan(id, { isActive: false });
  }

  // ----- Subscriptions -----

  getSubscriptions(): Observable<SubscriptionDto[]> {
    return this.http.get<SubscriptionDto[]>(`${this.baseUrl}/subscriptions`);
  }

  renewSubscription(id: number): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.baseUrl}/subscriptions/${id}/renew`, {});
  }

  cancelSubscription(id: number): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.baseUrl}/subscriptions/${id}/cancel`, {});
  }

  // ----- Domains -----

  getDomains(): Observable<DomainDto[]> {
    return this.http.get<DomainDto[]>(`${this.baseUrl}/domains`);
  }

  // ----- Global Settings -----

  getSettings(): Observable<GlobalSettingDto[]> {
    return this.http.get<GlobalSettingDto[]>(`${this.baseUrl}/settings`);
  }

  updateSettings(settings: GlobalSettingDto[]): Observable<GlobalSettingDto[]> {
    return this.http.put<GlobalSettingDto[]>(`${this.baseUrl}/settings`, settings);
  }
}
