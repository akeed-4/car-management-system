

import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';
import { AppComponent } from './src/app.component';
import { APP_ROUTES } from './src/app.routes';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { importProvidersFrom } from '@angular/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { provideAuth } from 'angular-auth-oidc-client';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ToastrModule } from 'ngx-toastr';
import { provideToastr } from 'ngx-toastr';



// Register Arabic locale data
registerLocaleData(localeAr);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withHashLocation()),
    provideHttpClient(),
    provideAnimations(),
    provideNativeDateAdapter(),
    provideAuth({
      config: {
        authority: 'https://example.com',
        redirectUrl: window.location.origin,
        clientId: 'example-client',
        scope: 'openid profile',
        responseType: 'code',
      },
    }),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        }
      })
    ),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true
    }),
  ],
}).catch((err) => console.error(err));
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}