import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // --- DEPURAÇÃO: INTERCEPTOR ATIVADO ---
    console.log('========================================');
    console.log('INTERCEPTOR ATIVADO para:', request.url);
    console.log('Método HTTP:', request.method);
    
    // 1. PULAR ROTAS PÚBLICAS (login, reset de senha, etc.)
    if (request.url.includes('/auth/') || request.url.includes('/usuarios/registro')) {
      console.log('Rota pública detectada, pulando interceptor');
      console.log('========================================');
      return next.handle(request);
    }

    // 2. TENTAR PEGAR O TOKEN DO LOCALSTORAGE
    // CORREÇÃO: Usar a mesma chave que o AuthService usa ('auth_token')
    console.log('Buscando token no localStorage com chave: auth_token');
    const token = localStorage.getItem('auth_token'); // CORREÇÃO: chave sincronizada com AuthService
    
    // 3. SE O TOKEN EXISTIR, CLONAR A REQUISIÇÃO E ADICIONAR O HEADER
    if (token) {
      console.log('Token ENCONTRADO no localStorage:', token.substring(0, 50) + '...');
      console.log('Tamanho do token:', token.length, 'caracteres');
      
      const clonedReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Header "Authorization" ANEXADO à requisição');
      console.log('Header completo:', clonedReq.headers.get('Authorization') ? 'Bearer ' + token.substring(0, 50) + '...' : 'NÃO ENCONTRADO');
      console.log('========================================');
      
      return next.handle(clonedReq);
    } else {
      // 4. Se não houver token, logar erro e enviar requisição original
      console.error('========================================');
      console.error('ERRO INTERCEPTOR: Não achou "auth_token" no localStorage!');
      console.error('URL da requisição:', request.url);
      console.error('Chaves no localStorage:', Object.keys(localStorage));
      console.error('Conteúdo do localStorage:');
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          console.error(`  ${key}:`, value.length > 50 ? value.substring(0, 50) + '...' : value);
        } else {
          console.error(`  ${key}: NULL`);
        }
      });
      console.error('Verificando se "auth_token" existe:', localStorage.getItem('auth_token') ? 'SIM' : 'NÃO');
      console.error('========================================');
      
      return next.handle(request);
    }
  }
}

