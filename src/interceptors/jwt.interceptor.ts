import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  /**
   * Intercepts HTTP requests and adds JWT token to Authorization header
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get JWT token from localStorage
    const token = this.getToken();

    // Clone request and add authorization header if token exists
    if (token) {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(clonedReq);
    }

    // If no token, proceed with original request
    return next.handle(req);
  }

  /**
   * Get JWT token from storage
   * Modify this method based on where you store your token
   */
  private getToken(): string | null {
    // Option 1: localStorage
    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('jwt_token');
    
    if (token) {
      return token;
    }

    // Option 2: sessionStorage
    const sessionToken = sessionStorage.getItem('access_token') || 
                         sessionStorage.getItem('token');
    
    if (sessionToken) {
      return sessionToken;
    }

    // Option 3: From OIDC service (if using angular-auth-oidc-client)
    // You can inject OidcSecurityService and get token from there
    // const oidcToken = this.oidcSecurityService.getAccessToken();
    
    return null;
  }
}
