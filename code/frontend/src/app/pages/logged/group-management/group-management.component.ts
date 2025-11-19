import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { ActionIcons } from '../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GroupService, GroupDTO } from '../../../shared/service/group.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { EnrollmentService, GroupEnrollmentDTO, RejectEnrollmentDTO } from '../../../shared/service/enrollment.service';
import { MemberService, MemberDTO } from '../../../shared/service/member.service';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent],
  templateUrl: './group-management.component.html',
  styleUrl: './group-management.component.scss'
})
export class GroupManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();

  // Tabs
  activeTab: 'groups' | 'approvals' | 'members' = 'groups';

  // Groups tab
  groups: GroupDTO[] = [];
  filteredGroups: GroupDTO[] = [];
  searchTerm = '';
  isLoading = false;

  // Approvals tab
  pendingEnrollments: GroupEnrollmentDTO[] = [];
  isLoadingApprovals = false;
  showRejectModal = false;
  selectedEnrollment: GroupEnrollmentDTO | null = null;
  rejectJustify = false;
  rejectReason = '';

  // Members tab
  members: MemberDTO[] = [];
  filteredMembers: MemberDTO[] = [];
  memberSearchTerm = '';
  groupFilter: number | null = null;
  isLoadingMembers = false;
  showRemoveModal = false;
  selectedMember: MemberDTO | null = null;
  selectedEnrollmentToRemove: GroupEnrollmentDTO | null = null;

  // Modal state
  showModal = false;
  isEditing = false;
  currentGroup: GroupDTO = { nome: '', descricao: '' };
  modalTitle = 'Novo Grupo';

  // Table configuration
  tableColumns: TableColumn[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'descricao', label: 'Descrição', sortable: false },
    { key: 'memberCount', label: 'Pessoas Cadastradas', sortable: true, align: 'center' }
  ];

  approvalsColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'memberName', label: 'Nome', sortable: true },
    { key: 'groupName', label: 'Grupo', sortable: true },
    { key: 'whatsapp', label: 'WhatsApp', width: '80px', align: 'center' }
  ];

  membersColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'grupos', label: 'Grupos', sortable: false },
    { key: 'whatsapp', label: 'WhatsApp', width: '80px', align: 'center' }
  ];

  constructor(
    private groupService: GroupService,
    private enrollmentService: EnrollmentService,
    private memberService: MemberService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const tab = params['tab'] as 'groups' | 'approvals' | 'members';
      if (tab && ['groups', 'approvals', 'members'].includes(tab)) {
        this.activeTab = tab;
      }
      this.loadTabData();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  switchTab(tab: 'groups' | 'approvals' | 'members'): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
    this.loadTabData();
  }

  loadTabData(): void {
    if (this.activeTab === 'groups') {
      this.loadGroups();
    } else if (this.activeTab === 'approvals') {
      this.loadPendingEnrollments();
    } else if (this.activeTab === 'members') {
      this.loadMembers();
    }
  }

  loadGroups(): void {
    this.isLoading = true;
    this.groupService.getAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (groups) => {
          this.groups = groups;
          this.filteredGroups = [...groups];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading groups:', err);
          this.notificationService.showError('Erro ao carregar grupos');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  filterGroups(): void {
    if (!this.searchTerm.trim()) {
      this.filteredGroups = [...this.groups];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredGroups = this.groups.filter(group =>
      group.nome.toLowerCase().includes(term) ||
      (group.descricao && group.descricao.toLowerCase().includes(term))
    );
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentGroup = { nome: '', descricao: '' };
    this.modalTitle = 'Novo Grupo';
    this.showModal = true;
  }

  openEditModal(group: GroupDTO): void {
    this.isEditing = true;
    this.currentGroup = { ...group };
    this.modalTitle = 'Editar Grupo';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentGroup = { nome: '', descricao: '' };
  }

  saveGroup(): void {
    if (!this.currentGroup.nome || this.currentGroup.nome.trim().length === 0) {
      this.notificationService.showError('O nome do grupo é obrigatório');
      return;
    }

    const groupData: GroupDTO = {
      nome: this.currentGroup.nome.trim(),
      descricao: this.currentGroup.descricao?.trim() || ''
    };

    const operation = this.isEditing
      ? this.groupService.update(this.currentGroup.id!, groupData)
      : this.groupService.create(groupData);

    operation
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(
            this.isEditing ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!'
          );
          this.closeModal();
          this.loadGroups();
        },
        error: (err) => {
          console.error('Error saving group:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao salvar grupo';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  deleteGroup(group: GroupDTO): void {
    if (group.memberCount && group.memberCount > 0) {
      this.notificationService.showError(
        `Não é possível deletar o grupo '${group.nome}' pois ele possui ${group.memberCount} pessoa(s) cadastrada(s). Remova os membros do grupo antes de deletá-lo.`
      );
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o grupo "${group.nome}"?`)) {
      return;
    }

    this.groupService.delete(group.id!)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Grupo deletado com sucesso!');
          this.loadGroups();
        },
        error: (err) => {
          console.error('Error deleting group:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao deletar grupo';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  getTableActions(): TableAction[] {
    return [
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => this.openEditModal(row._original)
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => this.deleteGroup(row._original),
        class: 'text-danger',
        condition: (row) => !row._original.memberCount || row._original.memberCount === 0
      }
    ];
  }

  getTableData(): any[] {
    return this.filteredGroups.map(group => ({
      ...group,
      memberCount: group.memberCount || 0,
      _original: group
    }));
  }

  getModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeModal()
      },
      {
        label: this.isEditing ? 'Atualizar' : 'Criar',
        type: 'primary',
        action: () => this.saveGroup()
      }
    ];
  }

  getActionIcon(iconName: 'view' | 'edit' | 'delete' | 'duplicate' | 'save' | 'copy'): SafeHtml {
    const icons = {
      view: ActionIcons.view({ size: 16, color: 'currentColor' }),
      edit: ActionIcons.edit({ size: 16, color: 'currentColor' }),
      delete: ActionIcons.delete({ size: 16, color: 'currentColor' }),
      duplicate: ActionIcons.duplicate({ size: 16, color: 'currentColor' }),
      save: ActionIcons.save({ size: 16, color: 'currentColor' }),
      copy: ActionIcons.duplicate({ size: 16, color: 'currentColor' })
    };
    const html = icons[iconName] || '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Approvals tab methods
  loadPendingEnrollments(): void {
    this.isLoadingApprovals = true;
    this.enrollmentService.getPendingEnrollments()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (enrollments) => {
          this.pendingEnrollments = enrollments;
          this.isLoadingApprovals = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading pending enrollments:', err);
          console.error('Error details:', JSON.stringify(err, null, 2));
          const errorMessage = err?.error?.message || err?.error || 'Erro ao carregar solicitações pendentes';
          this.notificationService.showError(errorMessage);
          this.pendingEnrollments = [];
          this.isLoadingApprovals = false;
          this.cdr.detectChanges();
        }
      });
  }

  approveEnrollment(enrollmentId: number): void {
    this.enrollmentService.approveEnrollment(enrollmentId)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Solicitação aprovada com sucesso!');
          this.loadPendingEnrollments();
          this.loadGroups(); // Atualizar contagem
        },
        error: (err) => {
          console.error('Error approving enrollment:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao aprovar solicitação';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  openRejectModal(enrollment: GroupEnrollmentDTO): void {
    this.selectedEnrollment = enrollment;
    this.rejectJustify = false;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedEnrollment = null;
    this.rejectJustify = false;
    this.rejectReason = '';
  }

  rejectEnrollment(): void {
    if (!this.selectedEnrollment) return;

    if (this.rejectJustify && !this.rejectReason.trim()) {
      this.notificationService.showError('Por favor, informe o motivo da rejeição');
      return;
    }

    const dto: RejectEnrollmentDTO = {
      justifyRejection: this.rejectJustify,
      rejectionReason: this.rejectJustify ? this.rejectReason.trim() : undefined
    };

    this.enrollmentService.rejectEnrollment(this.selectedEnrollment.id, dto)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Solicitação rejeitada');
          this.closeRejectModal();
          this.loadPendingEnrollments();
        },
        error: (err) => {
          console.error('Error rejecting enrollment:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao rejeitar solicitação';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  getEnrollmentImageUrl(enrollment: GroupEnrollmentDTO): string {
    return buildProfileImageUrl(enrollment.memberFotoUrl);
  }

  getEnrollmentWhatsAppLink(enrollment: GroupEnrollmentDTO): string | null {
    if (!enrollment.memberCelular) return null;
    return this.utilsService.getWhatsAppLink(enrollment.memberCelular);
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>'
    );
  }

  getApprovalsTableData(): any[] {
    return this.pendingEnrollments.map(enrollment => ({
      foto: enrollment.memberFotoUrl,
      memberName: enrollment.memberName,
      groupName: enrollment.groupName,
      whatsapp: enrollment.memberCelular,
      _original: enrollment
    }));
  }

  getApprovalsTableActions(): TableAction[] {
    return [
      {
        label: 'Aprovar',
        icon: 'save',
        action: (row) => this.approveEnrollment(row._original.id),
        class: 'text-success'
      },
      {
        label: 'Rejeitar',
        icon: 'delete',
        action: (row) => this.openRejectModal(row._original),
        class: 'text-danger'
      }
    ];
  }

  // Members tab methods
  loadMembers(): void {
    this.isLoadingMembers = true;
    this.memberService.getAll()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (members) => {
          this.members = members.filter(member => 
            member.groupEnrollments && 
            member.groupEnrollments.some(e => e.status === 'APPROVED')
          );
          this.filterMembers();
          this.isLoadingMembers = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading members:', err);
          this.notificationService.showError('Erro ao carregar membros');
          this.isLoadingMembers = false;
          this.cdr.detectChanges();
        }
      });
  }

  filterMembers(): void {
    let filtered = [...this.members];

    if (this.memberSearchTerm.trim()) {
      const term = this.memberSearchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.nome?.toLowerCase().includes(term)
      );
    }

    if (this.groupFilter) {
      filtered = filtered.filter(member =>
        member.groupEnrollments?.some(e => 
          e.groupId === this.groupFilter && e.status === 'APPROVED'
        )
      );
    }

    this.filteredMembers = filtered;
  }

  removeFromGroup(member: MemberDTO): void {
    const approvedEnrollments = this.getApprovedEnrollments(member);
    
    if (approvedEnrollments.length === 0) {
      this.notificationService.showError('Membro não está em nenhum grupo');
      return;
    }

    if (approvedEnrollments.length === 1) {
      if (confirm(`Tem certeza que deseja remover ${member.nome} do grupo ${approvedEnrollments[0].groupName}?`)) {
        this.enrollmentService.removeEnrollment(approvedEnrollments[0].id)
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe({
            next: () => {
              this.notificationService.showSuccess('Membro removido do grupo com sucesso!');
              this.loadMembers();
              this.loadGroups();
            },
            error: (err) => {
              console.error('Error removing enrollment:', err);
              const errorMessage = err?.error?.message || err?.error || 'Erro ao remover membro';
              this.notificationService.showError(errorMessage);
            }
          });
      }
    } else {
      this.selectedMember = member;
      this.selectedEnrollmentToRemove = null;
      this.showRemoveModal = true;
    }
  }

  confirmRemoveFromGroup(): void {
    if (!this.selectedMember || !this.selectedEnrollmentToRemove) return;

    this.enrollmentService.removeEnrollment(this.selectedEnrollmentToRemove.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Membro removido do grupo com sucesso!');
          this.closeRemoveModal();
          this.loadMembers();
          this.loadGroups();
        },
        error: (err) => {
          console.error('Error removing enrollment:', err);
          const errorMessage = err?.error?.message || err?.error || 'Erro ao remover membro';
          this.notificationService.showError(errorMessage);
        }
      });
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.selectedMember = null;
    this.selectedEnrollmentToRemove = null;
  }

  getApprovedEnrollments(member: MemberDTO): GroupEnrollmentDTO[] {
    return member.groupEnrollments?.filter(e => e.status === 'APPROVED') || [];
  }

  getMemberImageUrl(member: MemberDTO): string {
    return buildProfileImageUrl(member.fotoUrl);
  }

  getMemberWhatsAppLink(member: MemberDTO): string | null {
    if (!member.celular) return null;
    return this.utilsService.getWhatsAppLink(member.celular);
  }

  getMembersTableData(): any[] {
    return this.filteredMembers.map(member => ({
      foto: member.fotoUrl,
      nome: member.nome,
      grupos: this.getApprovedEnrollments(member),
      whatsapp: member.celular,
      _original: member
    }));
  }

  getMembersTableActions(): TableAction[] {
    return [
      {
        label: 'Remover do Grupo',
        icon: 'delete',
        action: (row) => this.removeFromGroup(row._original),
        class: 'text-danger'
      }
    ];
  }

  getRejectModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeRejectModal()
      },
      {
        label: 'Rejeitar',
        type: 'primary',
        action: () => this.rejectEnrollment()
      }
    ];
  }

  getRemoveModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closeRemoveModal()
      },
      {
        label: 'Remover',
        type: 'primary',
        action: () => this.confirmRemoveFromGroup(),
        disabled: !this.selectedEnrollmentToRemove
      }
    ];
  }
}

