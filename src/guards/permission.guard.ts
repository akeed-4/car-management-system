import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';

/**
 * RoleService loads roles asynchronously (HTTP call kicked off in its constructor), while
 * PermissionService.hasPermission() reads the roles signal synchronously. On a fresh navigation
 * (direct URL entry, hard refresh) the guard could previously run before that HTTP call resolved,
 * see an empty roles list, and silently redirect to /dashboard even for a fully authorized user.
 * Waiting for rolesLoading$ to flip false closes that race.
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const roleService = inject(RoleService);
    const router = inject(Router);

    return toObservable(roleService.rolesLoading$).pipe(
      filter(loading => !loading),
      take(1),
      map(() => permissionService.hasPermission(permission)
        ? true
        : router.createUrlTree(['/dashboard'])),
    );
  };
}
