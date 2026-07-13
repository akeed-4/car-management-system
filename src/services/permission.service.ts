import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './AuthService.service';
import { RoleService } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);
  private roleService = inject(RoleService);

  private currentRolePermissions = computed(() => {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.roleName) {
      return {} as { [key: string]: boolean };
    }
    const role = this.roleService.roles$().find(r => r.name === currentUser.roleName);
    return role?.permissions || {};
  });

  hasPermission(permission: string): boolean {
    return !!this.currentRolePermissions()[permission];
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }
}
