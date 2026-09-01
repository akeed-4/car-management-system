import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, tap } from 'rxjs';
import { Role } from '../models/role.model';
import { environment } from '../environments/environment';
import { UserService } from './user.service';

export interface Permission {
  id: number;
  key: string;
  title: string;
  group: string;
}

/** Backend envelope every RolesController endpoint returns -- see ApiResponse<T> on the API side. */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type PermissionsList = {
  [group: string]: {
    title: string;
    permissions: { [key: string]: string };
  };
};

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private apiUrl = `${environment.origin}api/Roles`;
  private permissionsApiUrl = `${environment.origin}api/Roles/Permissions`;

  private roles = signal<Role[]>([]);
  public roles$ = this.roles.asReadonly();

  private permissionsListSignal = signal<PermissionsList>({});
  public permissionsList$ = this.permissionsListSignal.asReadonly();

  private rolesLoading = signal<boolean>(true);
  public rolesLoading$ = this.rolesLoading.asReadonly();

  private permissionsLoading = signal<boolean>(true);
  public permissionsLoading$ = this.permissionsLoading.asReadonly();

  public usersCountByRole = computed<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    for (const user of this.userService.users$()) {
      counts[user.roleId] = (counts[user.roleId] ?? 0) + 1;
    }
    return counts;
  });

  constructor() {
    this.loadRoles();
    this.loadPermissions();
  }

  getRoleById(id: number): Role | undefined {
    return this.roles().find(r => r.id === id);
  }

  loadRoles(): void {
    this.rolesLoading.set(true);
    this.getAllRoles().subscribe({
      error: error => console.error('Failed to load roles:', error)
    });
  }

  loadPermissions(): void {
    this.permissionsLoading.set(true);
    this.getPermissionsList().subscribe({
      error: error => console.error('Failed to load permissions:', error)
    });
  }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<ApiResponse<Role[]>>(`${this.apiUrl}/GetAll`).pipe(
      map(response => response.data),
      tap(roles => this.roles.set(roles)),
      finalize(() => this.rolesLoading.set(false))
    );
  }

  getRoleByIdFromApi(id: number): Observable<Role> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createRole(name: string, permissionKeys: string[]): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.apiUrl}/CreateRole`, { name, permissionKeys }).pipe(
      map(response => response.data),
      tap(() => this.loadRoles())
    );
  }

  updateRolePermissions(id: number, name: string | null, permissionKeys: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/UpdateRole/${id}`, { name, permissionKeys }).pipe(
      tap(() => this.loadRoles())
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadRoles())
    );
  }

  getRolePermissions(id: number): Observable<{ [key: string]: boolean }> {
    return this.http.get<{ [key: string]: boolean }>(`${this.apiUrl}/${id}/permissions`);
  }

  getPermissionsList(): Observable<PermissionsList> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.permissionsApiUrl}/GetAll`).pipe(
      map(response => {
        const permissions = response.data;
        const grouped: PermissionsList = {};
        for (const p of permissions) {
          if (!grouped[p.group]) {
            grouped[p.group] = { title: p.group, permissions: {} };
          }
          grouped[p.group].permissions[p.key] = p.title;
        }
        return grouped;
      }),
      tap(grouped => this.permissionsListSignal.set(grouped)),
      finalize(() => this.permissionsLoading.set(false))
    );
  }
}
