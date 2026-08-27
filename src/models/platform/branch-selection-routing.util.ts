import { BranchMembershipDto } from './branch-membership.model';

export type BranchSelectionOutcome = 'auto' | 'pick' | 'none';

/**
 * Single source of truth for "given the caller's branch memberships, what happens next?" --
 * used by both LoginComponent (post-login) and branchSelectedGuard (deep-link/app-init), so the
 * two can't silently drift. Mirrors resolveCompanySelection one level down the hierarchy.
 *
 *   0 memberships  -> 'none' (no branches configured for this company yet -- proceed without a
 *                     branch scope rather than block login entirely)
 *   1 membership   -> 'auto' (select it silently, no picker)
 *   2+ memberships -> 'pick' (send the user to /select-branch)
 */
export function resolveBranchSelection(memberships: BranchMembershipDto[]): BranchSelectionOutcome {
  if (memberships.length === 0) return 'none';
  if (memberships.length === 1) return 'auto';
  return 'pick';
}
