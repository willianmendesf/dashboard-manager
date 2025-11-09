import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Notification {
  id?: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // Duração em milissegundos (opcional)
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$: Observable<Notification> = this.notificationSubject.asObservable();
  private notificationIdCounter = 0;

  constructor() {}

  /**
   * Exibe uma notificação de sucesso
   */
  showSuccess(message: string, duration: number = 5000): void {
    this.notificationSubject.next({
      id: this.notificationIdCounter++,
      message,
      type: 'success',
      duration
    });
  }

  /**
   * Exibe uma notificação de erro
   */
  showError(message: string, duration: number = 5000): void {
    this.notificationSubject.next({
      id: this.notificationIdCounter++,
      message,
      type: 'error',
      duration
    });
  }

  /**
   * Exibe uma notificação de informação
   */
  showInfo(message: string, duration: number = 5000): void {
    this.notificationSubject.next({
      id: this.notificationIdCounter++,
      message,
      type: 'info',
      duration
    });
  }

  /**
   * Exibe uma notificação de aviso
   */
  showWarning(message: string, duration: number = 5000): void {
    this.notificationSubject.next({
      id: this.notificationIdCounter++,
      message,
      type: 'warning',
      duration
    });
  }
}

