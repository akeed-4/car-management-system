import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Role } from '../models/role.model';
import { environment } from '../environments/environment';

export interface Permission {
  id: number;
  key: string;
  title: string;
  group: string;
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
  private apiUrl = `${environment.origin}api/Roles`;
  private permissionsApiUrl = `${environment.origin}api/Permissions`;

  private roles = signal<Role[]>([]);
  public roles$ = this.roles.asReadonly();

  private permissionsListSignal = signal<PermissionsList>({});
  public permissionsList$ = this.permissionsListSignal.asReadonly();

  constructor() {
    this.loadRoles();
    this.loadPermissions();
  }

  getRoleById(id: number): Role | undefined {
    return this.roles().find(r => r.id === id);
  }

  loadRoles(): void {
    this.getAllRoles().subscribe({
      error: error => console.error('Failed to load roles:', error)
    });
  }

  loadPermissions(): void {
    this.getPermissionsList().subscribe({
      error: error => console.error('Failed to load permissions:', error)
    });
  }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => this.roles.set(roles))
    );
  }

  getRoleByIdFromApi(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  createRole(name: string, permissionKeys: string[]): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, { name, permissionKeys }).pipe(
      tap(() => this.loadRoles())
    );
  }

  updateRolePermissions(id: number, name: string | null, permissionKeys: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, { name, permissionKeys }).pipe(
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
    return this.http.get<Permission[]>(this.permissionsApiUrl).pipe(
      map(permissions => {
        const grouped: PermissionsList = {};
        for (const p of permissions) {
          if (!grouped[p.group]) {
            grouped[p.group] = { title: p.group, permissions: {} };
          }
          grouped[p.group].permissions[p.key] = p.title;
        }
        return grouped;
      }),
      tap(grouped => this.permissionsListSignal.set(grouped))
    );
  }
}
