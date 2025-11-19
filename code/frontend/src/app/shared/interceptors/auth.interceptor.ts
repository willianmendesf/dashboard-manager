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

  // Verificar se a requisição é para uma rota pública da API
  const isPublicApi = isPublicApiRoute(req.url);
  
  // Verificar se estamos em uma rota pública do frontend
  // Usa uma verificação mais robusta que considera tanto a URL atual quanto a snapshot
  const currentUrl = router.url || window.location.pathname || '';
  const isPublicFrontend = isPublicFrontendRoute(currentUrl);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se for erro 401 (Unauthorized) ou 403 (Forbidden)
      if ([401, 403].includes(error.status)) {
        // Não fazer nada se for rota pública da API (permite requisições públicas falharem normalmente)
        if (isPublicApi) {
          return throwError(() => error);
        }

        // Não fazer nada se estiver em rota pública do frontend
        // (usuário pode estar navegando em páginas públicas e requisições podem falhar normalmente)
        // Não limpar estado, não mostrar notificação, não redirecionar
        if (isPublicFrontend) {
          return throwError(() => error);
        }

        // Para rotas protegidas, limpar estado e redirecionar
        authService.clearAuthState();
        notificationService.showError('Sua sessão expirou. Por favor, faça login novamente.');
        
        // Redirecionar para login apenas se não estiver já na página de login
        const finalUrl = router.url || window.location.pathname || '';
        if (!isPublicFrontendRoute(finalUrl)) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

