import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../types/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/users'; // رابط الـ API
  private users = signal<User[]>([]);
  public users$ = this.users.asReadonly();

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.getUsers().subscribe(users => this.users.set(users));
  }

  // جلب جميع المستخدمين
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
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
