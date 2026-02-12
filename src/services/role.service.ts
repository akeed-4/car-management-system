import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Role } from '../models/role.model';
import { environment } from '../environments/environment';

type PermissionsList = {
  [key: string]: {
    title: string;
    permissions: { [key: string]: string };
  };
};

const INITIAL_PERMISSIONS_LIST: PermissionsList = {};

export const PERMISSIONS_LIST = INITIAL_PERMISSIONS_LIST;


@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.origin}/api/roles`; // API endpoint for roles
  private permissionsApiUrl = `${environment.origin}/api/permissions`; // API endpoint for permissions

  private nextId = signal(4);
  private roles = signal<Role[]>([
    {
      id: 1,
      name: 'مدير النظام',
      permissions: Object.values(PERMISSIONS_LIST).reduce((acc, group) => {
        Object.keys(group.permissions).forEach(key => acc[key] = true);
        return acc;
      }, {} as { [key: string]: boolean })
    },
    {
      id: 2,
      name: 'مندوب مبيعات',
      permissions: {
        view_dashboard: true,
        view_inventory: true,
        view_sales: true,
        add_sales_invoice: true,
        manage_customers: true,
        manage_installments: true,
        manage_sale: true,
      }
    },
    { id: 3, name: 'محاسب', permissions: {
      view_financial_reports: true,
      view_tax_reports: true,
      view_sales: true,
      view_procurement: true,
    } },
  ]);

  private permissionsListSignal = signal<PermissionsList>(PERMISSIONS_LIST);

  public roles$ = this.roles.asReadonly();
  public permissionsList$ = this.permissionsListSignal.asReadonly();

  constructor() {
    // Load roles and permissions from API on service initialization
    this.loadRolesFromApi();
    this.loadPermissionsFromApi();
  }

  getRoleById(id: number): Role | undefined {
    return this.roles().find(r => r.id === id);
  }

  addRole(name: string): Role {
    const newRole: Role = {
      id: this.nextId(),
      name,
      permissions: {},
    };
    this.roles.update(roles => [...roles, newRole]);
    this.nextId.update(id => id + 1);
    return newRole;
  }

  updateRole(updatedRole: Role) {
    this.roles.update(roles =>
      roles.map(r => (r.id === updatedRole.id ? updatedRole : r))
    );
  }
  
  deleteRole(id: number) {
    // Should add logic to check if role is in use before deleting
    this.roles.update(roles => roles.filter(r => r.id !== id));
  }

  // ==================== API METHODS ====================

  /**
   * API Integration for Role and Permission Management
   *
   * Backend API Endpoints:
   * - GET    /api/roles           - Get all roles
   * - GET    /api/roles/:id       - Get role by ID
   * - POST   /api/roles           - Create new role
   * - PUT    /api/roles/:id       - Update role
   * - DELETE /api/roles/:id       - Delete role
   * - GET    /api/roles/:id/permissions - Get permissions for a role
   * - GET    /api/permissions     - Get permissions list
   *
   * Expected API Response Format for roles:
   * {
   *   "id": 1,
   *   "name": "مدير النظام",
   *   "permissions": {
   *     "view_dashboard": true,
   *     "view_inventory": true,
   *     ...
   *   }
   * }
   *
   * Expected API Response Format for permissions:
   * {
   *   "dashboard": {
   *     "title": "لوحة التحكم",
   *     "permissions": { "view_dashboard": "عرض لوحة التحكم" }
   *   },
   *   ...
   * }
   *
   * Usage Examples:
   * - this.roleService.getAllRoles().subscribe(roles => console.log(roles));
   * - this.roleService.createRole({name: 'New Role', permissions: {}}).subscribe();
   * - this.roleService.updateRoleViaApi(role).subscribe();
   * - this.roleService.deleteRoleViaApi(roleId).subscribe();
   * - this.roleService.getRolePermissions(roleId).subscribe(perms => console.log(perms));
   * - this.roleService.getPermissionsList().subscribe(perms => console.log(perms));
   */

  /**
   * Get all roles from API
   */
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => {
        // Update local signal with API data
        this.roles.set(roles);
        // Update nextId based on highest ID from API
        const maxId = roles.length > 0 ? Math.max(...roles.map(r => r.id)) : 3;
        this.nextId.set(maxId + 1);
      })
    );
  }

  /**
   * Get role by ID from API
   */
  getRoleByIdFromApi(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new role via API
   */
  createRole(role: Omit<Role, 'id'>): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role).pipe(
      tap(newRole => {
        // Add to local signal
        this.roles.update(roles => [...roles, newRole]);
      })
    );
  }

  /**
   * Update role via API
   */
  updateRoleViaApi(role: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}/${role.id}`, role).pipe(
      tap(updatedRole => {
        // Update local signal
        this.roles.update(roles =>
          roles.map(r => r.id === updatedRole.id ? updatedRole : r)
        );
      })
    );
  }

  /**
   * Delete role via API
   */
  deleteRoleViaApi(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove from local signal
        this.roles.update(roles => roles.filter(r => r.id !== id));
      })
    );
  }

  /**
   * Get permissions for a specific role by ID from API
   */
  getRolePermissions(id: number): Observable<{ [key: string]: boolean }> {
    return this.http.get<{ [key: string]: boolean }>(`${this.apiUrl}/${id}/permissions`);
  }

  /**
   * Get permissions list from API
   */
  getPermissionsList(): Observable<PermissionsList> {
    return this.http.get<PermissionsList>(this.permissionsApiUrl).pipe(
      tap(permissions => {
        // Update local signal with API data
        this.permissionsListSignal.set(permissions);
      })
    );
  }

  /**
   * Load roles from API on service initialization
   */
  loadRolesFromApi(): void {
    this.getAllRoles().subscribe({
      next: (roles) => {
        console.log('Roles loaded from API:', roles);
      },
      error: (error) => {
        console.error('Failed to load roles from API:', error);
        // Keep local roles as fallback
      }
    });
  }

  /**
   * Load permissions from API on service initialization
   */
  loadPermissionsFromApi(): void {
    this.getPermissionsList().subscribe({
      next: (permissions) => {
        console.log('Permissions loaded from API:', permissions);
      },
      error: (error) => {
        console.error('Failed to load permissions from API:', error);
        // Set to empty permissions on error
        this.permissionsListSignal.set({});
      }
    });
  }
}
