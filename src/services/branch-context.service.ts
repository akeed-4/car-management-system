import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { PlatformService } from './platform.service';
import { LocalStorageService } from './local-storage.service';
import { BranchMembershipDto } from '../models/platform/branch-membership.model';

export interface CurrentBranchState {
  branchId: number;
  nameAr: string;
  nameEn: string;
  companyId: number;
}

const CURRENT_BRANCH_KEY = 'current_branch';

/**
 * Signals-based branch-selection state layer, mirroring TenantContextService one level down the
 * Company -> Branch hierarchy. Deliberately a separate localStorage key/state object from
 * TenantContextService's `current_tenant` -- CurrentSettingService already owns unrelated raw
 * branchId/storeId keys used for manual entry/display elsewhere; this is the validated,
 * membership-backed selection used to gate the app shell.
 */
@Injectable({
  providedIn: 'root',
})
export class BranchContextService {
  private platformService = inject(PlatformService);
  private localStorage = inject(LocalStorageService);

  private _current = signal<CurrentBranchState | null>(null);
  current = this._current.asReadonly();

  private _memberships = signal<BranchMembershipDto[]>([]);
  memberships = this._memberships.asReadonly();

  hasMultipleBranches = computed(() => this._memberships().length > 1);

  /** Loads every branch the caller may select (within their current company). Does not itself
   *  select one -- callers decide auto-select vs. show-a-picker based on the result length. */
  loadMemberships(): Observable<BranchMembershipDto[]> {
    return this.platformService.getMyBranches().pipe(
      tap(memberships => this._memberships.set(memberships)),
    );
  }

  /** Reads a previously persisted selection from localStorage (optimistic -- not re-validated
   *  against the backend here, callers that need that should follow up with loadMemberships()).
   *  Returns null if nothing was persisted or the stored value is corrupt. */
  restoreFromStorage(): CurrentBranchState | null {
    const raw = this.localStorage.getItem(CURRENT_BRANCH_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CurrentBranchState;
      this._current.set(parsed);
      return parsed;
    } catch {
      this.localStorage.removeItem(CURRENT_BRANCH_KEY);
      return null;
    }
  }

  /** Selects the caller's active branch: validates membership server-side and persists the
   *  selection. No token reissue -- Branch is not a JWT claim, unlike Tenant. */
  selectBranch(branchId: number): Observable<CurrentBranchState> {
    return this.platformService.selectBranch(branchId).pipe(
      map(response => {
        const state: CurrentBranchState = {
          branchId: response.branchId,
          nameAr: response.nameAr,
          nameEn: response.nameEn,
          companyId: response.companyId,
        };
        this.localStorage.setItem(CURRENT_BRANCH_KEY, JSON.stringify(state));
        this._current.set(state);
        return state;
      }),
    );
  }

  clear(): void {
    this.localStorage.removeItem(CURRENT_BRANCH_KEY);
    this._current.set(null);
    this._memberships.set([]);
  }
}
