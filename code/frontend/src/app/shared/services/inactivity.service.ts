import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { NotificationService } from './notification.service';
import { filter, Subscription } from 'rxjs';

/**
 * Serviço responsável por monitorar a inatividade do usuário
 * e realizar logout automático após período de inatividade.
 * 
 * Timeout: 29 minutos (1 minuto antes do timeout do backend de 30 minutos)
 * para evitar conflitos e erros de API.
 * 
 * IMPORTANTE: Só monitora quando o usuário está autenticado e em rotas protegidas.
 * Não interfere em rotas públicas.
 */
@Injectable({
  providedIn: 'root'
})
export class InactivityService implements OnDestroy {
  private timeoutId: any;
  private routerSubscription?: Subscription;
  
  // Timeout de 29 minutos (1740000 ms) - 1 minuto antes do backend (30min)
  // Isso evita que o usuário tente fazer requisições após a sessão expirar
  private readonly TIMEOUT_MS = 29 * 60 * 1000;

  // Rotas públicas onde o monitoramento não deve ocorrer
  private readonly PUBLIC_ROUTES = [
    '/login',
    '/esqueci-senha',
    '/redefinir-senha',
    '/landing',
    '/mural',
    '/adicionar-visitantes',
    '/emprestimo',
    '/atualizar-cadastro'
  ];

  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private notificationService = inject(NotificationService);

  constructor() {
    this.setupListener();
    this.setupRouteWatcher();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  /**
   * Configura os listeners de eventos de atividade do usuário
   */
  private setupListener(): void {
    // Monitorar eventos de atividade do usuário
    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => this.onUserActivity(), { passive: true });
    });
  }

  /**
   * Monitora mudanças de rota e ajusta o monitoramento conforme necessário
   */
  private setupRouteWatcher(): void {
    // Verificar na rota inicial
    this.checkAndAdjustMonitoring();

    // Monitorar mudanças de rota
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkAndAdjustMonitoring();
    });
  }

  /**
   * Verifica se deve iniciar ou parar o monitoramento baseado na rota e autenticação
   */
  private checkAndAdjustMonitoring(): void {
    const currentUrl = this.router.url;
    const isPublicRoute = this.isPublicRoute(currentUrl);
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated && !isPublicRoute) {
      // Usuário autenticado em rota protegida - iniciar/manter monitoramento
      this.resetTimer();
    } else {
      // Usuário não autenticado ou em rota pública - parar monitoramento
      this.clearTimer();
    }
  }

  /**
   * Verifica se a rota atual é pública
   */
  private isPublicRoute(url: string): boolean {
    return this.PUBLIC_ROUTES.some(route => url.startsWith(route));
  }

  /**
   * Tratado quando o usuário tem atividade (click, movimento, etc.)
   */
  private onUserActivity(): void {
    // Só resetar o timer se o usuário estiver autenticado e em rota protegida
    const currentUrl = this.router.url;
    const isPublicRoute = this.isPublicRoute(currentUrl);
    const isAuthenticated = this.authService.isAuthenticated();

    if (isAuthenticated && !isPublicRoute) {
      this.resetTimer();
    }
  }

  /**
   * Reseta o timer de inatividade
   * Executa fora do Angular Zone para otimizar performance
   */
  private resetTimer(): void {
    // Limpar timer anterior
    clearTimeout(this.timeoutId);

    // Executar fora do Angular Zone para não disparar change detection
    // a cada movimento do mouse (otimização de performance)
    this.ngZone.runOutsideAngular(() => {
      this.timeoutId = setTimeout(() => {
        // Executar dentro do Angular Zone quando o timeout ocorrer
        this.ngZone.run(() => this.handleTimeout());
      }, this.TIMEOUT_MS);
    });
  }

  /**
   * Trata o timeout de inatividade
   * Realiza logout automático se o usuário estiver autenticado e em rota protegida
   */
  private handleTimeout(): void {
    const currentUrl = this.router.url;
    const isPublicRoute = this.isPublicRoute(currentUrl);
    const isAuthenticated = this.authService.isAuthenticated();

    // Só fazer logout se ainda estiver autenticado e em rota protegida
    if (isAuthenticated && !isPublicRoute) {
      // Limpar estado de autenticação local
      this.authService.clearAuthState();
      
      // Parar o monitoramento
      this.clearTimer();
      
      // Mostrar notificação ao usuário
      this.notificationService.showInfo('Você foi desconectado por inatividade.');
      
      // Redirecionar para login
      this.router.navigate(['/login']);
    } else {
      // Se não estiver autenticado ou estiver em rota pública, apenas parar o timer
      this.clearTimer();
    }
  }

  /**
   * Limpa o timer de inatividade
   * Útil para limpar recursos quando necessário
   */
  public clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

