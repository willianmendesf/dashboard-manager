import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PublicMemberService, MemberDTO, UpdateMemberDTO, GroupDTO } from '../../../shared/service/public-member.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { EnrollmentService, GroupEnrollmentDTO } from '../../../shared/service/enrollment.service';
import { OtpService } from '../../../shared/service/otp.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

function telefoneValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const value = control.value.toString().trim();
  const telefoneNumbers = value.replace(/\D/g, '');
  
  if (telefoneNumbers.length < 10 || telefoneNumbers.length > 11) {
    return { invalidTelefone: true };
  }

  return null;
}

@Component({
  selector: 'app-atualizar-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './atualizar-cadastro.component.html',
  styleUrl: './atualizar-cadastro.component.scss'
})
export class AtualizarCadastroComponent implements OnInit {
  editForm: FormGroup;
  foundMember: MemberDTO | null = null;
  isLoading = false;
  step = 1; // 1 = telefone, 2 = código
  phone = '';
  code = '';
  showEditForm = false;
  hasConjugueTelefone = false; // Flag para controlar write-once
  availableGroups: GroupDTO[] = [];
  selectedGroupIds: number[] = [];
  memberEnrollments: GroupEnrollmentDTO[] = [];
  enrollmentStatusMap: Map<number, GroupEnrollmentDTO> = new Map();
  canRequestMap: Map<number, boolean> = new Map();

