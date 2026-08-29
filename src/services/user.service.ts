import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, tap } from 'rxjs';
import { User, UserRoleSummary } from '../models/user.model';
import { ChangePassword, MyProfile, UpdateMyProfile } from '../models/my-profile.model';
import { UserEffectivePermission } from '../models/user-permission.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/Users';
  private users = signal<User[]>([]);
  public users$ = this.users.asReadonly();

  private usersLoading = signal<boolean>(true);
  public usersLoading$ = this.usersLoading.asReadonly();

  private activeUsers = signal<User[]>([]);
  public activeUsers$ = this.activeUsers.asReadonly();

  constructor() {
    this.loadUsers();
    this.loadActiveUsers();
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.getUsers().pipe(finalize(() => this.usersLoading.set(false))).subscribe(users => this.users.set(users));
  }

  loadActiveUsers() {
    this.getActiveUsers().subscribe(users => this.activeUsers.set(users));
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/active`);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  addUser(user: Omit<User, 'id' | 'isLocked' | 'lockoutEnd'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user).pipe(
      tap(() => {
        this.loadUsers();
        this.loadActiveUsers();
      })
    );
  }

  updateUser(user: User): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${user.id}`, user).pipe(
      tap(() => {
        this.loadUsers();
        this.loadActiveUsers();
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.loadUsers();
        this.loadActiveUsers();
      })
    );
  }

  activateUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/activate`, {}).pipe(
      tap(() => {
        this.loadUsers();
        this.loadActiveUsers();
      })
    );
  }

  deactivateUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/deactivate`, {}).pipe(
      tap(() => {
        this.loadUsers();
        this.loadActiveUsers();
      })
    );
  }

  lockUser(id: number, durationMinutes?: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/lock`, { durationMinutes: durationMinutes ?? null }).pipe(
      tap(() => this.loadUsers())
    );
  }

  unlockUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/unlock`, {}).pipe(
      tap(() => this.loadUsers())
    );
  }

  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reset-password`, { newPassword });
  }

  assignRole(id: number, roleId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/roles`, { roleId }).pipe(
      tap(() => this.loadUsers())
    );
  }

  /** Full set of roles assigned to a user -- unlike `roleId`/`roleName` on the User list/get-by-id
   *  DTOs, which only ever carry the first role. */
  getUserRoles(id: number): Observable<UserRoleSummary[]> {
    return this.http.get<UserRoleSummary[]>(`${this.apiUrl}/${id}/roles`);
  }

  /** Adds one role without disturbing the user's other roles (unlike `assignRole`, which replaces
   *  the entire role set). */
  addUserRole(id: number, roleId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/roles/${roleId}`, {}).pipe(
      tap(() => this.loadUsers())
    );
  }

  removeUserRole(id: number, roleId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/roles/${roleId}`).pipe(
      tap(() => this.loadUsers())
    );
  }

  /** The user's full permission catalog with granted/denied state and role attribution, resolved
   *  server-side from their current role set -- this system has no direct per-user permission grant. */
  getUserEffectivePermissions(id: number): Observable<UserEffectivePermission[]> {
    return this.http.get<UserEffectivePermission[]>(`${this.apiUrl}/${id}/permissions`);
  }

  getMyProfile(): Observable<MyProfile> {
    return this.http.get<MyProfile>(`${this.apiUrl}/me`);
  }

  updateMyProfile(dto: UpdateMyProfile): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me`, dto);
  }

  changePassword(dto: ChangePassword): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, dto);
  }

  /** Returns the new site-relative avatar URL (e.g. "/uploads/avatars/12/abc.jpg") -- resolve
   *  against environment.origin when rendering it as an <img> src. */
  uploadMyAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${this.apiUrl}/me/avatar`, formData);
  }

  deleteMyAvatar(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/avatar`);
  }
}
