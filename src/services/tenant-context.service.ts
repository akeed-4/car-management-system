import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from './AuthService.service';
import { PlatformService } from './platform.service';
import { LocalStorageService } from './local-storage.service';
import { TenantMembershipDto } from '../models/platform/tenant-membership.model';

export interface CurrentTenantState {
  tenantId: number;
  tenantName: string;
  companyCode: string;
  subscriptionId: number | null;
  planId: number | null;
  companyLegalName: string | null;
  currency: string | null;
  language: string | null;
  timezone: string | null;
  logoUrl: string | null;
}

const CURRENT_TENANT_KEY = 'current_tenant';

/**
 * Signals-based multi-company state layer, mirroring PermissionService's pattern of layering
 * signals on top of the still-synchronous AuthService rather than the older BehaviorSubject style
 * (LanguageService). Deliberately NOT named anything with "Company" -- CurrentSettingService
 * already owns getCurrentCompany()/getCompanyId() for the unrelated legal-entity/branch concept
 * fed to /setup/companies. The UI label for this feature is "Companies"; the code stays "Tenant".
 */
@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private localStorage = inject(LocalStorageService);

  private _current = signal<CurrentTenantState | null>(null);
  current = this._current.asReadonly();

  private _memberships = signal<TenantMembershipDto[]>([]);
  memberships = this._memberships.asReadonly();

  hasMultipleTenants = computed(() => this._memberships().length > 1);

  /** Loads every company the caller belongs to. Does not itself select one -- callers decide
   *  auto-select vs. show-a-picker based on the result length. */
  loadMemberships(): Observable<TenantMembershipDto[]> {
    return this.platformService.getMyTenants().pipe(
      tap(memberships => this._memberships.set(memberships)),
    );
  }

  /** Reads a previously persisted selection from localStorage (optimistic -- not re-validated
   *  against the backend here, callers that need that should follow up with loadMemberships()).
   *  Returns null if nothing was persisted or the stored value is corrupt. */
  restoreFromStorage(): CurrentTenantState | null {
    const raw = this.localStorage.getItem(CURRENT_TENANT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CurrentTenantState;
      this._current.set(parsed);
      return parsed;
    } catch {
      this.localStorage.removeItem(CURRENT_TENANT_KEY);
      return null;
    }
  }

  /** Switches the caller's active company: validates membership server-side, reissues the
   *  session (so the JWT's tenantId claim and the interceptor's X-Tenant-Id header both flip),
   *  and persists the new selection. */
  selectTenant(tenantId: number, rememberMe = true): Observable<CurrentTenantState> {
    return this.platformService.selectTenant(tenantId).pipe(
      map(response => {
        this.authService.setSession(response, rememberMe);
        const membership = this._memberships().find(m => m.tenantId === response.tenantId);
        const state: CurrentTenantState = {
          tenantId: response.tenantId,
          tenantName: response.tenantName,
          companyCode: response.tenantCode,
          subscriptionId: membership?.subscriptionId ?? null,
          planId: membership?.planId ?? null,
          companyLegalName: response.companyLegalName ?? null,
          currency: response.currency ?? null,
          language: response.language ?? null,
          timezone: response.timezone ?? null,
          logoUrl: response.logoUrl ?? null,
        };
        this.localStorage.setItem(CURRENT_TENANT_KEY, JSON.stringify(state));
        this._current.set(state);
        return state;
      }),
    );
  }

  clear(): void {
    this.localStorage.removeItem(CURRENT_TENANT_KEY);
    this._current.set(null);
    this._memberships.set([]);
  }
}
