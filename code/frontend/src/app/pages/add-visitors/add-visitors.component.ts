import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PublicVisitorService, CreateVisitorDTO } from '../../shared/service/public-visitor.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-add-visitors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './add-visitors.component.html',
  styleUrl: './add-visitors.component.scss'
})
export class AddVisitorsComponent implements OnInit {
  visitorForm: FormGroup;
  isLoading = false;
  estadosBR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  constructor(
    private fb: FormBuilder,
    private visitorService: PublicVisitorService,
    private notificationService: NotificationService
  ) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    this.visitorForm = this.fb.group({
      nomeCompleto: ['', [Validators.required]],
      dataVisita: [todayStr, [Validators.required]],
      telefone: [''],
      jaFrequentaIgreja: [''],
      procuraIgreja: [''],
      eDeSP: [true],
      estado: ['']
    });
  }

  ngOnInit(): void {
    // Watch eDeSP changes to show/hide estado field
    this.visitorForm.get('eDeSP')?.valueChanges.subscribe(value => {
      const estadoControl = this.visitorForm.get('estado');
      if (value === false) {
        estadoControl?.setValidators([Validators.required]);
      } else {
        estadoControl?.clearValidators();
        estadoControl?.setValue('');
      }
      estadoControl?.updateValueAndValidity();
    });
  }

  get eDeSP(): boolean {
    return this.visitorForm.get('eDeSP')?.value === true;
  }

  onSubmit(): void {
    if (this.visitorForm.invalid) {
      this.markFormGroupTouched(this.visitorForm);
      this.notificationService.showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    this.isLoading = true;
    const formValue = this.visitorForm.value;

    const visitorData: CreateVisitorDTO = {
      nomeCompleto: formValue.nomeCompleto.trim(),
      dataVisita: formValue.dataVisita,
      telefone: formValue.telefone || undefined,
      jaFrequentaIgreja: formValue.jaFrequentaIgreja || undefined,
      procuraIgreja: formValue.procuraIgreja || undefined,
      eDeSP: formValue.eDeSP !== undefined ? formValue.eDeSP : true, // Garantir que sempre tenha valor
      estado: (formValue.eDeSP === false && formValue.estado && formValue.estado.trim() !== '') 
        ? formValue.estado.trim().toUpperCase() 
        : undefined
    };
    
    console.log('Sending visitor data:', JSON.stringify(visitorData, null, 2));

    this.visitorService.create(visitorData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Visitante cadastrado com sucesso!');
        this.visitorForm.reset();
        const today = new Date().toISOString().split('T')[0];
        this.visitorForm.patchValue({
          dataVisita: today,
          eDeSP: true
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating visitor:', error);
        const errorMessage = error?.error?.message || 'Erro ao cadastrar visitante. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}

