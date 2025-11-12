import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ConnectionStatus {
  is_connected: boolean;
  is_logged_in: boolean;
  device_id?: string;
  lastAttempt?: string;
  isReconnecting?: boolean;
  error?: string;
}

export interface AutoReconnectStatus {
  enabled: boolean;
  intervalMinutes: number;
}

export interface ReconnectResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface QRCodeLoginResponse {
  success: boolean;
  qrLink?: string;
  qrDuration?: number;
  error?: string;
}

export interface CodeLoginResponse {
  success: boolean;
  pairCode?: string;
  error?: string;
}

export interface LoginStatusResponse {
  success: boolean;
  isLoggedIn?: boolean;
  isConnected?: boolean;
  deviceId?: string;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappsService {
  constructor(private http: HttpClient) {}

  private apiUrl = environment.apiUrl;

  public send(data : any) {
    const localUrl = `${this.apiUrl}/whatsapp`;
    return this.http.post<any>(localUrl, data);
  }

  /**
   * Obtém o status da conexão WhatsApp
   */
  public getConnectionStatus(): Observable<ConnectionStatus> {
    return this.http.get<ConnectionStatus>(`${this.apiUrl}/whatsapp/connection/status`, { withCredentials: true });
  }

  /**
   * Reconecta manualmente à API WhatsApp
   */
  public reconnect(): Observable<ReconnectResult> {
    return this.http.post<ReconnectResult>(`${this.apiUrl}/whatsapp/connection/reconnect`, {}, { withCredentials: true });
  }

  /**
   * Obtém o status da reconexão automática
   */
  public getAutoReconnectStatus(): Observable<AutoReconnectStatus> {
    return this.http.get<AutoReconnectStatus>(`${this.apiUrl}/whatsapp/connection/auto-reconnect/enabled`, { withCredentials: true });
  }

  /**
   * Ativa ou desativa reconexão automática
   */
  public toggleAutoReconnect(enabled: boolean): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/whatsapp/connection/auto-reconnect/toggle`, { enabled }, { withCredentials: true });
  }

  /**
   * Obtém QR code para login
   */
  public getQRCodeLogin(): Observable<QRCodeLoginResponse> {
    return this.http.get<QRCodeLoginResponse>(`${this.apiUrl}/whatsapp/auth/login/qrcode`, { withCredentials: true });
  }

  /**
   * Inicia login com código de pareamento
   */
  public initCodeLogin(phone: string): Observable<CodeLoginResponse> {
    return this.http.get<CodeLoginResponse>(`${this.apiUrl}/whatsapp/auth/login/with-code?phone=${encodeURIComponent(phone)}`, { withCredentials: true });
  }

  /**
   * Verifica status do login
   */
  public getLoginStatus(): Observable<LoginStatusResponse> {
    return this.http.get<LoginStatusResponse>(`${this.apiUrl}/whatsapp/auth/login/status`, { withCredentials: true });
  }

  /**
   * Faz logout da API WhatsApp
   */
  public logout(): Observable<LogoutResponse> {
    return this.http.post<LogoutResponse>(`${this.apiUrl}/whatsapp/auth/logout`, {}, { withCredentials: true });
  }
}
