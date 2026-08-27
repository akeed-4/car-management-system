import { Store } from './branch.model';

/**
 * Scopes a form's Store picker to the caller's currently-selected Branch (see
 * BranchContextService), so a user is never offered a store outside their assigned branch --
 * without a second HTTP round trip, since Store.branchId is already present on every Store the
 * existing StoreService.stores$ signal already loads.
 *
 * `currentValue` (the form control's existing value, e.g. when editing a previously-saved
 * document) is always kept in the returned list even if its store belongs to a different branch --
 * editing a historical document must never silently blank out or block a field the document was
 * legitimately saved with. A brand-new document (no currentValue) only ever sees branch-scoped
 * stores. When no branch is selected yet (BranchContextService.current() is null -- e.g. the
 * caller's company has zero branches configured), this fails OPEN and returns every store
 * unfiltered, matching branchSelectedGuard's own fail-open behavior for that same case.
 */
export function scopeStoresToCurrentBranch(
  allStores: Store[],
  currentBranchId: number | null | undefined,
  currentValue: number | null | undefined,
): Store[] {
  if (currentBranchId == null) return allStores;

  const scoped = allStores.filter(s => s.branchId === currentBranchId);
  if (currentValue == null || scoped.some(s => s.id === currentValue)) {
    return scoped;
  }

  const existing = allStores.find(s => s.id === currentValue);
  return existing ? [...scoped, existing] : scoped;
}
