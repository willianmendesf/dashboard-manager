import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { OtpService } from '../../../shared/service/otp.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-solicitar-reset',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './solicitar-reset.component.html',
  styleUrl: './solicitar-reset.component.scss'
})
export class SolicitarResetComponent implements OnInit {
  phone = '';
  code = '';
  step = 1; // 1 = telefone, 2 = código
  isLoading = false;
  error = '';

  constructor(
    private otpService: OtpService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {}

  isPhoneValid(): boolean {
    if (!this.phone) return false;
    const cleanPhone = this.phone.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  }

  requestCode(): void {
    if (!this.isPhoneValid()) {
      this.notificationService.showError('Por favor, informe um telefone válido.');
      return;
    }

    this.isLoading = true;
    this.error = '';
    const cleanPhone = this.phone.replace(/\D/g, '');

    this.otpService.requestOtp(cleanPhone, 'FORGOT_PASSWORD').subscribe({
      next: () => {
        this.notificationService.showSuccess('Código enviado com sucesso! Verifique seu WhatsApp.');
        this.step = 2;
        this.code = '';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error requesting OTP:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao enviar código. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.error = errorMessage;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  validateCode(): void {
    if (!this.code || this.code.length !== 6) {
      this.notificationService.showError('Por favor, informe o código de 6 dígitos.');
      return;
    }

    this.isLoading = true;
    this.error = '';
    const cleanPhone = this.phone.replace(/\D/g, '');

    // Chama diretamente o endpoint que valida OTP e atualiza senha
    this.updatePassword(cleanPhone, this.code);
  }

  private updatePassword(phone: string, code: string): void {
    this.http.post<{message: string, username: string}>(`${environment.apiUrl}auth/redefinir-senha-otp`, {
      telefone: phone,
      codigo: code
    }).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Senha redefinida com sucesso! Use o código recebido para fazer login.');
        this.isLoading = false;
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { 
              message: 'Senha redefinida! Use o código recebido no WhatsApp para fazer login.',
              username: response.username
            }
          });
        }, 2000);
      },
      error: (err) => {
        console.error('Error updating password:', err);
        const errorMessage = err?.error?.error || err?.error?.message || 'Erro ao redefinir senha. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.error = errorMessage;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}

