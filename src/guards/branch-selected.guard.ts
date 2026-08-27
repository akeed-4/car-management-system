import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { BranchContextService } from '../services/branch-context.service';
import { NotificationService } from '../services/notification.service';
import { resolveBranchSelection } from '../models/platform/branch-selection-routing.util';

/** A 403/404/409 from selectBranch is a definitive "this branch is no longer valid for this
 *  user" answer (assignment revoked, branch deactivated) -- not a transient blip. Everything else
 *  (network failure, timeout, 5xx) is left to the caller's fail-open catchError. */
function isDefinitiveBranchFailure(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && (error.status === 403 || error.status === 404 || error.status === 409);
}

/**
 * Gates the app shell on "is a branch currently selected" -- mirrors companySelectedGuard one
 * level down the Company -> Branch hierarchy. Runs on the same route array, after
 * companySelectedGuard/tenantGuard/subscriptionGuard, so a tenant is already resolved (correct
 * database) by the time this guard reads Branch rows.
 *
 * Also serves as the "restore on app startup" step: reads the persisted selection from
 * localStorage, re-validates it server-side, clears+redirects to the picker if it's no longer
 * valid. Unlike companySelectedGuard, a definitive failure does NOT sign the user out or redirect
 * to /login -- Branch is a UI scope, not a security boundary baked into the JWT, so the correct
 * recovery is "pick a branch again", not "re-authenticate".
 *
 * Fails OPEN on a transient lookup error (network failure, timeout, 5xx) and on the "no branches
 * configured yet" case, so existing users/tenants that predate this feature are never locked out.
 */
export const branchSelectedGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const branchContext = inject(BranchContextService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true; // authGuard/companySelectedGuard on the same route already handle this case.
  }

  if (branchContext.current()) {
    return true;
  }

  const selectOrFailOpen = (branchId: number): Observable<boolean | ReturnType<Router['createUrlTree']>> =>
    branchContext.selectBranch(branchId).pipe(
      map(() => true),
      catchError(error => {
        if (isDefinitiveBranchFailure(error)) {
          branchContext.clear();
          notificationService.showError('PLATFORM.BRANCH_NOT_FOUND');
          return of(router.createUrlTree(['/select-branch'], { queryParams: { returnUrl: state.url } }));
        }
        return throwError(() => error);
      }),
    );

  const restored = branchContext.restoreFromStorage();

  return branchContext.loadMemberships().pipe(
    switchMap(memberships => {
      const outcome = resolveBranchSelection(memberships);

      if (outcome === 'none') {
        // No branches configured for this company yet -- unchanged behavior, proceed without a
        // branch scope rather than block every existing tenant that predates this feature.
        return of(true);
      }

      if (restored && memberships.some(m => m.branchId === restored.branchId)) {
        return selectOrFailOpen(restored.branchId);
      }

      if (outcome === 'auto') {
        return selectOrFailOpen(memberships[0].branchId);
      }

      branchContext.clear();
      return of(router.createUrlTree(['/select-branch'], { queryParams: { returnUrl: state.url } }));
    }),
    catchError(() => of(true)),
  );
};
