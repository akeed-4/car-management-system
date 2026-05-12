import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
          const body = event.body as any;
          // If response follows ApiResponse<T> shape, unwrap `data` for consumers
          if ('data' in body || ('success' in body && 'message' in body)) {
            const unwrapped = body.data === undefined ? null : body.data;
            return event.clone({ body: unwrapped });
          }
        }
        return event;
      })
    );
  }
}
