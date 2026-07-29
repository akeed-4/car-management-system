import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/** Drives the global loading overlay (see app.component.html) -- shows it for the duration of
 *  every HTTP request, regardless of which service made it. finalize() guarantees hide() runs
 *  on success, error, and unsubscription alike, so the counter can never get stuck above zero. */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loadingService.show();
    return next.handle(req).pipe(
      finalize(() => this.loadingService.hide()),
    );
  }
}
