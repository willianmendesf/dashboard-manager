import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../service/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Rotas públicas que não devem ser interceptadas
  const publicRoutes = ['/auth/login', '/auth/logout', '/auth/solicitar-reset', '/auth/redefinir-senha', '/usuarios/registro'];
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Se for erro 401 (Unauthorized) e não for rota pública
      if (error.status === 401 && !isPublicRoute) {
        // Limpar estado de autenticação local
        authService.clearAuthState();
        
        // Redirecionar para login apenas se não estiver já na página de login
        if (!router.url.includes('/login')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};