  constructor(
    private fb: FormBuilder,
    private memberService: PublicMemberService,
    private enrollmentService: EnrollmentService,
    private notificationService: NotificationService,
    private otpService: OtpService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      comercial: [''],
      celular: [''],
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      estado: [''],
      nascimento: [''],
      estadoCivil: [false],
      conjugueTelefone: ['', telefoneValidator],
      groupIds: [[]],
      rede: [''],
      operadora: [''],
      contato: ['']
    });
  }

  ngOnInit(): void {
    this.loadGroups();
    
    this.editForm.get('estadoCivil')?.valueChanges.subscribe((estadoCivil) => {
      const conjugueTelefoneControl = this.editForm.get('conjugueTelefone');
      if (!estadoCivil && !this.hasConjugueTelefone) {
        conjugueTelefoneControl?.setValue('');
      }
      conjugueTelefoneControl?.updateValueAndValidity();
    });

    this.editForm.get('conjugueTelefone')?.valueChanges.subscribe((conjugueTelefone) => {
      if (conjugueTelefone && conjugueTelefone.trim().length > 0 && !this.hasConjugueTelefone) {
        const estadoCivilControl = this.editForm.get('estadoCivil');
        if (estadoCivilControl && !estadoCivilControl.disabled) {
          estadoCivilControl.setValue(true);
        }
      }
    });
  }

  loadGroups(): void {
    this.memberService.getAllGroups().subscribe({
      next: (groups) => {
        this.availableGroups = groups;
      },
      error: (err) => {
        console.error('Error loading groups:', err);
      }
    });
  }

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
    const cleanPhone = this.phone.replace(/\D/g, '');

    this.otpService.requestOtp(cleanPhone, 'MEMBER_PORTAL').subscribe({
      next: () => {
        this.notificationService.showSuccess('Código enviado com sucesso! Verifique seu WhatsApp.');
        this.step = 2;
        this.code = ''; // Limpa código anterior
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error requesting OTP:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao enviar código. Tente novamente.';
        this.notificationService.showError(errorMessage);
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
    const cleanPhone = this.phone.replace(/\D/g, '');

    this.otpService.validateOtp(cleanPhone, this.code, 'MEMBER_PORTAL').subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Código validado com sucesso!');
        this.isLoading = false;
        this.loadMemberData(cleanPhone);
      },
      error: (err) => {
        console.error('Error validating OTP:', err);
        // Extrai mensagem de erro do response
        let errorMessage = 'Código inválido ou expirado. Tente novamente.';
        
        if (err?.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.error) {
            errorMessage = err.error.error;
          }
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
        this.code = ''; // Limpa o código para permitir nova tentativa
        this.cdr.detectChanges(); // Força atualização da UI
      }
    });
  }

  private loadMemberData(phone: string): void {
    this.memberService.getMemberByPhone(phone).subscribe({
      next: (member) => {
        this.foundMember = member;
        this.loadMemberEnrollments(member.id!);
        this.isLoading = false;
        this.showEditForm = true;
        this.step = 1; // Reset para voltar ao início se necessário
        this.cdr.detectChanges();
        this.populateEditForm(member);
        this.cdr.detectChanges();
        this.notificationService.showSuccess('Cadastro encontrado! Você pode atualizar seus dados abaixo.');
      },
      error: (err) => {
        console.error('Error finding member by phone:', err);
        this.notificationService.showError('Cadastro não encontrado. Verifique o telefone informado e tente novamente.');
        this.foundMember = null;
        this.showEditForm = false;
        this.step = 1;
        this.isLoading = false;
      }
    });
  }

  loadMemberEnrollments(memberId: number): void {
    this.enrollmentService.getMemberEnrollments(memberId, true).subscribe({
      next: (enrollments) => {
        this.memberEnrollments = enrollments;
        this.populateEnrollmentMap();
        this.loadCanRequestMap(memberId);
      },
      error: (err) => {
        console.error('Error loading enrollments:', err);
        this.memberEnrollments = [];
        this.enrollmentStatusMap.clear();
      }
    });
  }

  populateEnrollmentMap(): void {
    this.enrollmentStatusMap.clear();
    this.memberEnrollments.forEach(enrollment => {
      this.enrollmentStatusMap.set(enrollment.groupId, enrollment);
    });
  }

  loadCanRequestMap(memberId: number): void {
    const requests = this.availableGroups.map(group => {
      const enrollment = this.enrollmentStatusMap.get(group.id!);
      if (enrollment && enrollment.status === 'REJECTED') {
        return this.enrollmentService.canRequestAgain(memberId, group.id!, true)
          .pipe(
            map(canRequest => ({ groupId: group.id!, canRequest })),
            catchError(() => of({ groupId: group.id!, canRequest: false }))
          );
      }
      return of({ groupId: group.id!, canRequest: true });
    });

    if (requests.length > 0) {
      forkJoin(requests).subscribe(results => {
        results.forEach(result => {
          this.canRequestMap.set(result.groupId!, result.canRequest);
        });
        this.cdr.detectChanges();
      });
    }
  }

  private populateEditForm(member: MemberDTO): void {
    let estadoCivil = false;
    if (member.estadoCivil === 'Casado' || member.estadoCivil === 'true') {
      estadoCivil = true;
    }

    let nascimentoStr = '';
    if (member.nascimento) {
      const date = new Date(member.nascimento);
      if (!isNaN(date.getTime())) {
        nascimentoStr = date.toISOString().split('T')[0];
      }
    }

    this.hasConjugueTelefone = !!(member.conjugueTelefone && member.conjugueTelefone.trim().length > 0);

    // Carrega os grupos selecionados (apenas APPROVED para compatibilidade)
    this.selectedGroupIds = member.groupEnrollments
      ?.filter(e => e.status === 'APPROVED')
      .map(e => e.groupId) || [];

    this.editForm.patchValue({
      nome: member.nome || '',
      email: member.email || '',
      telefone: member.telefone || '',
      comercial: member.comercial || '',
      celular: member.celular || '',
      nascimento: nascimentoStr,
      estadoCivil: estadoCivil,
      conjugueTelefone: member.conjugueTelefone || '',
      cep: member.cep || '',
      logradouro: member.logradouro || '',
      numero: member.numero || '',
      complemento: member.complemento || '',
      bairro: member.bairro || '',
      cidade: member.cidade || '',
      estado: member.estado || '',
      groupIds: this.selectedGroupIds
    });

    // Bloqueia os campos se já existe telefone do cônjuge
    if (this.hasConjugueTelefone) {
      this.editForm.get('estadoCivil')?.disable();
      this.editForm.get('conjugueTelefone')?.disable();
    } else {
      this.editForm.get('estadoCivil')?.enable();
      this.editForm.get('conjugueTelefone')?.enable();
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.notificationService.showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.foundMember || !this.phone) {
      this.notificationService.showError('Erro: Telefone não encontrado. Por favor, busque novamente.');
      return;
    }

    this.isLoading = true;
    const formData = this.editForm.getRawValue();

    // Se tem telefone do cônjuge, força estado civil como casado
    const conjugueTelefone = formData.conjugueTelefone?.trim() || '';
    const estadoCivil = conjugueTelefone.length > 0 ? true : formData.estadoCivil;

    // Calcula a idade baseado na data de nascimento
    let idadeCalculada: number | undefined = undefined;
    if (formData.nascimento) {
      const nascimento = new Date(formData.nascimento);
      const hoje = new Date();
      idadeCalculada = hoje.getFullYear() - nascimento.getFullYear();
      const mesAniversario = hoje.getMonth() - nascimento.getMonth();
      if (mesAniversario < 0 || (mesAniversario === 0 && hoje.getDate() < nascimento.getDate())) {
        idadeCalculada--;
      }
    }

    const updateData: UpdateMemberDTO = {
      nome: formData.nome,
      email: formData.email,
      telefone: formData.telefone,
      comercial: formData.comercial,
      celular: formData.celular,
      cep: formData.cep,
      logradouro: formData.logradouro,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      nascimento: formData.nascimento || undefined,
      idade: idadeCalculada,
      estadoCivil: estadoCivil,
      conjugueTelefone: conjugueTelefone.length > 0 ? conjugueTelefone : undefined,
      tipoCadastro: formData.tipoCadastro,
      rede: formData.rede,
      operadora: formData.operadora,
      contato: formData.contato
    };

    this.memberService.updateMemberByPhone(this.phone, updateData).subscribe({
      next: (updatedMember) => {
        this.notificationService.showSuccess('Dados atualizados com sucesso!');
        this.isLoading = false;
        
        setTimeout(() => {
          this.backToSearch();
        }, 1500);
      },
      error: (err) => {
        console.error('Error updating member:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao atualizar dados. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  backToSearch(): void {
    this.showEditForm = false;
    this.step = 1;
    this.phone = '';
    this.code = '';
    this.foundMember = null;
    this.hasConjugueTelefone = false;
    this.selectedGroupIds = [];
    this.memberEnrollments = [];
    this.enrollmentStatusMap.clear();
    this.canRequestMap.clear();
    this.editForm.reset();
    this.editForm.get('estadoCivil')?.enable();
    this.editForm.get('conjugueTelefone')?.enable();
  }

  getGroupStatus(groupId: number): 'APPROVED' | 'PENDING' | 'REJECTED' | null {
    const enrollment = this.enrollmentStatusMap.get(groupId);
    return enrollment ? (enrollment.status as 'APPROVED' | 'PENDING' | 'REJECTED') : null;
  }

  isGroupApproved(groupId: number): boolean {
    return this.getGroupStatus(groupId) === 'APPROVED';
  }

  isGroupPending(groupId: number): boolean {
    return this.getGroupStatus(groupId) === 'PENDING';
  }

  isGroupRejected(groupId: number): boolean {
    return this.getGroupStatus(groupId) === 'REJECTED';
  }

  canRequestGroup(groupId: number): boolean {
    const enrollment = this.enrollmentStatusMap.get(groupId);
    if (!enrollment) return true;
    if (enrollment.status === 'REJECTED') {
      return this.canRequestMap.get(groupId) ?? false;
    }
    return false;
  }

  getRejectionDate(groupId: number): string {
    const enrollment = this.enrollmentStatusMap.get(groupId);
    if (!enrollment || !enrollment.rejectedAt) return '';
    const date = new Date(enrollment.rejectedAt);
    const futureDate = new Date(date);
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toLocaleDateString('pt-BR');
  }

  getRejectionReason(groupId: number): string | null {
    const enrollment = this.enrollmentStatusMap.get(groupId);
    return enrollment?.rejectionReason || null;
  }

  toggleGroup(groupId: number): void {
    if (!this.foundMember?.id) return;

    const status = this.getGroupStatus(groupId);
    
    if (status === 'APPROVED') {
      // Solicitar saída - criar PENDING para remoção (ou remover direto?)
      // Por enquanto, apenas informar que precisa ser feito pelo admin
      this.notificationService.showError('Para sair de um grupo, entre em contato com o administrador.');
      return;
    }

    if (status === 'PENDING') {
      this.notificationService.showInfo('Você já tem uma solicitação pendente para este grupo.');
      return;
    }

    if (status === 'REJECTED' && !this.canRequestGroup(groupId)) {
      const date = this.getRejectionDate(groupId);
      this.notificationService.showError(`Você poderá solicitar novamente a partir de ${date}`);
      return;
    }

    // Criar nova solicitação
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.enrollmentService.requestEnrollment(this.foundMember.id, groupId, true).subscribe({
      next: (enrollment) => {
        this.memberEnrollments.push(enrollment);
        this.enrollmentStatusMap.set(groupId, enrollment);
        this.notificationService.showSuccess('Solicitação enviada! Aguarde a aprovação do administrador.');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error requesting enrollment:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao solicitar participação no grupo';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isGroupSelected(groupId: number): boolean {
    return this.isGroupApproved(groupId) || this.isGroupPending(groupId);
  }

  goToLanding(): void {
    this.router.navigate(['/landing']);
  }
}

