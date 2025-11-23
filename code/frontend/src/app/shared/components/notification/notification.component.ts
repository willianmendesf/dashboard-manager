import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationService } from '../../services/notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();
  private timeouts: Map<number | undefined, NodeJS.Timeout> = new Map();

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.notificationService.notification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        // Garantir que a notificação tenha um ID único
        if (!notification.id) {
          notification.id = Date.now() + Math.random();
        }
        
        const notificationId = notification.id;
        this.notifications.push(notification);
        this.cdr.markForCheck();
        
        // Remover automaticamente após a duração especificada (padrão: 5 segundos)
        const duration = notification.duration || 5000;
        const timeoutId = setTimeout(() => {
          // Executar dentro da zona do Angular para garantir detecção de mudanças
          this.ngZone.run(() => {
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
              // Criar novo array para forçar detecção de mudanças
              this.notifications = this.notifications.filter(n => n.id !== notificationId);
              this.cdr.detectChanges();
            }
            this.timeouts.delete(notificationId);
          });
        }, duration);
        
        // Armazenar o timeout para poder cancelá-lo se necessário
        this.timeouts.set(notificationId, timeoutId);
      });
  }

  ngOnDestroy(): void {
    // Limpar todos os timeouts pendentes
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeNotification(notification: Notification): void {
    // Cancelar o timeout se ainda estiver pendente
    const timeoutId = this.timeouts.get(notification.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(notification.id);
    }
    
    // Remover a notificação do array criando um novo array para forçar detecção de mudanças
    this.notifications = this.notifications.filter(n => n.id !== notification.id);
    this.cdr.detectChanges();
  }

  trackByNotificationId(index: number, notification: Notification): number | undefined {
    return notification.id;
  }
}

