import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  name: string;
  profileName: string;
  fotoUrl?: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private currentUser: LoginResponse | null = null;
  private authStatus$ = new BehaviorSubject<boolean>(this.isAuthenticated());

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  /**
   * Login user
   * IMPORTANTE: Usa withCredentials para enviar/receber cookies de sessão
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}auth/login`, 
      credentials,
      { withCredentials: true } // CRÍTICO: Enviar/receber cookies
    ).pipe(
      map(response => {
        console.log('========================================');
        console.log('LOGIN BEM-SUCEDIDO');
        console.log('Cookie de sessão recebido automaticamente pelo navegador');
        console.log('Resposta do servidor:', response);
        console.log('========================================');
        
        // REMOVIDO: Não precisamos mais salvar token no localStorage
        // O Spring Security gerencia a sessão via cookie JSESSIONID
        
        // Salvar apenas os dados do usuário (sem token)
        this.saveUser(response);
        this.currentUser = response;
        this.authStatus$.next(true);
        
        return response;
      })
    );
  }

  /**
   * Logout user
   * IMPORTANTE: Chama o endpoint de logout do Spring Security para invalidar a sessão
   */
  logout(): void {
    // Chamar o endpoint de logout do Spring Security
    this.http.post(`${this.apiUrl}auth/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          console.log('Logout realizado com sucesso');
          // Limpar dados locais
          localStorage.removeItem(this.userKey);
          this.currentUser = null;
          this.authStatus$.next(false);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Erro ao fazer logout:', err);
          // Mesmo em caso de erro, limpar dados locais
          localStorage.removeItem(this.userKey);
          this.currentUser = null;
          this.authStatus$.next(false);
          this.router.navigate(['/login']);
        }
      });
  }

  /**
   * REMOVIDO: getToken() - Não precisamos mais de token JWT
   * A autenticação é gerenciada via cookie de sessão pelo Spring Security
   */
  
  /**
   * REMOVIDO: saveToken() - Não precisamos mais salvar token
   * O Spring Security gerencia a sessão via cookie JSESSIONID
   */

  /**
   * Save user data to localStorage
   */
  saveUser(user: LoginResponse): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUser = user;
  }

  /**
   * Load user from localStorage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data from storage', e);
        this.logout();
      }
    }
  }

  /**
   * Get current user
   * If currentUser is null, tries to load from localStorage
   */
  getCurrentUser(): LoginResponse | null {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Try to load from localStorage if not already loaded
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        return this.currentUser;
      } catch (e) {
        console.error('Error parsing user data from storage', e);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Check if user is authenticated
   * Simplificado: Verifica apenas se há dados do usuário salvos
   * A validação real da sessão é feita pelo Spring Security no backend
   */
  isAuthenticated(): boolean {
    // Verificar se há dados do usuário salvos
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) {
      return false;
    }
    
    try {
      const user = JSON.parse(userStr);
      return user && user.id != null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get user roles/permissions from current user data
   * REMOVIDO: Dependência de token JWT - agora usa dados do usuário salvos
   * Usa getCurrentUser() que automaticamente carrega do localStorage se necessário
   */
  getUserPermissions(): string[] {
    const user = this.getCurrentUser();
    return user?.permissions || [];
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.getUserPermissions();
    return permissions.some(perm => userPermissions.includes(perm));
  }

  /**
   * Get authentication status observable
   */
  getAuthStatus(): Observable<boolean> {
    return this.authStatus$.asObservable();
  }

  /**
   * REMOVIDO: decodeToken() - Não precisamos mais decodificar tokens JWT
   * A autenticação é gerenciada via cookie de sessão pelo Spring Security
   */
}

