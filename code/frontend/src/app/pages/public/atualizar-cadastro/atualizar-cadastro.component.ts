import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PublicMemberService, MemberDTO, UpdateMemberDTO, GroupDTO } from '../../../shared/service/public-member.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

function cpfValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const value = control.value.toString().trim();
  
  const cpfNumbers = value.replace(/\D/g, '');
  
  if (cpfNumbers.length !== 11) {
    return { invalidCpf: true };
  }

  const formattedPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  const numbersOnlyPattern = /^\d{11}$/;
  
  if (formattedPattern.test(value) || numbersOnlyPattern.test(cpfNumbers)) {
    return null;
  }

  return { invalidCpf: true };
}

function conjugueCpfValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) {
    return null;
  }

  const estadoCivil = parent.get('estadoCivil')?.value;
  
  // Se não está casado, não valida
  if (!estadoCivil) {
    return null;
  }

  // Se está casado mas o campo está vazio, não valida (opcional)
  if (!control.value) {
    return null;
  }

  // Se está casado e tem valor, valida o CPF
  return cpfValidator(control);
}

@Component({
  selector: 'app-atualizar-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './atualizar-cadastro.component.html',
  styleUrl: './atualizar-cadastro.component.scss'
})
export class AtualizarCadastroComponent implements OnInit {
  searchForm: FormGroup;
  editForm: FormGroup;
  foundMember: MemberDTO | null = null;
  isLoading = false;
  showEditForm = false;
  hasConjugueCPF = false; // Flag para controlar write-once
  availableGroups: GroupDTO[] = [];
  selectedGroupIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private memberService: PublicMemberService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {

    this.searchForm = this.fb.group({
      cpf: ['', [Validators.required, cpfValidator]]
    });

    this.editForm = this.fb.group({
      cpf: [{ value: '', disabled: true }],
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
      rg: [''],
      conjugueCPF: ['', conjugueCpfValidator],
      groupIds: [[]],
      rede: [''],
      operadora: [''],
      contato: ['']
    });
  }

  ngOnInit(): void {
    this.loadGroups();
    
    this.editForm.get('estadoCivil')?.valueChanges.subscribe((estadoCivil) => {
      const conjugueCPFControl = this.editForm.get('conjugueCPF');
      if (!estadoCivil && !this.hasConjugueCPF) {
        conjugueCPFControl?.setValue('');
      }
      conjugueCPFControl?.updateValueAndValidity();
    });

    this.editForm.get('conjugueCPF')?.valueChanges.subscribe((conjugueCPF) => {
      if (conjugueCPF && conjugueCPF.trim().length > 0 && !this.hasConjugueCPF) {
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

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.notificationService.showError('Por favor, informe um CPF válido.');
      return;
    }

    this.isLoading = true;
    const cpf = this.searchForm.get('cpf')?.value;

    this.memberService.getMemberByCpf(cpf).subscribe({
      next: (member) => {
        this.foundMember = member;
        this.isLoading = false;
        this.showEditForm = true;
        this.cdr.detectChanges();
        this.populateEditForm(member);
        this.cdr.detectChanges();
        this.notificationService.showSuccess('Cadastro encontrado! Você pode atualizar seus dados abaixo.');
      },
      error: (err) => {
        console.error('Error finding member:', err);
        this.notificationService.showError('CPF não encontrado. Verifique o CPF informado e tente novamente.');
        this.foundMember = null;
        this.showEditForm = false;
        this.isLoading = false;
      }
    });
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

    this.hasConjugueCPF = !!(member.conjugueCPF && member.conjugueCPF.trim().length > 0);

    // Carrega os grupos selecionados
    this.selectedGroupIds = member.groupIds || [];

    this.editForm.patchValue({
      cpf: member.cpf || '',
      nome: member.nome || '',
      email: member.email || '',
      telefone: member.telefone || '',
      comercial: member.comercial || '',
      celular: member.celular || '',
      nascimento: nascimentoStr,
      estadoCivil: estadoCivil,
      rg: member.rg || '',
      conjugueCPF: member.conjugueCPF || '',
      cep: member.cep || '',
      logradouro: member.logradouro || '',
      numero: member.numero || '',
      complemento: member.complemento || '',
      bairro: member.bairro || '',
      cidade: member.cidade || '',
      estado: member.estado || '',
      groupIds: this.selectedGroupIds
    });

    // Bloqueia os campos se já existe CPF do cônjuge
    if (this.hasConjugueCPF) {
      this.editForm.get('estadoCivil')?.disable();
      this.editForm.get('conjugueCPF')?.disable();
    } else {
      this.editForm.get('estadoCivil')?.enable();
      this.editForm.get('conjugueCPF')?.enable();
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.notificationService.showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.foundMember || !this.foundMember.cpf) {
      this.notificationService.showError('Erro: CPF não encontrado. Por favor, busque novamente.');
      return;
    }

    this.isLoading = true;
    const cpf = this.foundMember.cpf;
    const formData = this.editForm.getRawValue();

    // Se tem CPF do cônjuge, força estado civil como casado
    const conjugueCPF = formData.conjugueCPF?.trim() || '';
    const estadoCivil = conjugueCPF.length > 0 ? true : formData.estadoCivil;

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
      rg: formData.rg,
      conjugueCPF: conjugueCPF.length > 0 ? conjugueCPF : undefined,
      tipoCadastro: formData.tipoCadastro,
      groupIds: this.selectedGroupIds.length > 0 ? this.selectedGroupIds : undefined,
      rede: formData.rede,
      operadora: formData.operadora,
      contato: formData.contato
    };

    this.memberService.updateMemberByCpf(cpf, updateData).subscribe({
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
    this.foundMember = null;
    this.hasConjugueCPF = false;
    this.selectedGroupIds = [];
    this.searchForm.reset();
    this.editForm.reset();
    this.editForm.get('estadoCivil')?.enable();
    this.editForm.get('conjugueCPF')?.enable();
  }

  toggleGroup(groupId: number): void {
    const index = this.selectedGroupIds.indexOf(groupId);
    if (index > -1) {
      this.selectedGroupIds.splice(index, 1);
    } else {
      this.selectedGroupIds.push(groupId);
    }
  }

  isGroupSelected(groupId: number): boolean {
    return this.selectedGroupIds.includes(groupId);
  }

  goToLanding(): void {
    this.router.navigate(['/landing']);
  }
}

