import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { PlatformService } from '../services/platform.service';
import { TenantStatus } from '../models/enums/platform.enums';

/**
 * Gates the app shell on tenant/user account health, separately from subscriptionGuard (which
 * only cares about the subscription itself) -- a suspended/blocked tenant or a deactivated user
 * should never even get as far as "do you have a subscription", they go to /tenant-activation
 * instead. Chained before subscriptionGuard on the same route (`canActivate: [tenantGuard,
 * subscriptionGuard]`); Angular runs guards in order and short-circuits on the first redirect, so
 * subscriptionGuard's own status lookup never fires once this one has already redirected.
 *
 * Fails OPEN on a lookup error, same rationale as subscriptionGuard: don't lock out every
 * existing tenant over a transient network error or a not-yet-shipped backend endpoint.
 */
export const tenantGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const platformService = inject(PlatformService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/registration'], { queryParams: { returnUrl: state.url } });
  }

  return platformService.getMySubscriptionStatus().pipe(
    map(status => (status.tenantStatus !== TenantStatus.Active || !status.userIsActive)
      ? router.createUrlTree(['/tenant-activation'])
      : true),
    catchError(() => of(true)),
  );
};
