import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { login } from '../components/auth/login/login.model';
import { LocalStorageService } from './local-storage.service';

export interface AppLoginResponse {
  id: number;
  name: string;
  roleName: string;
  token: string;
}

const CURRENT_USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.origin.replace(/\/+$/, '')}/api/Users`;
  private localStorageService = inject(LocalStorageService);

  constructor(private http: HttpClient) {}

  login(login: login): Observable<AppLoginResponse> {
    return this.http.post<AppLoginResponse>(`${this.apiUrl}/login`, login).pipe(
      tap(response => {
        if (response?.token) {
          this.localStorageService.setItem('access_token', response.token);
          this.localStorageService.setItem(CURRENT_USER_KEY, JSON.stringify(response));
        }
      })
    );
  }

  logout(): void {
    this.localStorageService.removeItem('access_token');
    this.localStorageService.removeItem(CURRENT_USER_KEY);
  }

  getCurrentUser(): AppLoginResponse | null {
    const raw = this.localStorageService.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.localStorageService.getItem('access_token');
  }
}