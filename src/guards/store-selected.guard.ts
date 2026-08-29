import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/AuthService.service';
import { StoreContextService } from '../services/store-context.service';
import { NotificationService } from '../services/notification.service';
import { resolveStoreSelection } from '../models/platform/store-selection-routing.util';

/** A 403/404/409 from selectStore is a definitive "this store is no longer valid for this user"
 *  answer (UserStoreAssignment revoked, store deactivated) -- not a transient blip. Everything
 *  else (network failure, timeout, 5xx) is left to the caller's fail-open catchError. */
function isDefinitiveStoreFailure(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && (error.status === 403 || error.status === 404 || error.status === 409);
}

/**
 * Gates the app shell on "is a store currently selected" -- Store (not Branch) is the end-user
 * facing "Showroom" concept in this system, authorized independently of Branch via
 * UserStoreAssignment. Replaces branchSelectedGuard in the main route's canActivate chain.
 *
 * Also serves as the "restore on app startup" step: reads the persisted selection from
 * localStorage, re-validates it server-side, clears+redirects to the picker if it's no longer
 * valid. A definitive failure does NOT sign the user out or redirect to /login -- Store is a UI
 * scope, not a security boundary baked into the JWT, so the correct recovery is "pick a store
 * again", not "re-authenticate".
 *
 * Fails OPEN on a transient lookup error (network failure, timeout, 5xx) and on the "no stores
 * configured yet" case, so existing users/tenants that predate this feature are never locked out.
 */
export const storeSelectedGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const storeContext = inject(StoreContextService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true; // authGuard/companySelectedGuard on the same route already handle this case.
  }

  if (storeContext.current()) {
    return true;
  }

  const selectOrFailOpen = (storeId: number): Observable<boolean | ReturnType<Router['createUrlTree']>> =>
    storeContext.selectStore(storeId).pipe(
      map(() => true),
      catchError(error => {
        if (isDefinitiveStoreFailure(error)) {
          storeContext.clear();
          notificationService.showError('PLATFORM.STORE_NOT_FOUND');
          return of(router.createUrlTree(['/select-store'], { queryParams: { returnUrl: state.url } }));
        }
        return throwError(() => error);
      }),
    );

  const restored = storeContext.restoreFromStorage();

  return storeContext.loadMemberships().pipe(
    switchMap(stores => {
      const outcome = resolveStoreSelection(stores);

      if (outcome === 'none') {
        // No stores assigned to this caller yet -- unchanged behavior, proceed without a store
        // scope rather than block every existing tenant that predates this feature.
        return of(true);
      }

      if (restored && stores.some(s => s.storeId === restored.storeId)) {
        return selectOrFailOpen(restored.storeId);
      }

      if (outcome === 'auto') {
        return selectOrFailOpen(stores[0].storeId);
      }

      storeContext.clear();
      return of(router.createUrlTree(['/select-store'], { queryParams: { returnUrl: state.url } }));
    }),
    catchError(() => of(true)),
  );
};
