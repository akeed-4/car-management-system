import { TenantMembershipDto } from './tenant-membership.model';

export type CompanySelectionOutcome = 'auto' | 'pick' | 'none';

/**
 * Single source of truth for "given the caller's company memberships, what happens next?" --
 * used by both LoginComponent (post-login) and companySelectedGuard (deep-link/app-init), so the
 * two can't silently drift, mirroring how resolveOnboardingDestination() is shared the same way.
 *
 *   0 memberships  -> 'none' (platform staff / legacy user not tied to any tenant -- unchanged
 *                     behavior, proceed exactly as before this feature existed)
 *   1 membership   -> 'auto' (select it silently, no picker)
 *   2+ memberships -> 'pick' (send the user to /select-company)
 */
export function resolveCompanySelection(memberships: TenantMembershipDto[]): CompanySelectionOutcome {
  if (memberships.length === 0) return 'none';
  if (memberships.length === 1) return 'auto';
  return 'pick';
}
