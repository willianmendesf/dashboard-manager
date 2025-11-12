import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappsService } from '../../../../shared/service/whatsapp.service';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-whatsapp-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './whatsapp-login-modal.component.html',
  styleUrl: './whatsapp-login-modal.component.scss'
})
export class WhatsappLoginModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  private unsubscribe$ = new Subject<void>();
  
  activeTab: 'qrcode' | 'code' = 'code';
  qrCodeUrl: string | null = null;
  qrDuration: number = 30;
  pairCode: string | null = null;
  phoneNumber: string = '5511980914192';
  isLoading: boolean = false;
  loginStatus: 'idle' | 'waiting' | 'success' | 'error' = 'idle';
  errorMessage: string | null = null;
  
  private statusCheckInterval: any = null;
  private qrRefreshInterval: any = null;
  private maxPollingAttempts = 100; // 5 minutos (100 * 3s)
  private pollingAttempts = 0;

  constructor(
    private whatsappService: WhatsappsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Não iniciar automaticamente - usuário escolhe o método
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.clearIntervals();
  }

  initQRCodeLogin() {
    this.isLoading = true;
    this.errorMessage = null;
    this.loginStatus = 'idle';
    this.clearIntervals();
    
    this.whatsappService.getQRCodeLogin()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.qrLink) {
            this.qrCodeUrl = response.qrLink;
            this.qrDuration = response.qrDuration || 30;
            this.loginStatus = 'waiting';
            this.startStatusPolling();
            this.startQRRefresh();
          } else {
            this.errorMessage = response.error || 'Erro ao obter QR code';
            this.loginStatus = 'error';
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erro ao conectar com a API. Verifique as configurações.';
          this.loginStatus = 'error';
          this.cdr.markForCheck();
        }
      });
  }

  initCodeLogin() {
    // Validar telefone
    const cleanPhone = this.phoneNumber.replaceAll(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      this.errorMessage = 'Número de telefone inválido. Use o formato internacional (ex: 5511999999999)';
      this.loginStatus = 'error';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.loginStatus = 'idle';
    this.pairCode = null;
    this.clearIntervals();
    
    this.whatsappService.initCodeLogin(cleanPhone)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.pairCode) {
            this.pairCode = response.pairCode;
            this.loginStatus = 'waiting';
            this.startStatusPolling();
          } else {
            this.errorMessage = response.error || 'Erro ao gerar código de pareamento';
            this.loginStatus = 'error';
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Erro ao conectar com a API. Verifique as configurações.';
          this.loginStatus = 'error';
          this.cdr.markForCheck();
        }
      });
  }

  refreshQRCode() {
    this.initQRCodeLogin();
  }

  startStatusPolling() {
    this.pollingAttempts = 0;
    this.statusCheckInterval = setInterval(() => {
      this.checkLoginStatus();
    }, 3000); // Verificar a cada 3 segundos
  }

  startQRRefresh() {
    // Atualizar QR code a cada qrDuration segundos
    this.qrRefreshInterval = setInterval(() => {
      if (this.activeTab === 'qrcode' && this.loginStatus === 'waiting') {
        this.refreshQRCode();
      }
    }, (this.qrDuration || 30) * 1000);
  }

  checkLoginStatus() {
    if (this.pollingAttempts >= this.maxPollingAttempts) {
      this.clearIntervals();
      this.errorMessage = 'Tempo limite excedido. Tente novamente.';
      this.loginStatus = 'error';
      this.cdr.markForCheck();
      return;
    }

    this.pollingAttempts++;
    this.whatsappService.getLoginStatus()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (response) => {
          if (response.success && response.isLoggedIn) {
            this.clearIntervals();
            this.loginStatus = 'success';
            setTimeout(() => {
              this.loginSuccess.emit();
              this.closeModal();
            }, 1500);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          // Continuar tentando em caso de erro temporário
          console.warn('Erro ao verificar status do login:', error);
        }
      });
  }

  switchTab(tab: 'qrcode' | 'code') {
    this.activeTab = tab;
    this.clearIntervals();
    this.errorMessage = null;
    this.loginStatus = 'idle';
    
    if (tab === 'qrcode') {
      this.pairCode = null;
      this.initQRCodeLogin();
    } else {
      this.qrCodeUrl = null;
      this.pairCode = null;
      // Manter o número padrão se não foi alterado
      if (!this.phoneNumber || this.phoneNumber.trim() === '') {
        this.phoneNumber = '5511980914192';
      }
    }
    this.cdr.markForCheck();
  }

  closeModal() {
    this.clearIntervals();
    this.close.emit();
  }

  private clearIntervals() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
    if (this.qrRefreshInterval) {
      clearInterval(this.qrRefreshInterval);
      this.qrRefreshInterval = null;
    }
  }

  formatPhoneNumber(event: any) {
    // Remover caracteres não numéricos
    let value = event.target.value.replace(/[^0-9]/g, '');
    this.phoneNumber = value;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visual pode ser adicionado aqui
      console.log('Código copiado para a área de transferência');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
    });
  }
}

