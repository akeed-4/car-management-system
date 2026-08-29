import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/AuthService.service';
import { TenantContextService } from '../services/tenant-context.service';
import { BranchContextService } from '../services/branch-context.service';
import { StoreContextService } from '../services/store-context.service';

/** Endpoints that must never trigger a refresh-and-retry: a 401 from these means "bad credentials
 *  / bad token / bad reset link", not "session expired", and retrying would either loop forever
 *  (refresh-token itself) or silently paper over a real auth failure. logout is included because
 *  a 401 there just means the token was already invalid -- an expected, harmless outcome for a
 *  fire-and-forget call, not something to refresh-and-retry. */
const AUTH_ENDPOINTS = ['/api/Users/login', '/api/Users/refresh-token', '/api/Users/forgot-password', '/api/Users/reset-password', '/api/Users/logout'];

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private tenantContext = inject(TenantContextService);
  private branchContext = inject(BranchContextService);
  private storeContext = inject(StoreContextService);
  private router = inject(Router);

  private isRefreshing = false;
  private refreshedToken$ = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const authedReq = token ? this.withToken(req, token) : req;

    return next.handle(authedReq).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint))
        ) {
          return this.handleUnauthorized(req, next);
        }
        return throwError(() => error);
      }),
    );
  }

  private withToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  /** Queues concurrent 401s behind a single in-flight refresh instead of firing one
   *  refresh-token call per failed request; each queued request retries once the new token
   *  (or a `null` on failure, which falls through to a hard logout) arrives. */
  private handleUnauthorized(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.authService.getRefreshToken()) {
      this.forceLogout();
      return throwError(() => new Error('Session expired'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshedToken$.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.refreshedToken$.next(response.token);
          return next.handle(this.withToken(req, response.token));
        }),
        catchError(error => {
          this.forceLogout();
          return throwError(() => error);
        }),
        finalize(() => { this.isRefreshing = false; }),
      );
    }

    return this.refreshedToken$.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap(token => next.handle(this.withToken(req, token))),
    );
  }

  private forceLogout(): void {
    this.authService.logout();
    this.tenantContext.clear();
    this.branchContext.clear();
    this.storeContext.clear();
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}
