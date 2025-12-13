import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Mock user permissions - in real app, get from auth service or API
  private userPermissions: string[] = [
    'branch.view', 'branch.create', 'branch.edit', 'branch.delete',
    'company.view', 'company.create', 'company.edit', 'company.delete',
    'store.view', 'store.create', 'store.edit', 'store.delete'
  ];

  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission);
  }

  // Check if user has any of the permissions
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  // Check if user has all permissions
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }
}