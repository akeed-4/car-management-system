import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, tap } from 'rxjs';
import { Role } from '../models/role.model';
import { environment } from '../environments/environment';
import { UserService } from './user.service';
import { TranslateService } from '@ngx-translate/core';
import { permissionTranslationKey } from './permission-translation.util';

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
  private translate = inject(TranslateService);
  private apiUrl = `${environment.origin}api/Roles`;
  private permissionsApiUrl = `${environment.origin}api/Roles/Permissions`;

  private roles = signal<Role[]>([]);
  public roles$ = this.roles.asReadonly();

  /** Raw permissions from the API (Key/Title/Group untranslated) -- kept so labels can be
   *  re-resolved instantly on a language switch without a network round-trip. */
  private rawPermissions = signal<Permission[]>([]);

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
    // Runtime language switching (Requirement 4): re-resolve every label from the already-loaded
    // raw permissions -- no need to re-fetch from the API just to change the display language.
    // Also re-resolve once the initial translation file finishes loading (translate.instant()
    // above may have run before ngx-translate's HTTP loader resolved, in which case it silently
    // fell back to the raw backend Title -- this corrects it as soon as the real translations
    // are available, without waiting for an actual language switch).
    this.translate.onLangChange.subscribe(() => this.reresolvePermissionLabels());
    this.translate.onDefaultLangChange.subscribe(() => this.reresolvePermissionLabels());
  }

  private reresolvePermissionLabels(): void {
    if (this.rawPermissions().length > 0) {
      this.permissionsListSignal.set(this.buildPermissionsList(this.rawPermissions()));
    }
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
      map(response => response.data),
      tap(permissions => this.rawPermissions.set(permissions)),
      map(permissions => this.buildPermissionsList(permissions)),
      tap(grouped => this.permissionsListSignal.set(grouped)),
      finalize(() => this.permissionsLoading.set(false))
    );
  }

  /** Permission.key is the stable authorization identity and never changes; only the label shown
   *  here is localized (Requirement 4), via a translation key derived from the key (see
   *  permissionTranslationKey) with the raw backend Title as a fallback for any permission not yet
   *  translated -- never a missing/blank label. Group titles have no seeded translation source
   *  today (Group is a plain display string, not a stable code), so they render as-is. */
  private buildPermissionsList(permissions: Permission[]): PermissionsList {
    const grouped: PermissionsList = {};
    for (const p of permissions) {
      if (!grouped[p.group]) {
        grouped[p.group] = { title: p.group, permissions: {} };
      }
      const translationKey = permissionTranslationKey(p.key);
      const translated = this.translate.instant(translationKey);
      grouped[p.group].permissions[p.key] = translated !== translationKey ? translated : p.title;
    }
    return grouped;
  }
}
