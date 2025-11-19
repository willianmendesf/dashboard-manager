import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../services/notification.service';
import { isPublicFrontendRoute, isPublicApiRoute } from '../utils/route-utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const isPublicApi = isPublicApiRoute(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if ([401, 403].includes(error.status)) {
        if (isPublicApi) {
          return throwError(() => error);
        }

        const currentUrl = router.url || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
        const isPublicFrontend = isPublicFrontendRoute(currentUrl);

        if (isPublicFrontend) {
          return throwError(() => error);
        }

        authService.clearAuthState();
        notificationService.showError('Sua sessão expirou. Por favor, faça login novamente.');
        
        const finalUrl = router.url || (typeof window !== 'undefined' ? window.location.pathname : '') || '';
        if (!isPublicFrontendRoute(finalUrl)) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

