import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PublicMemberService, MemberDTO, UpdateMemberDTO } from '../../shared/service/public-member.service';
import { NotificationService } from '../../shared/services/notification.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-atualizar-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective],
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

  constructor(
    private fb: FormBuilder,
    private memberService: PublicMemberService,
    private notificationService: NotificationService
  ) {
    // Formulário de Busca
    this.searchForm = this.fb.group({
      cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]]
    });

    // Formulário de Edição (inicia vazio)
    this.editForm = this.fb.group({
      cpf: [{ value: '', disabled: true }], // Sempre desabilitado (write-once)
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
      tipoCadastro: [''],
      grupos: [''],
      rede: [''],
      operadora: [''],
      contato: ['']
    });
  }

  ngOnInit(): void {
    // Componente inicializado
  }

  /**
   * Busca membro por CPF
   */
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
        this.populateEditForm(member);
        this.showEditForm = true;
        this.isLoading = false;
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

  /**
   * Preenche o formulário de edição com os dados do membro encontrado
   */
  private populateEditForm(member: MemberDTO): void {
    // Converter estadoCivil de string para boolean
    let estadoCivil = false;
    if (member.estadoCivil === 'Casado' || member.estadoCivil === 'true') {
      estadoCivil = true;
    }

    // Formatar data de nascimento se existir
    let nascimentoStr = '';
    if (member.nascimento) {
      const date = new Date(member.nascimento);
      if (!isNaN(date.getTime())) {
        nascimentoStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
    }

    this.editForm.patchValue({
      cpf: member.cpf || '',
      nome: member.nome || '',
      email: member.email || '',
      telefone: member.telefone || '',
      celular: member.celular || '',
      nascimento: nascimentoStr,
      estadoCivil: estadoCivil,
      rg: member.rg || ''
    });
  }

  /**
   * Salva as alterações
   */
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

    // Preparar dados para envio (remover CPF do payload - write-once protection)
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
      estadoCivil: formData.estadoCivil,
      rg: formData.rg,
      tipoCadastro: formData.tipoCadastro,
      grupos: formData.grupos,
      rede: formData.rede,
      operadora: formData.operadora,
      contato: formData.contato
    };

    this.memberService.updateMemberByCpf(cpf, updateData).subscribe({
      next: (updatedMember) => {
        this.notificationService.showSuccess('Dados atualizados com sucesso!');
        this.foundMember = updatedMember;
        this.populateEditForm(updatedMember);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error updating member:', err);
        const errorMessage = err?.error?.message || err?.error || 'Erro ao atualizar dados. Tente novamente.';
        this.notificationService.showError(errorMessage);
        this.isLoading = false;
      }
    });
  }

  /**
   * Volta para a tela de busca
   */
  backToSearch(): void {
    this.showEditForm = false;
    this.foundMember = null;
    this.searchForm.reset();
    this.editForm.reset();
  }
}

