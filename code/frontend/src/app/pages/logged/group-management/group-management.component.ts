import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { ModalComponent, ModalButton } from '../../../shared/modules/modal/modal.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/lib/utils/data-table.component';
import { ActionIcons } from '../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GroupService, GroupDTO } from '../../../shared/service/group.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-group-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent],
  templateUrl: './group-management.component.html',
  styleUrl: './group-management.component.scss'
})
export class GroupManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();

  groups: GroupDTO[] = [];
  filteredGroups: GroupDTO[] = [];
  searchTerm = '';
  isLoading = false;

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

  constructor(
    private groupService: GroupService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
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
}

