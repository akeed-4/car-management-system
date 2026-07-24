import { Params } from '@angular/router';
import { SubscriptionStatus, TenantStatus } from '../enums/platform.enums';
import { MySubscriptionStatusDto } from './onboarding.model';

export interface OnboardingDestination {
  commands: string[];
  queryParams?: Params;
}

const SUBSCRIPTION_NEEDS_RENEWAL = new Set<SubscriptionStatus>([
  SubscriptionStatus.Expired,
  SubscriptionStatus.Suspended,
  SubscriptionStatus.Cancelled,
  SubscriptionStatus.Blocked,
]);

/**
 * Single source of truth for "given this tenant/subscription status, where does the user
 * belong?" -- used by both LoginComponent (post-login redirect) and the tenant/subscription
 * guards (deep-link protection), so the two can't silently drift out of sync.
 *
 *   Tenant not Active, or user inactive  -> /tenant-activation
 *   Usable subscription (Trial/Active/RenewalPending/GracePeriod) -> /dashboard
 *   PendingPayment with a plan on file   -> /onboarding/payment
 *   Expired/Suspended/Cancelled/Blocked  -> /onboarding/renew
 *   No subscription record yet           -> /onboarding/plans
 */
export function resolveOnboardingDestination(
  status: MySubscriptionStatusDto,
  returnUrl?: string | null,
): OnboardingDestination {
  if (status.tenantStatus !== TenantStatus.Active || !status.userIsActive) {
    return { commands: ['/tenant-activation'] };
  }

  if (status.hasActiveSubscription) {
    return returnUrl ? { commands: [returnUrl] } : { commands: ['/dashboard'] };
  }

  if (status.status === SubscriptionStatus.PendingPayment && status.planId && status.billingCycle) {
    return {
      commands: ['/onboarding/payment'],
      queryParams: { planId: status.planId, billingCycle: status.billingCycle, ...(returnUrl ? { returnUrl } : {}) },
    };
  }

  if (status.status && SUBSCRIPTION_NEEDS_RENEWAL.has(status.status)) {
    return { commands: ['/onboarding/renew'] };
  }

  return { commands: ['/onboarding/plans'], queryParams: returnUrl ? { returnUrl } : undefined };
}
