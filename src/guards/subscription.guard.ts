import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { PlatformService } from '../services/platform.service';
import { resolveOnboardingDestination } from '../models/platform/onboarding-routing.util';

/**
 * Gates the app shell on the caller's tenant having a usable subscription (Trial/Active/
 * RenewalPending/GracePeriod). Chained after tenantGuard on the same route (`canActivate:
 * [tenantGuard, subscriptionGuard]`) -- tenantGuard already turned away a suspended tenant or
 * deactivated user, so by the time this runs the only remaining question is "is there a
 * subscription", routed via the shared resolveOnboardingDestination() table: no subscription yet
 * -> plan picker, pending payment -> payment page, expired/cancelled/etc. -> renewal page.
 *
 * Fails OPEN on a subscription-status lookup error (network issue, or the backend not having
 * shipped GET /api/platform/my/subscription/Status yet) so this doesn't lock every existing
 * tenant out of the app the moment it's deployed.
 */
export const subscriptionGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const platformService = inject(PlatformService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/registration'], { queryParams: { returnUrl: state.url } });
  }

  return platformService.getMySubscriptionStatus().pipe(
    map(status => {
      if (status.hasActiveSubscription) return true;
      const destination = resolveOnboardingDestination(status, state.url);
      return router.createUrlTree(destination.commands, { queryParams: destination.queryParams });
    }),
    catchError(() => of(true)),
  );
};
