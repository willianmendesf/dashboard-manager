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
}
