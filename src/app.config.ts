import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { APP_ROUTES } from './app.routes';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { TenantHeaderInterceptor } from './interceptors/tenant.interceptor';
import { ApiResponseInterceptor } from './interceptors/api-response.interceptor';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

// Factory function for TranslateHttpLoader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideAnimations(),
    // withInterceptorsFromDi() is required for the classic HTTP_INTERCEPTORS-based interceptors
    // below to actually run -- provideHttpClient() alone ignores that DI token entirely (it only
    // picks up the newer functional withInterceptors([...]) API). Without it, neither
    // JwtInterceptor nor ApiResponseInterceptor ever executed: no request ever carried a Bearer
    // token, and no ApiResponse<T> envelope was ever auto-unwrapped -- which is exactly why
    // several services (SalesService, PurchasesService) had to hand-roll their own unwrap().
    provideHttpClient(withInterceptorsFromDi()),
    // Registered first so it's outermost -- covers the full request lifecycle including
    // JwtInterceptor's refresh-and-retry, instead of hiding the overlay after only the first
    // (pre-refresh) attempt.
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    },
    // Register JWT Interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    // Attaches X-Tenant-Id once a company is selected -- must run after JwtInterceptor so both
    // headers are present, order relative to ApiResponseInterceptor doesn't matter (that one only
    // touches responses).
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantHeaderInterceptor,
      multi: true
    },
    // Register ApiResponse unwrapping interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiResponseInterceptor,
      multi: true
    },
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ]
};
