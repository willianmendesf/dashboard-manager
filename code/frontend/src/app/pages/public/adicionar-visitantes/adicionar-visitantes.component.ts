import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PublicVisitorService, CreateVisitorDTO, VisitorGroupRequestDTO } from '../../../shared/service/public-visitor.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-adicionar-visitantes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './adicionar-visitantes.component.html',
  styleUrl: './adicionar-visitantes.component.scss'
})
export class AdicionarVisitantesComponent implements OnInit {
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
    private notificationService: NotificationService,
    private router: Router
  ) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    this.visitorForm = this.fb.group({
      nomeCompleto: ['', [Validators.required]],
      dataVisita: [todayStr, [Validators.required]],
      telefone: [''],
      jaFrequentaIgreja: [''],
      nomeIgreja: [''],
      procuraIgreja: [''],
      eDeSP: [true],
      estado: ['SP'],
      isAccompanied: [false],
      accompanyingVisitors: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (this.visitorForm.get('eDeSP')?.value === true) {
      this.visitorForm.get('estado')?.setValue('SP');
    }

    this.visitorForm.get('eDeSP')?.valueChanges.subscribe(value => {
      const estadoControl = this.visitorForm.get('estado');
      const boolValue = value === true || value === 'true' || value === 1;
      
      if (boolValue === false) {
        estadoControl?.setValidators([Validators.required]);
        estadoControl?.setValue('');
      } else {
        estadoControl?.clearValidators();
        estadoControl?.setValue('SP');
      }
      estadoControl?.updateValueAndValidity();
    });

    this.visitorForm.get('jaFrequentaIgreja')?.valueChanges.subscribe(value => {
      const nomeIgrejaControl = this.visitorForm.get('nomeIgreja');
      if (value === 'Sim') {
        nomeIgrejaControl?.setValidators([Validators.required]);
      } else {
        nomeIgrejaControl?.clearValidators();
        nomeIgrejaControl?.setValue('');
      }
      nomeIgrejaControl?.updateValueAndValidity();
    });
  }

  get eDeSP(): boolean {
    const value = this.visitorForm.get('eDeSP')?.value;
    return value === true || value === 'true' || value === 1;
  }

  get jaFrequentaIgreja(): string {
    return this.visitorForm.get('jaFrequentaIgreja')?.value || '';
  }

  get isAccompaniedControl(): FormControl {
    return this.visitorForm.get('isAccompanied') as FormControl;
  }

  get accompanyingControls() {
    return (this.visitorForm.get('accompanyingVisitors') as FormArray).controls;
  }

  addAccompanying(): void {
    const accompanyingForm = this.fb.group({
      nomeCompleto: ['', [Validators.required]],
      age: [null],
      relationship: ['', [Validators.required]]
    });
    (this.visitorForm.get('accompanyingVisitors') as FormArray).push(accompanyingForm);
  }

  removeAccompanying(index: number): void {
    (this.visitorForm.get('accompanyingVisitors') as FormArray).removeAt(index);
  }

  onSubmit(): void {
    if (this.visitorForm.invalid) {
      this.markFormGroupTouched(this.visitorForm);
      this.notificationService.showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Get form values BEFORE disabling (disabled controls don't appear in form.value)
    const formValue = this.visitorForm.getRawValue();
    
    this.isLoading = true;
    // Disable all form controls while loading
    this.visitorForm.disable();

    const eDeSPValue = formValue.eDeSP !== undefined ? formValue.eDeSP : true;
    const estadoValue = eDeSPValue === true 
      ? 'SP' 
      : (formValue.estado && formValue.estado.trim() !== '' ? formValue.estado.trim().toUpperCase() : undefined);

    // Validate required fields
    if (!formValue.nomeCompleto || typeof formValue.nomeCompleto !== 'string' || formValue.nomeCompleto.trim() === '') {
      this.notificationService.showError('Nome completo é obrigatório.');
      this.isLoading = false;
      this.visitorForm.enable();
      return;
    }

    const mainVisitorData: CreateVisitorDTO = {
      nomeCompleto: formValue.nomeCompleto.trim(),
      dataVisita: formValue.dataVisita,
      telefone: formValue.telefone ? formValue.telefone.trim() : undefined,
      jaFrequentaIgreja: formValue.jaFrequentaIgreja || undefined,
      nomeIgreja: formValue.nomeIgreja && formValue.nomeIgreja.trim() ? formValue.nomeIgreja.trim() : undefined,
      procuraIgreja: formValue.procuraIgreja || undefined,
      eDeSP: eDeSPValue,
      estado: estadoValue
    };

    // Se está acompanhado e tem acompanhantes, usar endpoint de grupo
    if (formValue.isAccompanied && formValue.accompanyingVisitors && formValue.accompanyingVisitors.length > 0) {
      const groupData: VisitorGroupRequestDTO = {
        mainVisitor: mainVisitorData,
        accompanyingVisitors: formValue.accompanyingVisitors
          .filter((acc: any) => acc && acc.nomeCompleto && typeof acc.nomeCompleto === 'string' && acc.nomeCompleto.trim() !== '')
          .map((acc: any) => {
            const accompanying: any = {
              nomeCompleto: acc.nomeCompleto.trim(),
              relationship: acc.relationship || ''
            };
            // Only include age if it's a valid number
            if (acc.age && acc.age.toString().trim() !== '') {
              const ageNum = parseInt(acc.age.toString().trim());
              if (!isNaN(ageNum) && ageNum > 0) {
                accompanying.age = ageNum;
              }
            }
            return accompanying;
          })
      };

      console.log('Sending visitor group data:', JSON.stringify(groupData, null, 2));

      this.visitorService.createGroup(groupData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Visitante e acompanhantes cadastrados com sucesso!');
          this.resetForm();
          this.isLoading = false;
          this.visitorForm.enable();
        },
        error: (error) => {
          console.error('Error creating visitor group:', error);
          const errorMessage = error?.error?.message || 'Erro ao cadastrar visitante e acompanhantes. Tente novamente.';
          this.notificationService.showError(errorMessage);
          this.isLoading = false;
          this.visitorForm.enable();
        }
      });
    } else {
      // Usar endpoint antigo para compatibilidade
      console.log('Sending visitor data:', JSON.stringify(mainVisitorData, null, 2));

      this.visitorService.create(mainVisitorData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Visitante cadastrado com sucesso!');
          this.resetForm();
          this.isLoading = false;
          this.visitorForm.enable();
        },
        error: (error) => {
          console.error('Error creating visitor:', error);
          const errorMessage = error?.error?.message || 'Erro ao cadastrar visitante. Tente novamente.';
          this.notificationService.showError(errorMessage);
          this.isLoading = false;
          this.visitorForm.enable();
        }
      });
    }
  }

  private resetForm(): void {
    this.visitorForm.reset();
    const today = new Date().toISOString().split('T')[0];
    this.visitorForm.patchValue({
      dataVisita: today,
      eDeSP: true,
      estado: 'SP',
      isAccompanied: false
    });
    // Limpar FormArray
    const accompanyingArray = this.visitorForm.get('accompanyingVisitors') as FormArray;
    while (accompanyingArray.length !== 0) {
      accompanyingArray.removeAt(0);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  goToLanding(): void {
    this.router.navigate(['/landing']);
  }
}

