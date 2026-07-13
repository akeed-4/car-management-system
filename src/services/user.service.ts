import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/Users';
  private users = signal<User[]>([]);
  public users$ = this.users.asReadonly();

  private activeUsers = signal<User[]>([]);
  public activeUsers$ = this.activeUsers.asReadonly();

  constructor() {
    this.loadUsers();
    this.loadActiveUsers();
  }

  loadUsers() {
    this.getUsers().subscribe(users => this.users.set(users));
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
}
