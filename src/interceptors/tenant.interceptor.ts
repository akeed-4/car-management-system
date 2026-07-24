import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TenantContextService } from '../services/tenant-context.service';

/** Attaches X-Tenant-Id (the currently selected company) to every outgoing request once one has
 *  been selected. No header is sent before that -- login, self-registration, and plan browsing
 *  all work exactly as before. The backend's TenantResolutionMiddleware cross-checks this header
 *  against the JWT's own tenantId claim; it is never trusted as a source of truth by itself. */
@Injectable()
export class TenantHeaderInterceptor implements HttpInterceptor {
  private tenantContext = inject(TenantContextService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const tenantId = this.tenantContext.current()?.tenantId;
    const scopedReq = tenantId ? req.clone({ setHeaders: { 'X-Tenant-Id': String(tenantId) } }) : req;
    return next.handle(scopedReq);
  }
}
