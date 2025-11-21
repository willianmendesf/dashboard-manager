import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../shared/service/api.service';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { NavigationIcons, ActionIcons, MessageIcons } from '../../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { environment } from '../../../../environments/environment';
import { Member } from './model/member.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { SpousePreviewComponent } from './components/spouse-preview.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { UtilsService } from '../../../shared/services/utils.service';
import { GroupService, GroupDTO } from '../../../shared/service/group.service';
import { EnrollmentService, GroupEnrollmentDTO } from '../../../shared/service/enrollment.service';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';

@Component({
  selector: 'member-management',
  standalone: true,
  templateUrl: './member-management.html',
  styleUrl: './member-management.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DatePipe, DataTableComponent, NgxMaskDirective, SpousePreviewComponent],
  providers: [provideNgxMask()]
})
export class MemberManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  public utilsService = inject(UtilsService);

  members: Member[] = [];
  filteredMembers: Member[] = [...this.members];
  tableData: any[] = [];
  searchTerm = '';
  tipoCadastroFilter = '';
  estadoCivilFilter = '';
  intercessorFilter = '';
  groupFilter: number | null = null;
  currentSort: { column: string; direction: 'asc' | 'desc' } | null = null;
  
  availableGroups: GroupDTO[] = [];
  selectedGroupIds: number[] = [];
  memberEnrollments: Map<number, GroupEnrollmentDTO[]> = new Map();

  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'whatsapp', label: 'WhatsApp', width: '80px', align: 'center' },
    { key: 'tipoCadastro', label: 'Tipo de Cadastro', sortable: true },
    { key: 'intercessor', label: 'Intercessor?', width: '120px', align: 'center', sortable: true },
    { key: 'nascimento', label: 'Data de Nascimento', sortable: true },
    { key: 'estadoCivil', label: 'Estado Civil', sortable: true }
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
          if (row._original) this.editMember(row._original.id);
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
  
  selectedImportFile: File | null = null;
  importProgress = '';
  importResult: any = null;
  isImporting = false;

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private groupService: GroupService,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

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

          this.getMembers();
          
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

  ngAfterViewInit() {
    this.loadGroups();
  }

  loadGroups(): void {
    this.groupService.getAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (groups) => {
          this.availableGroups = groups || [];
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading groups:', err);
          this.availableGroups = [];
        }
      });
  }

  public getMembers() {
    // Sempre buscar todos os membros - filtro por grupo será aplicado localmente via groupEnrollments
    this.api.get("members")
      .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          next: res => {
            this.members = (res || []).map((member: any) => {
              // Converter estadoCivil de string para boolean se necessário
              let estadoCivilBoolean: boolean;
              if (typeof member.estadoCivil === 'boolean') {
                estadoCivilBoolean = member.estadoCivil;
              } else if (typeof member.estadoCivil === 'string') {
                estadoCivilBoolean = member.estadoCivil === 'Casado' || member.estadoCivil.toLowerCase() === 'casado';
              } else {
                estadoCivilBoolean = false; // default para Solteiro
              }
              
              return {
                ...member,
                fotoUrl: member.fotoUrl || null,
                groupEnrollments: member.groupEnrollments || [],
                estadoCivil: estadoCivilBoolean,
                child: member.child !== undefined ? member.child : false
              };
            });
            // Carregar enrollments para todos os membros
            this.members.forEach(member => {
              if (member.id) {
                this.loadMemberEnrollments(member.id);
              }
            });
            this.filterMembers();
            setTimeout(() => {
              this.cdr.markForCheck();
            }, 0);
          },
        error: error => {
          console.error('Error loading members:', error);
          this.members = [];
          this.filterMembers();
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 0);
        },
        complete: () => {
        }
      });
  }

  public createMember(member: Member) {
    const memberData = {
      ...member
      // NÃO enviar groups - grupos são gerenciados via enrollments
    } as any;
    
    this.api.post("members", memberData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: async (res: any) => {
          if (this.selectedPhotoFile && res && res.id) {
            await this.uploadMemberPhoto(res.id);
          }
          
          // Criar enrollments APPROVED para grupos selecionados
          if (res && res.id && this.selectedGroupIds.length > 0) {
            const enrollmentPromises = this.selectedGroupIds.map(groupId =>
              this.enrollmentService.createDirectApproval(res.id, groupId).toPromise()
            );
            
            Promise.all(enrollmentPromises)
              .then(() => {
                this.notificationService.showSuccess("Membro criado com sucesso!");
                this.getMembers();
                this.closeMemberModal();
              })
              .catch((error) => {
                console.error('Error creating enrollments:', error);
                this.notificationService.showError('Membro criado, mas houve erro ao adicionar grupos. Tente novamente.');
                this.getMembers();
                this.closeMemberModal();
              });
          } else {
            this.notificationService.showSuccess("Membro criado com sucesso!");
            this.getMembers();
            this.closeMemberModal();
          }
        },
        error: (error) => {
          console.error(error);
          const errorMessage = error?.error?.message || error?.error || 'Erro ao criar membro. Tente novamente.';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  public updateMember(member: Member) {
    const estadoCivilValue: any = (member as any).estadoCivil;
    let estadoCivilBoolean: boolean;
    
    if (typeof estadoCivilValue === 'boolean') {
      estadoCivilBoolean = estadoCivilValue;
    } else if (typeof estadoCivilValue === 'string') {
      const estadoCivilStr = estadoCivilValue.toLowerCase().trim();
      estadoCivilBoolean = estadoCivilStr === 'casado' || estadoCivilStr === 'true';
    } else {
      estadoCivilBoolean = false;
    }
    
    console.log('Converting estadoCivil:', estadoCivilValue, '->', estadoCivilBoolean, typeof estadoCivilBoolean);
    
    const memberData: any = {
      nome: member.nome || '',
      email: member.email || '',
      conjugueTelefone: member.conjugueTelefone || null,
      comungante: member.comungante !== undefined ? member.comungante : null,
      intercessor: member.intercessor !== undefined ? member.intercessor : false,
      tipoCadastro: (member.tipoCadastro && typeof member.tipoCadastro === 'string' && member.tipoCadastro.trim()) ? member.tipoCadastro.trim() : null,
      nascimento: member.nascimento || null,
      idade: member.idade || null,
      estadoCivil: estadoCivilBoolean,
      child: member.child !== undefined ? member.child : false,
      cep: member.cep || null,
      logradouro: member.logradouro || null,
      numero: member.numero || null,
      complemento: member.complemento || null,
      bairro: member.bairro || null,
      cidade: member.cidade || null,
      estado: member.estado || null,
      telefone: member.telefone || null,
      comercial: member.comercial || null,
      celular: member.celular || null,
      lgpd: typeof member.lgpd === 'boolean' ? member.lgpd : (member.lgpd === 'true' ? true : (member.lgpd === 'false' ? false : null)),
      lgpdAceitoEm: member.lgpdAceitoEm ? member.lgpdAceitoEm : null,
      rede: member.rede || null,
      fotoUrl: (member as any).fotoUrl || null
    };
    
    // NÃO enviar groups - grupos são gerenciados via enrollments
    
    // Garantir que campos obrigatórios estejam presentes
    if (!memberData.nome || memberData.nome.trim() === '') {
      this.notificationService.showError('O nome do membro é obrigatório.');
      return;
    }
    
    if (memberData.estadoCivil === undefined || memberData.estadoCivil === null || typeof memberData.estadoCivil !== 'boolean') {
      memberData.estadoCivil = false;
    }
    if (memberData.intercessor === undefined || memberData.intercessor === null) {
      memberData.intercessor = false;
    }
    if (memberData.comungante === undefined) {
      memberData.comungante = null;
    }
    if (memberData.tipoCadastro === '' || (memberData.tipoCadastro && typeof memberData.tipoCadastro === 'string' && memberData.tipoCadastro.trim() === '')) {
      memberData.tipoCadastro = null;
    }
    if (memberData.lgpd === undefined) {
      memberData.lgpd = null;
    }
    
    const fieldsToAlwaysInclude = ['nome', 'email', 'estadoCivil', 'intercessor', 
                                    'comungante', 'tipoCadastro', 'lgpd', 'lgpdAceitoEm'];
    
    Object.keys(memberData).forEach(key => {
      const value = memberData[key];
      if (fieldsToAlwaysInclude.includes(key)) {
        return;
      }
      if (value === '' || value === null || value === undefined) {
        delete memberData[key];
      }
    });
    
    console.log('Sending update request with data:', JSON.stringify(memberData, null, 2));
    
    this.api.update(`members/${member.id}`, memberData)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          // Atualizar enrollments após salvar membro
          this.updateMemberEnrollments(member.id);
        },
        error: (error) => {
          console.error('Error updating member:', error);
          console.error('Request data:', memberData);
          const errorMessage = error?.error?.message || error?.error || 'Erro ao atualizar membro. Tente novamente.';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  updateMemberEnrollments(memberId: number): void {
    const approvedGroups = this.getMemberApprovedGroups(memberId);
    const currentSelected = this.selectedGroupIds;

    // Grupos novos (marcados sem enrollment APPROVED)
    const newGroups = currentSelected.filter(id => !approvedGroups.includes(id));
    
    // Grupos removidos (approved sem marcar)
    const removedGroups = approvedGroups.filter(id => !currentSelected.includes(id));

    const enrollmentOperations: Promise<any>[] = [];

    // Criar enrollments APPROVED para grupos novos
    newGroups.forEach(groupId => {
      enrollmentOperations.push(
        this.enrollmentService.createDirectApproval(memberId, groupId).toPromise()
      );
    });

    // Remover enrollments para grupos removidos
    removedGroups.forEach(groupId => {
      const enrollments = this.memberEnrollments.get(memberId) || [];
      const enrollment = enrollments.find(e => e.groupId === groupId && e.status === 'APPROVED');
      if (enrollment) {
        enrollmentOperations.push(
          this.enrollmentService.removeEnrollment(enrollment.id).toPromise()
        );
      }
    });

    if (enrollmentOperations.length > 0) {
      Promise.all(enrollmentOperations)
        .then(() => {
          this.notificationService.showSuccess("Membro atualizado com sucesso!");
          this.getMembers();
          this.closeMemberModal();
        })
        .catch((error) => {
          console.error('Error updating enrollments:', error);
          this.notificationService.showError('Membro atualizado, mas houve erro ao atualizar grupos. Tente novamente.');
          this.getMembers();
          this.closeMemberModal();
        });
    } else {
      this.notificationService.showSuccess("Membro atualizado com sucesso!");
      this.getMembers();
      this.closeMemberModal();
    }
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
  
  isValidTelefone(telefone: string | null | undefined): boolean {
    if (!telefone) return false;
    const cleanTelefone = telefone.replace(/\D/g, '');
    return cleanTelefone.length >= 10 && cleanTelefone.length <= 11;
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
      this.getTableData();
      this.cdr.detectChanges();
      return;
    }

    this.filteredMembers = this.members.filter(member => {
      if (!member) return false;
      
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
                            (member.nome && member.nome.toLowerCase().includes(searchLower)) ||
                            (member.email && member.email.toLowerCase().includes(searchLower));
      const matchesTipoCadastro = !this.tipoCadastroFilter || 
                                   this.tipoCadastroFilter === '' || 
                                   (member.tipoCadastro && member.tipoCadastro === this.tipoCadastroFilter);
      
      let matchesEstadoCivil = true;
      if (this.estadoCivilFilter !== '') {
        if (this.estadoCivilFilter === 'Casado') {
          matchesEstadoCivil = member.estadoCivil === true;
        } else if (this.estadoCivilFilter === 'Solteiro') {
          matchesEstadoCivil = member.estadoCivil === false;
        }
      }

      let matchesIntercessor = true;
      if (this.intercessorFilter !== '') {
        if (this.intercessorFilter === 'Sim') {
          matchesIntercessor = member.intercessor === true;
        } else if (this.intercessorFilter === 'Não') {
          matchesIntercessor = member.intercessor === false;
        }
      }

      // Filtro por grupo usando groupEnrollments (apenas APPROVED)
      let matchesGroup = true;
      if (this.groupFilter !== null && this.groupFilter !== undefined) {
        matchesGroup = member.groupEnrollments?.some(e => 
          e.groupId === this.groupFilter && e.status === 'APPROVED'
        ) || false;
      }

      return matchesSearch && matchesEstadoCivil && matchesTipoCadastro && matchesIntercessor && matchesGroup;
    });

    this.getTableData();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  openMemberModal(member?: Member) {
    setTimeout(() => {
      this.showMemberModal = true;
      this.isEditing = !!member;
      this.currentMember = member ? { ...member } : {
        nome: '',
        conjugueTelefone: '',
        comungante: null,
        intercessor: false,
        child: false,
        tipoCadastro: null,
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
        email: '',
        lgpd: null,
        lgpdAceitoEm: null,
        rede: '',
        version: null
      };
      // Carregar grupos aprovados dos enrollments
      if (member?.id) {
        const enrollments = this.memberEnrollments.get(member.id) || [];
        // Se não há enrollments carregados, usar groupEnrollments do objeto member
        if (enrollments.length === 0 && member.groupEnrollments) {
          this.selectedGroupIds = member.groupEnrollments
            .filter(e => e.status === 'APPROVED')
            .map(e => e.groupId);
        } else {
          this.selectedGroupIds = enrollments
            .filter(e => e.status === 'APPROVED')
            .map(e => e.groupId);
        }
      } else {
        // Fallback apenas se não houver id e não houver groupEnrollments
        this.selectedGroupIds = (member?.groupEnrollments || [])
          .filter((e: GroupEnrollmentDTO) => e.status === 'APPROVED')
          .map((e: GroupEnrollmentDTO) => e.groupId);
      }
      this.photoPreview = (member as any)?.fotoUrl || null;
      this.selectedPhotoFile = null;
      this.cdr.markForCheck();
    }, 0);
  }

  closeMemberModal() {
    setTimeout(() => {
      this.showMemberModal = false;
      this.isEditing = false;
      this.currentMember = {};
      this.selectedGroupIds = [];
      this.photoPreview = null;
      this.selectedPhotoFile = null;
      this.cdr.markForCheck();
    }, 0);
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

  onGroupFilterChange(value: number | null): void {
    this.groupFilter = value;
    this.filterMembers();
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
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 0);
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
      
      const fotoUrl = response?.fotoUrl || response?.member?.fotoUrl;
      
      if (fotoUrl) {
        const fotoUrlWithTimestamp = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
        
        (this.currentMember as any).fotoUrl = fotoUrlWithTimestamp;
        
        const memberIndex = this.members.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
          this.members[memberIndex] = {
            ...this.members[memberIndex],
            fotoUrl: fotoUrlWithTimestamp
          };
        }
        
        if (this.viewingMember && this.viewingMember.id === memberId) {
          (this.viewingMember as any).fotoUrl = fotoUrlWithTimestamp;
        }
        
        this.notificationService.showSuccess('Foto enviada com sucesso!');
        
        setTimeout(() => {
          this.photoPreview = fotoUrlWithTimestamp;
          const filteredIndex = this.filteredMembers.findIndex(m => m.id === memberId);
          if (filteredIndex !== -1) {
            this.filteredMembers[filteredIndex] = {
              ...this.filteredMembers[filteredIndex],
              fotoUrl: fotoUrlWithTimestamp
            };
          }
          this.getTableData();
          this.cdr.markForCheck();
        }, 0);
      } else {
        this.notificationService.showError('Resposta inválida do servidor.');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error?.error?.error || error?.error?.message || 'Erro ao fazer upload da foto. Tente novamente.';
      this.notificationService.showError(errorMessage);
    } finally {
      setTimeout(() => {
        this.uploadingPhoto = false;
        this.selectedPhotoFile = null;
        this.cdr.markForCheck();
      }, 0);
    }
  }

  viewMember(member: Member) {
    this.viewingMember = { ...member };
    if (member.id) {
      this.loadMemberEnrollments(member.id);
    }
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
    
    const newTableData = this.filteredMembers.map(member => {
      const phoneNumber = (member.celular && member.celular.trim() !== '') 
        ? member.celular 
        : ((member.telefone && member.telefone.trim() !== '') ? member.telefone : null);
      
      return {
        ...member,
        _original: member,
        foto: member.fotoUrl || null,
        estadoCivil: member.estadoCivil ? 'Casado' : 'Solteiro',
        telefone: member.telefone || '-',
        celular: member.celular || '-',
        whatsapp: phoneNumber,
        tipoCadastro: member.tipoCadastro || '-',
        intercessor: member.intercessor ? 'Sim' : 'Não',
        nascimento: member.nascimento ? new Date(member.nascimento).toLocaleDateString('pt-BR') : '-'
      };
    });
    
    if (this.currentSort) {
      newTableData.sort((a, b) => {
        const column = this.currentSort!.column;
        const aValue = (a as any)[column];
        const bValue = (b as any)[column];
        
        if (aValue === null || aValue === undefined || aValue === '-') return 1;
        if (bValue === null || bValue === undefined || bValue === '-') return -1;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
          return this.currentSort!.direction === 'asc' ? comparison : -comparison;
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.currentSort!.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base' });
        return this.currentSort!.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    this.tableData = newTableData;
    return this.tableData;
  }
  
  onSortChange(sort: { column: string; direction: 'asc' | 'desc' }): void {
    this.currentSort = sort;
    this.getTableData();
    this.cdr.markForCheck();
  }

  loadMemberEnrollments(memberId: number): void {
    this.enrollmentService.getMemberEnrollments(memberId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (enrollments) => {
          this.memberEnrollments.set(memberId, enrollments);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading enrollments:', err);
          this.memberEnrollments.set(memberId, []);
        }
      });
  }

  getMemberApprovedGroups(memberId: number): number[] {
    const enrollments = this.memberEnrollments.get(memberId) || [];
    return enrollments
      .filter(e => e.status === 'APPROVED')
      .map(e => e.groupId);
  }

  getMemberPendingGroups(memberId: number): number[] {
    const enrollments = this.memberEnrollments.get(memberId) || [];
    return enrollments
      .filter(e => e.status === 'PENDING')
      .map(e => e.groupId);
  }

  editMember(memberId: number) {
    this.closeViewModal();
    this.api.get(`members/${memberId}`)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (member: any) => {
          // Converter estadoCivil de string para boolean se necessário
          if (typeof member.estadoCivil === 'boolean') {
            // Já é boolean, não precisa converter
          } else if (typeof member.estadoCivil === 'string') {
            member.estadoCivil = member.estadoCivil === 'Casado' || member.estadoCivil.toLowerCase() === 'casado';
          } else {
            member.estadoCivil = false; // default para Solteiro
          }
          this.loadMemberEnrollments(memberId);
          this.openMemberModal(member);
        },
        error: (error) => {
          console.error('Error loading member:', error);
          this.notificationService.showError('Erro ao carregar dados do membro');
        }
      });
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
          if (this.viewingMember?.id) {
            this.editMember(this.viewingMember.id);
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
    if (this.currentMember.lgpd === true && !this.currentMember.lgpdAceitoEm) {
      this.notificationService.showError('Por favor, informe a data de aceite do LGPD.');
      return;
    }
    
    if (this.isEditing) {
      const index = this.members.findIndex(m => m.id === this.currentMember.id);
      if (index !== -1) this.members[index] = { ...this.currentMember };
      
      if (this.selectedPhotoFile && this.currentMember.id) {
        await this.uploadMemberPhoto(this.currentMember.id);
      }
      
      this.updateMember(this.members[index]);
    } else {
      const newMember = {
        ...this.currentMember
      };
      this.createMember(newMember);
    }
  }

  deleteMember(member: Member) {
    if (confirm(`Tem certeza que deseja excluir o membro "${member.nome}"?`)) {
      this.delete(member.id);
      this.members = this.members.filter(m => m.id !== member.id);
      this.filterMembers();
    }
  }

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

  formatImportProgress(progress: string): string {
    if (!progress) return '';
    return progress.replace(/\n/g, '<br>');
  }

  /**
   * Build member photo URL for display (like appointments)
   */
  getNormalizedPhotoUrl(fotoUrl: string | null | undefined): string {
    return buildProfileImageUrl(fotoUrl);
  }
}

