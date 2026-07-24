import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { login } from '../components/auth/login/login.model';

export interface AppLoginResponse {
  id: number;
  name: string;
  roleName: string;
  token: string;
  /** Optional because existing /Users/login callers predate this field; self-registration
   *  (PlatformService.selfRegisterTenant) always returns it, and the payment step needs it to
   *  attach a customer email to the Tap Card SDK transaction. */
  email?: string;
  /** Optional for the same reason -- callers that don't return one simply can't be silently
   *  refreshed; JwtInterceptor's 401 handling falls back to a hard logout in that case. */
  refreshToken?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const CURRENT_USER_KEY = 'current_user';
/** Not itself sensitive -- just remembers *where* the real session was written so a silent
 *  refresh-token exchange re-persists to the same place (see JwtInterceptor). Always in
 *  localStorage regardless of the Remember Me choice, since it has to survive to be read. */
const REMEMBER_ME_KEY = 'remember_me';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.origin.replace(/\/+$/, '')}/api/Users`;
  private http = inject(HttpClient);

  login(credentials: login, rememberMe = true): Observable<AppLoginResponse> {
    return this.http.post<AppLoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.setSession(response, rememberMe))
    );
  }

  forgotPassword(dto: ForgotPasswordDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, dto);
  }

  resetPassword(dto: ResetPasswordDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, dto);
  }

  /** POST /api/Users/refresh-token, exchanging the stored refresh token for a new access token.
   *  Called by JwtInterceptor on a 401; also usable on app bootstrap to silently renew a
   *  near-expired session. Re-persists to whichever storage the original login used. */
  refreshToken(): Observable<AppLoginResponse> {
    const refreshToken = this.getRefreshToken();
    const rememberMe = this.getRememberMe();
    return this.http.post<AppLoginResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => this.setSession(response, rememberMe))
    );
  }

  /** Persists a login/registration/refresh response as the active session. Shared by login(),
   *  refreshToken(), and RegistrationComponent, which auto-signs the user in immediately after
   *  self-registration. `rememberMe` picks localStorage (survives browser restarts, i.e.
   *  auto-login) vs sessionStorage (cleared when the tab/browser closes). */
  setSession(response: AppLoginResponse, rememberMe = true): void {
    if (!response?.token) return;

    // Clear both storages first so a re-login with a different Remember Me choice can't leave a
    // stale, still-valid token sitting in the storage that's no longer authoritative.
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);

    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(ACCESS_TOKEN_KEY, response.token);
    store.setItem(CURRENT_USER_KEY, JSON.stringify(response));
    if (response.refreshToken) {
      store.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
  }

  logout(): void {
    this.clearStorage(localStorage);
    this.clearStorage(sessionStorage);
    localStorage.removeItem(REMEMBER_ME_KEY);
  }

  getCurrentUser(): AppLoginResponse | null {
    const raw = localStorage.getItem(CURRENT_USER_KEY) || sessionStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private getRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  }

  private clearStorage(storage: Storage): void {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(CURRENT_USER_KEY);
  }
}
