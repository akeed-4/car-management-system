import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { PlatformService } from '../services/platform.service';
import { resolveOnboardingDestination } from '../models/platform/onboarding-routing.util';

/**
 * Keeps a fully signed-in, fully onboarded user off /login and /registration -- landing on the
 * signup form after you already have a working account is just confusing. A signed-in user who
 * isn't fully onboarded yet (no subscription, tenant not active, etc.) is instead sent wherever
 * they actually belong via the same resolveOnboardingDestination() logic the guards/login use,
 * rather than always dashboard, so this can't bounce them into another guard's redirect.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const platformService = inject(PlatformService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  return platformService.getMySubscriptionStatus().pipe(
    map(status => {
      const destination = resolveOnboardingDestination(status);
      return router.createUrlTree(destination.commands, { queryParams: destination.queryParams });
    }),
    // Fail open toward showing the login/registration page rather than trapping a user who
    // can't be status-checked right now (e.g. the backend endpoint being briefly unavailable).
    catchError(() => of(true)),
  );
};
