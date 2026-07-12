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

  // جلب جميع المستخدمين
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // جلب المستخدمين النشطين فقط
  getActiveUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/active`);
  }

  // جلب مستخدم واحد حسب ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // إضافة مستخدم جديد
  addUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  // تحديث مستخدم موجود
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
  }

  // حذف مستخدم
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
