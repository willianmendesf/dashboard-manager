import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './redefinir-senha.component.scss'
})
export class RedefinirSenhaComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  success = false;
  error = '';
  telefone: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      telefone: [{value: '', disabled: true}],
      codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Obter telefone da query string
    this.route.queryParams.subscribe(params => {
      this.telefone = params['telefone'] || '';
      if (this.telefone) {
        this.resetForm.patchValue({ telefone: this.formatTelefoneValue(this.telefone) });
      }
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const request = {
      telefone: this.telefone.replace(/\D/g, ''),
      codigo: this.resetForm.get('codigo')?.value,
      novaSenha: this.resetForm.get('novaSenha')?.value
    };

    this.http.post<{message: string}>(`${environment.apiUrl}auth/redefinir-senha`, request).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { message: 'Senha alterada com sucesso!' }
          });
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.error || error.error?.message || 'Erro ao redefinir senha. Verifique o código e tente novamente.';
        this.loading = false;
      }
    });
  }

  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasMinLength = value.length >= 6;
    if (!hasMinLength) {
      return { weakPassword: true };
    }
    return null;
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const novaSenha = control.get('novaSenha');
    const confirmarSenha = control.get('confirmarSenha');

    if (!novaSenha || !confirmarSenha) return null;

    if (novaSenha.value !== confirmarSenha.value) {
      confirmarSenha.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmarSenha.setErrors(null);
      return null;
    }
  }

  formatTelefoneValue(telefone: string): string {
    const numbers = telefone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  formatCode(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.resetForm.patchValue({ codigo: value }, { emitEvent: false });
  }
}

