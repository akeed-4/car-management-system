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
import {
  MySubscriptionStatusDto,
  PublicPaymentConfigDto,
  SelfRegisterTenantDto,
  SubscribeToPlanDto,
} from '../models/platform/onboarding.model';
import {
  LinkExistingUserToTenantDto,
  SelectTenantResponseDto,
  TenantMembershipDto,
} from '../models/platform/tenant-membership.model';
import {
  BranchMembershipDto,
  SelectBranchResponseDto,
} from '../models/platform/branch-membership.model';
import {
  StoreMembershipDto,
  SelectStoreResponseDto,
} from '../models/platform/store-membership.model';
import { AppLoginResponse } from './AuthService.service';

export interface DxLoadResult<T> {
  data: T[];
  totalCount: number;
  groupCount?: number;
  summary?: unknown[];
}

/**
 * Client for the platform/SaaS admin API (Tenants, Subscription Plans, Subscriptions, Domains,
 * Global Settings). Route segments (GetTenants/GetAll/GetById/Create/Update/Delete) mirror each
 * Platform.* controller's explicit action names exactly -- these are named actions, not bare
 * REST verbs on the controller route, so any future controller method rename must be mirrored here.
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private http = inject(HttpClient);
  private baseUrl = environment.origin.replace(/\/+$/, '') + '/api/platform';
  // Anonymous endpoints only (self-registration, plan browsing, Tap publishable key) --
  // must never expose anything requiring an existing session or the Tap secret key.
  private publicUrl = this.baseUrl + '/public';
  // Authenticated, but scoped to the caller's own tenant -- as distinct from the admin-only
  // endpoints above (e.g. getTenants()/getPlans()) which operate across every tenant.
  private myUrl = this.baseUrl + '/my';

  // ----- Onboarding (anonymous) -----

  /** Public plan catalog for the pre-signup plan picker -- same shape as getPlans() but only
   *  ever returns active plans and requires no auth/permission. */
  getPublicPlans(): Observable<SubscriptionPlanDto[]> {
    return this.http.get<SubscriptionPlanDto[]>(`${this.publicUrl}/plans/GetActive`);
  }

  /** Only the Tap *publishable* key -- safe to expose to an anonymous browser. */
  getPublicPaymentConfig(): Observable<PublicPaymentConfigDto> {
    return this.http.get<PublicPaymentConfigDto>(`${this.publicUrl}/payment-config/Get`);
  }

  /** Creates a new tenant + its admin user in one step and returns a login response so the
   *  caller (RegistrationComponent) can sign the user in immediately, exactly like AuthService.login(). */
  selfRegisterTenant(dto: SelfRegisterTenantDto): Observable<AppLoginResponse> {
    return this.http.post<AppLoginResponse>(`${this.publicUrl}/tenants/Register`, dto);
  }

  // ----- Onboarding (authenticated, caller's own tenant) -----

  getMySubscriptionStatus(): Observable<MySubscriptionStatusDto> {
    return this.http.get<MySubscriptionStatusDto>(`${this.myUrl}/subscription/Status`);
  }

  /** `dto.startFreeTrial` needs no `tapToken`; a paid subscription needs a Tap Card SDK token
   *  (see TapPaymentService) instead of raw card data. */
  subscribeCurrentTenant(dto: SubscribeToPlanDto): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.myUrl}/subscription/Subscribe`, dto);
  }

  // ----- My companies (multi-tenant membership) -----

  /** Every company the caller belongs to -- see MyTenantsController. */
  getMyTenants(): Observable<TenantMembershipDto[]> {
    return this.http.get<TenantMembershipDto[]>(`${this.myUrl}/tenants`);
  }

  /** Resolved from the caller's current JWT tenantId claim; null when none is selected yet. */
  getCurrentTenant(): Observable<TenantMembershipDto | null> {
    return this.http.get<TenantMembershipDto | null>(`${this.myUrl}/tenants/current`);
  }

  /** Switches the caller's active company. Returns a reissued token+refresh-token pair -- callers
   *  must feed the response into AuthService.setSession() so subsequent requests carry the new
   *  tenantId claim. Never trust a client-supplied tenant id beyond routing: the backend validates
   *  membership server-side. */
  selectTenant(tenantId: number): Observable<SelectTenantResponseDto> {
    return this.http.post<SelectTenantResponseDto>(`${this.myUrl}/tenants/${tenantId}/select`, {});
  }

  /** Every branch the caller may select as their active branch (within their current company). */
  getMyBranches(): Observable<BranchMembershipDto[]> {
    return this.http.get<BranchMembershipDto[]>(`${this.myUrl}/branches`);
  }

  /** Switches the caller's active branch. No token/claim change -- unlike selectTenant, Branch is
   *  a client-persisted UI scope validated server-side on demand, not baked into the JWT. */
  selectBranch(branchId: number): Observable<SelectBranchResponseDto> {
    return this.http.post<SelectBranchResponseDto>(`${this.myUrl}/branches/${branchId}/select`, {});
  }

  /** Every store (Showroom) the caller may select as their active store. Independent of Branch --
   *  backed by UserStoreAssignment, not derived from the caller's branch memberships. */
  getMyStores(): Observable<StoreMembershipDto[]> {
    return this.http.get<StoreMembershipDto[]>(`${this.myUrl}/stores`);
  }

  /** Switches the caller's active store. No token/claim change -- Store is a client-persisted UI
   *  scope validated server-side on demand, not baked into the JWT. */
  selectStore(storeId: number): Observable<SelectStoreResponseDto> {
    return this.http.post<SelectStoreResponseDto>(`${this.myUrl}/stores/${storeId}/select`, {});
  }

  /** Platform-admin "Grant Access": links an existing user (by email) to a tenant they don't
   *  currently belong to. */
  addTenantMember(tenantId: number, dto: LinkExistingUserToTenantDto): Observable<TenantMembershipDto> {
    return this.http.post<TenantMembershipDto>(`${this.baseUrl}/tenants/${tenantId}/Members`, dto);
  }

  // ----- Dashboard -----

  getDashboard(): Observable<PlatformDashboardDto> {
    return this.http.get<PlatformDashboardDto>(`${this.baseUrl}/dashboard/Get`);
  }

  // ----- Tenants -----

  /** Plain list (client-side paging use cases, dropdowns, etc.). */
  getTenants(): Observable<TenantDto[]> {
    return this.http.get<TenantDto[]>(`${this.baseUrl}/tenants/GetTenants`);
  }

  /** Server-side paging/filtering/sorting/search for the DevExtreme grid, against the same
   *  GET /api/platform/tenants/GetTenants endpoint -- the backend distinguishes plain vs.
   *  DataSourceLoadOptions requests by the presence of DevExtreme's query params (skip/take/filter/sort/...). */
  loadTenantsGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<TenantDto>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<TenantDto>>(`${this.baseUrl}/tenants/GetTenants`, { params });
  }

  getTenantById(id: number): Observable<TenantDto> {
    return this.http.get<TenantDto>(`${this.baseUrl}/tenants/GetById/${id}`);
  }

  createTenant(dto: CreateTenantDto): Observable<TenantDto> {
    return this.http.post<TenantDto>(`${this.baseUrl}/tenants/Create`, dto);
  }

  updateTenant(id: number, dto: UpdateTenantDto): Observable<TenantDto> {
    return this.http.put<TenantDto>(`${this.baseUrl}/tenants/Update/${id}`, dto);
  }

  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tenants/Delete/${id}`);
  }

  // ----- Subscription Plans -----

  getPlans(): Observable<SubscriptionPlanDto[]> {
    return this.http.get<SubscriptionPlanDto[]>(`${this.baseUrl}/plans/GetAll`);
  }

  getPlanById(id: number): Observable<SubscriptionPlanDto> {
    return this.http.get<SubscriptionPlanDto>(`${this.baseUrl}/plans/GetById/${id}`);
  }

  createPlan(dto: CreateSubscriptionPlanDto): Observable<SubscriptionPlanDto> {
    return this.http.post<SubscriptionPlanDto>(`${this.baseUrl}/plans/Create`, dto);
  }

  updatePlan(id: number, dto: UpdateSubscriptionPlanDto): Observable<SubscriptionPlanDto> {
    return this.http.put<SubscriptionPlanDto>(`${this.baseUrl}/plans/Update/${id}`, dto);
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
      features: source.features.map(f => ({ featureKey: f.featureKey, nameEn: f.nameEn, nameAr: f.nameAr, isEnabled: f.isEnabled })),
    };
    return this.createPlan(dto);
  }

  deactivatePlan(id: number): Observable<SubscriptionPlanDto> {
    return this.updatePlan(id, { isActive: false });
  }

  // ----- Subscriptions -----

  getSubscriptions(): Observable<SubscriptionDto[]> {
    return this.http.get<SubscriptionDto[]>(`${this.baseUrl}/subscriptions/GetAll`);
  }

  renewSubscription(id: number): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.baseUrl}/subscriptions/${id}/renew`, {});
  }

  cancelSubscription(id: number): Observable<SubscriptionDto> {
    return this.http.post<SubscriptionDto>(`${this.baseUrl}/subscriptions/${id}/cancel`, {});
  }

  // ----- Domains -----

  getDomains(): Observable<DomainDto[]> {
    return this.http.get<DomainDto[]>(`${this.baseUrl}/domains/GetAll`);
  }

  // ----- Global Settings -----

  getSettings(): Observable<GlobalSettingDto[]> {
    return this.http.get<GlobalSettingDto[]>(`${this.baseUrl}/settings/GetAll`);
  }

  updateSettings(settings: GlobalSettingDto[]): Observable<GlobalSettingDto[]> {
    return this.http.put<GlobalSettingDto[]>(`${this.baseUrl}/settings/Update`, settings);
  }
}
