import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Rotas públicas da API que não devem ser interceptadas
  // Inclui todas as rotas públicas configuradas no backend SecurityConfig
  const publicApiRoutes = [
    '/auth/login', 
    '/auth/logout', 
    '/auth/solicitar-reset', 
    '/auth/redefinir-senha', 
    '/usuarios/registro',
    '/public/',
    '/files/',
    '/emergency/',
    '/enrollments/request',
    '/enrollments/member/',
    '/enrollments/can-request/'
  ];

  // Rotas públicas do frontend onde não devemos redirecionar
  const publicFrontendRoutes = [
    '/login',
    '/esqueci-senha',
    '/redefinir-senha',
    '/landing',
    '/mural',
    '/adicionar-visitantes',
    '/emprestimo',
    '/atualizar-cadastro'
  ];

  const isPublicApiRoute = publicApiRoutes.some(route => req.url.includes(route));
  const isPublicFrontendRoute = publicFrontendRoutes.some(route => router.url.includes(route));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se for erro 401 (Unauthorized) ou 403 (Forbidden)
      if ([401, 403].includes(error.status)) {
        // Não fazer nada se for rota pública da API (permite requisições públicas falharem normalmente)
        if (isPublicApiRoute) {
          return throwError(() => error);
        }

        // Não redirecionar se estiver em rota pública do frontend
        // (usuário pode estar navegando em páginas públicas)
        if (isPublicFrontendRoute) {
          // Limpar estado local mas não redirecionar
          authService.clearAuthState();
          return throwError(() => error);
        }

        // Para rotas protegidas, limpar estado e redirecionar
        authService.clearAuthState();
        notificationService.showError('Sua sessão expirou. Por favor, faça login novamente.');
        
        // Redirecionar para login apenas se não estiver já na página de login
        if (!router.url.includes('/login')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

