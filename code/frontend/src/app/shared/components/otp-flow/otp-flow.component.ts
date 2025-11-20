import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OtpService } from '../../service/otp.service';
import { NotificationService } from '../../services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-otp-flow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './otp-flow.component.html',
  styleUrl: './otp-flow.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OtpFlowComponent implements OnInit, OnDestroy {
  @Input() context!: string; // Obrigatório
  
  @Output() verified = new EventEmitter<{ phone: string; token: string }>();

  phoneForm: FormGroup;
  codeForm: FormGroup;
  currentStep: 'phone' | 'code' = 'phone';
  phoneNumber: string = '';
  isLoading = false;
  countdown: number = 0;
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private otpService: OtpService,
    private notificationService: NotificationService
  ) {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void {
    if (!this.context) {
      console.error('OtpFlowComponent: context é obrigatório');
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  onPhoneSubmit(): void {
    if (this.phoneForm.invalid) {
      this.notificationService.showError('Por favor, informe um telefone válido.');
      return;
    }

    this.isLoading = true;
    this.phoneNumber = this.phoneForm.get('phone')?.value.replace(/\D/g, '');

    this.otpService.requestOtp(this.phoneNumber, this.context).subscribe({
      next: () => {
        this.notificationService.showSuccess('Código enviado com sucesso! Verifique seu WhatsApp.');
        this.currentStep = 'code';
        this.startCountdown(30 * 60); // 30 minutos em segundos
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error requesting OTP:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao enviar código. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  onCodeSubmit(): void {
    if (this.codeForm.invalid) {
      this.notificationService.showError('Por favor, informe o código de 6 dígitos.');
      return;
    }

    this.isLoading = true;
    const code = this.codeForm.get('code')?.value;

    this.otpService.validateOtp(this.phoneNumber, code, this.context).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Código validado com sucesso!');
        this.verified.emit({
          phone: this.phoneNumber,
          token: response.token
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error validating OTP:', err);
        const errorMessage = err?.error?.message || err?.error || 'Código inválido. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  resendCode(): void {
    if (this.phoneNumber) {
      this.isLoading = true;
      this.otpService.requestOtp(this.phoneNumber, this.context).subscribe({
        next: () => {
          this.notificationService.showSuccess('Código reenviado com sucesso!');
          this.startCountdown(30 * 60);
          this.codeForm.get('code')?.setValue('');
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error resending OTP:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao reenviar código. Tente novamente.';
          this.notificationService.showError(errorMessage);
          this.isLoading = false;
        }
      });
    }
  }

  backToPhone(): void {
    this.currentStep = 'phone';
    this.codeForm.reset();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdown = 0;
    }
  }

  private startCountdown(seconds: number): void {
    this.countdown = seconds;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    }, 1000);
  }

  get countdownFormatted(): string {
    const minutes = Math.floor(this.countdown / 60);
    const secs = this.countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatPhone(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }
}

