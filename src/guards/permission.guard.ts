import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    if (permissionService.hasPermission(permission)) {
      return true;
    }
    const router = inject(Router);
    return router.createUrlTree(['/dashboard']);
  };
}
