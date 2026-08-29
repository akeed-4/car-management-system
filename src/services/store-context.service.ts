import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { PlatformService } from './platform.service';
import { LocalStorageService } from './local-storage.service';
import { StoreMembershipDto } from '../models/platform/store-membership.model';

export interface CurrentStoreState {
  storeId: number;
  nameAr: string;
  nameEn: string;
  companyId: number;
  branchId: number;
}

const CURRENT_STORE_KEY = 'current_store';

/**
 * Signals-based store-selection state layer -- Store (Showroom) is the end-user-facing concept
 * selected once after login in this system (Branch is an internal grouping only, never shown as
 * its own picker). Mirrors BranchContextService/TenantContextService's pattern exactly, but Store
 * authorization is fully independent of Branch: memberships come straight from the caller's own
 * UserStoreAssignment rows (api/platform/my/stores), not derived from any Branch membership.
 */
@Injectable({
  providedIn: 'root',
})
export class StoreContextService {
  private platformService = inject(PlatformService);
  private localStorage = inject(LocalStorageService);

  private _current = signal<CurrentStoreState | null>(null);
  current = this._current.asReadonly();

  private _memberships = signal<StoreMembershipDto[]>([]);
  memberships = this._memberships.asReadonly();

  hasMultipleStores = computed(() => this._memberships().length > 1);

  /** Loads every store the caller may select (their own UserStoreAssignment rows, joined against
   *  live Store data server-side). Does not itself select one -- callers decide auto-select vs.
   *  show-a-picker based on the result length. */
  loadMemberships(): Observable<StoreMembershipDto[]> {
    return this.platformService.getMyStores().pipe(
      tap(memberships => this._memberships.set(memberships)),
    );
  }

  /** Reads a previously persisted selection from localStorage (optimistic -- not re-validated
   *  against the backend here, callers that need that should follow up with loadMemberships()).
   *  Returns null if nothing was persisted or the stored value is corrupt. */
  restoreFromStorage(): CurrentStoreState | null {
    const raw = this.localStorage.getItem(CURRENT_STORE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CurrentStoreState;
      this._current.set(parsed);
      return parsed;
    } catch {
      this.localStorage.removeItem(CURRENT_STORE_KEY);
      return null;
    }
  }

  /** Selects the caller's active store: validates membership server-side and persists the
   *  selection. No token reissue -- Store is not a JWT claim, unlike Tenant. */
  selectStore(storeId: number): Observable<CurrentStoreState> {
    return this.platformService.selectStore(storeId).pipe(
      map(response => {
        const state: CurrentStoreState = {
          storeId: response.storeId,
          nameAr: response.nameAr,
          nameEn: response.nameEn,
          companyId: response.companyId,
          branchId: response.branchId,
        };
        this.localStorage.setItem(CURRENT_STORE_KEY, JSON.stringify(state));
        this._current.set(state);
        return state;
      }),
    );
  }

  clear(): void {
    this.localStorage.removeItem(CURRENT_STORE_KEY);
    this._current.set(null);
    this._memberships.set([]);
  }
}
