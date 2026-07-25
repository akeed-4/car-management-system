import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { TenantContextService } from '../services/tenant-context.service';
import { NotificationService } from '../services/notification.service';
import { resolveCompanySelection } from '../models/platform/company-selection-routing.util';

/** A 403/404 from selectTenant is a definitive "this tenant is no longer valid for this user"
 *  answer (membership revoked, tenant deleted) -- not a transient blip. Everything else (network
 *  failure, timeout, 5xx) is left to the caller's fail-open catchError. */
function isDefinitiveTenantFailure(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && (error.status === 403 || error.status === 404);
}

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
 * Fails OPEN on a transient lookup error (network failure, timeout, 5xx), same rationale as
 * tenantGuard/subscriptionGuard: don't lock out every existing single-company user over a
 * transient blip. Fails CLOSED only on a definitive 403/404 from selectTenant -- membership
 * revoked or the tenant itself deleted -- which clears tenant context and redirects to /login
 * with an error, instead of silently proceeding into a dashboard with no tenant context.
 */
export const companySelectedGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/registration'], { queryParams: { returnUrl: state.url } });
  }

  if (tenantContext.current()) {
    return true;
  }

  /** Wraps a selectTenant() call: a definitive 403/404 clears tenant context, shows an error, and
   *  redirects to /login; any other error (network/5xx/timeout) is rethrown for the outer
   *  catchError to handle by failing open. */
  const selectOrFailClosed = (tenantId: number): Observable<boolean | ReturnType<Router['createUrlTree']>> =>
    tenantContext.selectTenant(tenantId).pipe(
      map(() => true),
      catchError(error => {
        if (isDefinitiveTenantFailure(error)) {
          tenantContext.clear();
          notificationService.showError('PLATFORM.TENANT_NOT_FOUND');
          return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
        }
        return throwError(() => error);
      }),
    );

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
        return selectOrFailClosed(restored.tenantId);
      }

      if (outcome === 'auto') {
        return selectOrFailClosed(memberships[0].tenantId);
      }

      tenantContext.clear();
      return of(router.createUrlTree(['/select-company'], { queryParams: { returnUrl: state.url } }));
    }),
    catchError(() => of(true)),
  );
};
