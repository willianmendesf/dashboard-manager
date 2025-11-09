import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(), // REMOVIDO: JwtInterceptor - não precisamos mais, cookies são gerenciados automaticamente

    /*provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-rigth',
      preventDuplicates: true,
      maxOpened: 3,
    }),*/
  ]
};

