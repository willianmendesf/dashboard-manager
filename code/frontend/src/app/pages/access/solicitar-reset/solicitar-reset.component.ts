import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-solicitar-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './solicitar-reset.component.html',
  styleUrl: './solicitar-reset.component.scss'
})
export class SolicitarResetComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  success = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      cpf: ['', [Validators.required, this.cpfValidator]],
      telefone: ['', [Validators.required, this.phoneValidator]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.resetForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const request = {
      cpf: this.resetForm.get('cpf')?.value.replace(/\D/g, ''),
      telefone: this.resetForm.get('telefone')?.value.replace(/\D/g, '')
    };

    this.http.post<{message: string}>(`${environment.apiUrl}auth/solicitar-reset`, request).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        // Redirecionar para tela de redefinição após 2 segundos
        setTimeout(() => {
          this.router.navigate(['/redefinir-senha'], {
            queryParams: { cpf: request.cpf }
          });
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Erro ao solicitar reset de senha. Tente novamente.';
        this.loading = false;
      }
    });
  }

  cpfValidator(control: any) {
    const cpf = control.value?.replace(/\D/g, '');
    if (!cpf) return null;
    if (cpf.length !== 11) return { invalidCpf: true };
    return null;
  }

  phoneValidator(control: any) {
    const phone = control.value?.replace(/\D/g, '');
    if (!phone) return null;
    if (phone.length < 10 || phone.length > 11) return { invalidPhone: true };
    return null;
  }

  formatCPF(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      this.resetForm.patchValue({ cpf: value }, { emitEvent: false });
    }
  }

  formatPhone(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length <= 10) {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
      } else {
        value = value.replace(/(\d{2})(\d)/, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
      this.resetForm.patchValue({ telefone: value }, { emitEvent: false });
    }
  }
}

