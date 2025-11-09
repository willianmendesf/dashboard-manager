import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/service/api.service';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { NavigationIcons, ActionIcons, MessageIcons } from '../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';
import { environment } from '../../../environments/environment';
import { Member } from './model/member.model';
import { NotificationService } from '../../shared/services/notification.service';
import { SpousePreviewComponent } from './components/spouse-preview.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { UtilsService } from '../../shared/services/utils.service';

@Component({
  selector: 'member-management',
  standalone: true,
  templateUrl: './member-management.html',
  styleUrl: './member-management.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DatePipe, DataTableComponent, NgxMaskDirective, SpousePreviewComponent],
  providers: [provideNgxMask()]
})
export class MemberManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  public utilsService = inject(UtilsService);

  members: Member[] = [];
  filteredMembers: Member[] = [...this.members];
  tableData: any[] = []; // Dados formatados para a tabela
  searchTerm = '';
  estadoCivilFilter: boolean | '' = '';
  tipoCadastroFilter = '';

  // Configuração da tabela
  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'cpf', label: 'CPF', sortable: true },
    { key: 'rg', label: 'RG' },
    { key: 'nascimento', label: 'Data de Nascimento', sortable: true },
    { key: 'estadoCivil', label: 'Estado Civil' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'email', label: 'Email', sortable: true }
  ];

  getTableActions(): TableAction[] {
    return [
      {
        label: 'Visualizar',
        icon: 'view',
        action: (row) => {
          if (row._original) this.viewMember(row._original);
        }
      },
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => {
          if (row._original) this.editMember(row._original);
        }
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) this.deleteMember(row._original);
        }
      }
    ];
  }

  showMemberModal = false;
  showViewModal = false;
  showImportModal = false;
  isEditing = false;
  currentMember: any = {};
  viewingMember: Member | null = null;
  
  // Import modal state
  selectedImportFile: File | null = null;
  importProgress = '';
  importResult: any = null;
  isImporting = false;

  // Paginação agora é gerenciada pelo DataTableComponent

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // Import methods
  openImportModal(): void {
    this.showImportModal = true;
    this.selectedImportFile = null;
    this.importProgress = '';
    this.importResult = null;
    this.isImporting = false;
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.selectedImportFile = null;
    this.importProgress = '';
    this.importResult = null;
    this.isImporting = false;
  }

  onImportFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.notificationService.showError('Formato de arquivo inválido. Use .xlsx, .xls ou .csv');
        return;
      }
      
      this.selectedImportFile = file;
      this.importProgress = `Arquivo selecionado: ${file.name}`;
    }
  }

  onImportFileDropped(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        this.notificationService.showError('Formato de arquivo inválido. Use .xlsx, .xls ou .csv');
        return;
      }
      
      this.selectedImportFile = file;
      this.importProgress = `Arquivo selecionado: ${file.name}`;
    }
  }

  onImportDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  downloadTemplate(): void {
    this.http.get(`${environment.apiUrl}members/import/template`, { 
      responseType: 'blob',
      withCredentials: true 
    })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'modelo_importacao_membros.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notificationService.showSuccess('Modelo baixado com sucesso!');
        },
        error: (error) => {
          console.error('Error downloading template:', error);
          this.notificationService.showError('Erro ao baixar modelo de planilha');
        }
      });
  }

  uploadImportFile(): void {
    if (!this.selectedImportFile) {
      this.notificationService.showError('Selecione um arquivo para importar');
      return;
    }

    this.isImporting = true;
    this.importProgress = 'Processando arquivo...';

    const formData = new FormData();
    formData.append('file', this.selectedImportFile);

    this.http.post(`${environment.apiUrl}members/import`, formData, { withCredentials: true })
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (result: any) => {
          this.importResult = result;
          this.isImporting = false;
          
          const successCount = result.successCount || 0;
          const errorCount = result.errorCount || 0;
          const totalRows = result.totalRows || 0;
          const createdCount = result.createdCount || 0;
          const updatedCount = result.updatedCount || 0;

          if (errorCount === 0) {
            this.notificationService.showSuccess(
              `Importação concluída! ${successCount} membro(s) processado(s) com sucesso.`
            );
          } else {
            this.notificationService.showError(
              `Importação concluída com erros: ${successCount} sucesso(s), ${errorCount} erro(s).`
            );
          }

          // Refresh members list
          this.getMembers();
          
          // Show detailed result
          this.importProgress = `
            Total de linhas: ${totalRows}
            Criados: ${createdCount}
            Atualizados: ${updatedCount}
            Sucessos: ${successCount}
            Erros: ${errorCount}
          `;
        },
        error: (error) => {
          console.error('Error importing file:', error);
          this.isImporting = false;
          const errorMessage = error?.error?.message || error?.error || 'Erro ao importar arquivo';
          this.notificationService.showError(`Erro na importação: ${errorMessage}`);
          this.importProgress = 'Erro ao processar arquivo';
        }
      });
  }

  ngOnInit() {
    this.getMembers();
  }

  public getMembers() {
    this.api.get("members")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: res => {
          // Garantir que fotoUrl seja mapeado corretamente
          this.members = (res || []).map((member: any) => ({
            ...member,
            fotoUrl: member.fotoUrl || null
          }));
          this.filterMembers(); // Isso já chama getTableData() internamente
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error loading members:', error);
          this.members = [];
          this.filterMembers();
          this.cdr.markForCheck();
        },
        complete: () => {
          this.filterMembers();
          this.cdr.markForCheck();
        }
      });
  }

  public createMember(member: Member) {
    this.api.post("members", member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: async (res: any) => {
          // Upload photo if selected after member is created
          if (this.selectedPhotoFile && res && res.id) {
            await this.uploadMemberPhoto(res.id);
          }
          this.notificationService.showSuccess("Membro criado com sucesso!");
          this.getMembers();
          this.closeMemberModal();
        },
        error: (error) => {
          console.error(error);
          const errorMessage = error?.error?.message || error?.error || 'Erro ao criar membro. Tente novamente.';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  public updateMember(member: Member) {
    this.api.update(`members/${member.id}`, member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess("Membro atualizado com sucesso!");
          this.getMembers();
          this.closeMemberModal();
        },
        error: (error) => {
          console.error(error);
          const errorMessage = error?.error?.message || error?.error || 'Erro ao atualizar membro. Tente novamente.';
          this.notificationService.showError(errorMessage);
        }
      });
  }
  
  lookupCep(cep: string) {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return;
    }
    
    const cleanCep = cep.replace(/\D/g, '');
    this.http.get(`https://viacep.com.br/ws/${cleanCep}/json/`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (endereco: any) => {
          if (endereco && !endereco.erro) {
            this.currentMember.logradouro = endereco.logradouro || '';
            this.currentMember.bairro = endereco.bairro || '';
            this.currentMember.cidade = endereco.localidade || '';
            this.currentMember.estado = endereco.uf || '';
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          console.error('Erro ao buscar CEP:', error);
        }
      });
  }
  
  isValidCpf(cpf: string | null | undefined): boolean {
    if (!cpf) return false;
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.length === 11;
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      MessageIcons.whatsapp({ size: 20, color: '#25D366' })
    );
  }

  public delete(id: number) {
    this.api.delete("members/" + id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
  }

  filterMembers() {
    if (!this.members || this.members.length === 0) {
      this.filteredMembers = [];
      this.getTableData(); // Atualizar tableData
      return;
    }

    this.filteredMembers = this.members.filter(member => {
      if (!member) return false;
      
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
                            (member.nome && member.nome.toLowerCase().includes(searchLower)) ||
                            (member.email && member.email.toLowerCase().includes(searchLower)) ||
                            (member.cpf && member.cpf.toLowerCase().includes(searchLower));
      const matchesEstadoCivil = this.estadoCivilFilter === '' || member.estadoCivil === this.estadoCivilFilter;
      const matchesTipoCadastro = !this.tipoCadastroFilter || member.tipoCadastro === this.tipoCadastroFilter;

      return matchesSearch && matchesEstadoCivil && matchesTipoCadastro;
    });

    // Atualizar tableData após filtrar
    this.getTableData();
  }

  openMemberModal(member?: Member) {
    this.showMemberModal = true;
    this.isEditing = !!member;
    this.currentMember = member ? { ...member } : {
      nome: '',
      cpf: '',
      rg: '',
      conjugueCPF: '',
      comungante: false,
      intercessor: false,
      tipoCadastro: '',
      nascimento: null,
      idade: null,
      estadoCivil: false,
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      telefone: '',
      comercial: '',
      celular: '',
      contato: '',
      email: '',
      grupos: '',
      lgpd: '',
      lgpdAceitoEm: null,
      rede: '',
      version: null
    };
    this.photoPreview = (member as any)?.fotoUrl || null;
    this.selectedPhotoFile = null;
  }

  closeMemberModal() {
    this.showMemberModal = false;
    this.currentMember = {};
    this.photoPreview = null;
    this.selectedPhotoFile = null;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.selectedPhotoFile = file;
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreview = e.target.result;
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async uploadMemberPhoto(memberId: number): Promise<void> {
    if (!this.selectedPhotoFile) return;

    this.uploadingPhoto = true;
    const formData = new FormData();
    formData.append('file', this.selectedPhotoFile);

    try {
      const response: any = await this.http.post(
        `${environment.apiUrl}members/${memberId}/upload-foto`,
        formData,
        { withCredentials: true }
      ).toPromise();
      
      // Get fotoUrl from response
      const fotoUrl = response?.fotoUrl || response?.member?.fotoUrl;
      
      if (fotoUrl) {
        // Update current member in modal
        (this.currentMember as any).fotoUrl = fotoUrl;
        this.photoPreview = fotoUrl;
        
        // Update member in local list immediately
        const memberIndex = this.members.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
          (this.members[memberIndex] as any).fotoUrl = fotoUrl;
          this.filterMembers(); // Refresh filtered list
        }
        
        // Update viewing member if it's the same member
        if (this.viewingMember && this.viewingMember.id === memberId) {
          (this.viewingMember as any).fotoUrl = fotoUrl;
        }
        
        this.notificationService.showSuccess('Foto enviada com sucesso!');
        this.cdr.markForCheck(); // Force change detection
        
        // Refresh members list from backend to ensure consistency
        this.getMembers();
      } else {
        this.notificationService.showError('Resposta inválida do servidor.');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error?.error?.error || error?.error?.message || 'Erro ao fazer upload da foto. Tente novamente.';
      this.notificationService.showError(errorMessage);
    } finally {
      this.uploadingPhoto = false;
      this.selectedPhotoFile = null;
      this.cdr.markForCheck();
    }
  }

  viewMember(member: Member) {
    this.viewingMember = { ...member };
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingMember = null;
  }

  getSearchIcon(): SafeHtml {
    const html = NavigationIcons.search({ size: 20, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getImportIcon(): SafeHtml {
    const html = ActionIcons.upload({ size: 18, color: 'currentColor' });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getActionIcon(iconName: 'view' | 'edit' | 'delete'): SafeHtml {
    const icons = {
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getTableData(): any[] {
    if (!this.filteredMembers || this.filteredMembers.length === 0) {
      this.tableData = [];
      return this.tableData;
    }
    
    this.tableData = this.filteredMembers.map(member => ({
      ...member,
      _original: member, // Manter referência ao objeto original
      foto: member.fotoUrl || null,
      estadoCivil: member.estadoCivil ? 'Casado' : 'Solteiro',
      telefone: member.telefone || '-',
      celular: member.celular || '-',
      nascimento: member.nascimento ? new Date(member.nascimento).toLocaleDateString('pt-BR') : '-'
    }));
    return this.tableData;
  }

  editMember(member: Member) {
    this.closeViewModal();
    this.openMemberModal(member);
  }

  getViewModalButtons(): ModalButton[] {
    if (!this.viewingMember) {
      return [
        {
          label: 'Fechar',
          type: 'secondary',
          action: () => this.closeViewModal()
        }
      ];
    }
    return [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closeViewModal()
      },
      {
        label: 'Editar Membro',
        type: 'primary',
        action: () => {
          if (this.viewingMember) {
            this.editMember(this.viewingMember);
          }
        }
      }
    ];
  }

  getEditModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeMemberModal()
      },
      {
        label: 'Salvar Alterações',
        type: 'primary',
        action: () => this.saveMember()
      }
    ];
  }

  async saveMember() {
    // Validate LGPD date if LGPD is accepted
    if (this.currentMember.lgpd === true && !this.currentMember.lgpdAceitoEm) {
      this.notificationService.showError('Por favor, informe a data de aceite do LGPD.');
      return;
    }
    
    if (this.isEditing) {
      const index = this.members.findIndex(m => m.id === this.currentMember.id);
      if (index !== -1) this.members[index] = { ...this.currentMember };
      
      // Upload photo first if selected
      if (this.selectedPhotoFile && this.currentMember.id) {
        await this.uploadMemberPhoto(this.currentMember.id);
      }
      
      // Then update member data
      this.updateMember(this.members[index]);
    } else {
      const newMember = {
        ...this.currentMember
      };
      this.createMember(newMember);
      
      // Upload photo after member is created (need to get the new member ID from response)
      // This will be handled in the createMember response
    }
  }

  deleteMember(member: Member) {
    if (confirm(`Tem certeza que deseja excluir o membro "${member.nome}"?`)) {
      this.delete(member.id);
      this.members = this.members.filter(m => m.id !== member.id);
      this.filterMembers();
    }
  }

  // Métodos de paginação removidos - agora gerenciados pelo DataTableComponent

  getImportModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeImportModal()
      },
      {
        label: this.isImporting ? 'Processando...' : 'Enviar',
        type: 'primary',
        action: () => this.uploadImportFile(),
        disabled: !this.selectedImportFile || this.isImporting
      }
    ];
  }

  // Método removido - paginação agora é gerenciada pelo DataTableComponent

  formatImportProgress(progress: string): string {
    if (!progress) return '';
    return progress.replace(/\n/g, '<br>');
  }
}

