import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../shared/service/api.service';
import { Subject, takeUntil } from 'rxjs';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { NavigationIcons, ActionIcons } from '../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';

@Component({
  selector: 'member-management',
  standalone: true,
  templateUrl: './member-management.html',
  styleUrl: './member-management.scss',
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DatePipe, DataTableComponent]
})
export class MemberManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);

  members: Member[] = [];
  filteredMembers: Member[] = [...this.members];
  searchTerm = '';
  estadoCivilFilter: boolean | '' = '';
  tipoCadastroFilter = '';

  // Configuração da tabela
  tableColumns: TableColumn[] = [
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
  isEditing = false;
  currentMember: any = {};
  viewingMember: Member | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = Math.ceil(this.members.length / this.itemsPerPage);

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.getMembers();
  }

  public getMembers() {
    this.api.get("members")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: res => {
          this.members = res || [];
          this.filterMembers();
          this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error loading members:', error);
          this.members = [];
          this.filterMembers();
          this.totalPages = 1;
          this.cdr.markForCheck();
        },
        complete: () => {
          this.filterMembers();
          this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
          this.cdr.markForCheck();
        }
      });
  }

  public createMember(member: Member) {
    this.api.post("members", member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
  }

  public updateMember(member: Member) {
    this.api.update(`members/${member.id}`, member)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => this.getMembers(),
        error: error => console.error(error),
        complete: () => this.getMembers()
      });
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
      this.totalPages = 1;
      this.currentPage = 1;
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

    this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
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
      operadora: '',
      contato: '',
      email: '',
      grupos: '',
      lgpd: '',
      lgpdAceitoEm: null,
      rede: '',
      version: null
    };
  }

  closeMemberModal() {
    this.showMemberModal = false;
    this.currentMember = {};
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
      return [];
    }
    
    return this.filteredMembers.map(member => ({
      ...member,
      _original: member, // Manter referência ao objeto original
      estadoCivil: member.estadoCivil ? 'Casado' : 'Solteiro',
      telefone: member.telefone || member.celular || member.comercial || '-',
      nascimento: member.nascimento ? new Date(member.nascimento).toLocaleDateString('pt-BR') : '-'
    }));
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

  saveMember() {
    if (this.isEditing) {
      const index = this.members.findIndex(m => m.id === this.currentMember.id);
      if (index !== -1) this.members[index] = { ...this.currentMember };
      this.updateMember(this.members[index]);
    } else {
      const newMember = {
        ...this.currentMember
      };
      this.createMember(newMember);
    }
    this.closeMemberModal();
  }

  deleteMember(member: Member) {
    if (confirm(`Tem certeza que deseja excluir o membro "${member.nome}"?`)) {
      this.delete(member.id);
      this.members = this.members.filter(m => m.id !== member.id);
      this.filterMembers();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onItemsPerPageChange() {
    this.totalPages = Math.ceil(this.filteredMembers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  getItemsPerPageOptions(): number[] {
    const total = this.filteredMembers.length;
    const options: number[] = [];
    
    if (total <= 10) {
      options.push(10);
    } else if (total <= 25) {
      options.push(10, 25);
    } else if (total <= 50) {
      options.push(10, 25, 50);
    } else if (total <= 100) {
      options.push(10, 25, 50, 100);
    } else {
      options.push(10, 25, 50, 100, 200);
    }
    
    return options;
  }
}
function provideAnimations(): readonly any[] | import("@angular/core").Type<any> {
  throw new Error('Function not implemented.');
}

