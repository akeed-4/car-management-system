import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { TenantContextService } from '../services/tenant-context.service';
import { resolveCompanySelection } from '../models/platform/company-selection-routing.util';

/**
 * Gates the app shell on "is a company currently selected" -- runs BEFORE tenantGuard/
 * subscriptionGuard on the same route (`canActivate: [companySelectedGuard, tenantGuard,
 * subscriptionGuard]`), so by the time those two run, either a tenant is already selected (JWT
 * tenantId claim correct) or this guard has already redirected to /select-company. This is why
 * tenantGuard/subscriptionGuard need no code changes for multi-company support -- they already
 * resolve everything server-side from the JWT claim, which is now correct by construction.
 *
 * Also serves as the "restore on app startup" step (requirement: read from localStorage, validate
 * with the backend, clear+redirect if invalid) -- there's no APP_INITIALIZER in this app, and that
 * concern is naturally scoped to "entering the authenticated shell" anyway.
 *
 * Fails OPEN on a lookup error, same rationale as tenantGuard/subscriptionGuard: don't lock out
 * every existing single-company user over a transient network error.
 */
export const companySelectedGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/registration'], { queryParams: { returnUrl: state.url } });
  }

  if (tenantContext.current()) {
    return true;
  }

  const restored = tenantContext.restoreFromStorage();

  return tenantContext.loadMemberships().pipe(
    switchMap(memberships => {
      const outcome = resolveCompanySelection(memberships);

      if (outcome === 'none') {
        // Platform staff / a user not tied to any tenant -- unchanged behavior, let
        // tenantGuard/subscriptionGuard decide from here exactly as before this feature existed.
        return of(true);
      }

      if (restored && memberships.some(m => m.tenantId === restored.tenantId)) {
        return tenantContext.selectTenant(restored.tenantId).pipe(map(() => true));
      }

      if (outcome === 'auto') {
        return tenantContext.selectTenant(memberships[0].tenantId).pipe(map(() => true));
      }

      tenantContext.clear();
      return of(router.createUrlTree(['/select-company'], { queryParams: { returnUrl: state.url } }));
    }),
    catchError(() => of(true)),
  );
};
