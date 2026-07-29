import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/AuthService.service';

/** Gates /platform/* routes -- the backend already enforces this correctly via
 *  [Authorize(Roles = "PlatformAdmin")] on every platform controller (see PlatformAdminRoleSeeder);
 *  this guard only prevents a non-admin from navigating into the empty/erroring UI shell, matching
 *  how permissionGuard gates tenant-level screens. isPlatformAdmin is set on the login response
 *  (see UserService.BuildLoginResponseAsync backend-side) -- distinct from roleName, which
 *  reflects the tenant-level Role/Permission system, not this separate Identity role. */
export function platformAdminGuard(): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    if (authService.currentUser()?.isPlatformAdmin) {
      return true;
    }
    const router = inject(Router);
    return router.createUrlTree(['/dashboard']);
  };
}
