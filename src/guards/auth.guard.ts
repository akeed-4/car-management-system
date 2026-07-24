import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthService.service';

/**
 * No route in this app checked isLoggedIn() before now -- unauthenticated users could navigate
 * directly to any authenticated URL and would only be turned away once a request 401'd. Applied
 * here to the new Platform routes; broader rollout across the rest of app.routes.ts is a
 * separate, later change.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  if (authService.isLoggedIn()) {
    return true;
  }
  const router = inject(Router);
  // Preserve the originally-requested URL (e.g. /platform/tenants) as a returnUrl so
  // LoginComponent can send the user back there after a successful login instead of always
  // dropping them on /dashboard.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
