import { StoreMembershipDto } from './store-membership.model';

export type StoreSelectionOutcome = 'auto' | 'pick' | 'none';

/**
 * Single source of truth for "given the caller's selectable stores, what happens next?" -- used
 * by storeSelectedGuard (Store is selected purely post-login/deep-link, unlike Company/Branch
 * there is no dedicated LoginComponent step for it). Mirrors resolveBranchSelection one level
 * down the hierarchy.
 *
 *   0 stores  -> 'none' (no stores configured for this caller yet -- proceed without a store
 *                scope rather than block login entirely)
 *   1 store   -> 'auto' (select it silently, no picker)
 *   2+ stores -> 'pick' (send the user to /select-store)
 */
export function resolveStoreSelection(stores: StoreMembershipDto[]): StoreSelectionOutcome {
  if (stores.length === 0) return 'none';
  if (stores.length === 1) return 'auto';
  return 'pick';
}
