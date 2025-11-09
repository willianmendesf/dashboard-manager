import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../shared/service/api.service';
import { Subject, takeUntil } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { PageTitleComponent } from "../../shared/modules/pagetitle/pagetitle.component";
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';
import { NavigationIcons, ActionIcons } from '../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);

  users: User[] = [];
  filteredUsers: User[] = [...this.users];
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';

  // Configuração da tabela
  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'username', label: 'Usuário', sortable: true },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Perfil', sortable: true },
    { key: 'status', label: 'Status', sortable: true }
  ];

  getTableActions(): TableAction[] {
    return [
      {
        label: 'Visualizar',
        icon: 'view',
        action: (row) => {
          if (row._original) this.viewUser(row._original);
        }
      },
      {
        label: 'Editar',
        icon: 'edit',
        action: (row) => {
          if (row._original) this.editUser(row._original);
        },
        condition: (row) => row.role !== 'root'
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) this.deleteUser(row._original);
        },
        condition: (row) => row.role !== 'root'
      }
    ];
  }

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: User | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = Math.ceil(this.users.length / this.itemsPerPage);

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  constructor(
    private api : ApiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {

  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.getUsers()
  }

  public getUsers() {
    this.api.get("users")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: res => {
          // Map backend DTO to frontend User model
          this.users = res.map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.profileName || 'USER',
            status: user.enabled ? 'active' : 'inactive',
            profileName: user.profileName,
            permissions: user.permissions || [],
            fotoUrl: user.fotoUrl
          }));
          this.filterUsers();
          this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
          this.cdr.markForCheck()
        },
        error: error => {
          console.error('Error loading users:', error);
          this.users = [];
          this.filterUsers();
          this.cdr.markForCheck();
        },
        complete: () => {
          this.filterUsers()
          this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
          this.cdr.markForCheck()
        }
      })
  }

  public createUser(user : User) {
    let newUser = {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.role,
      status: user.status == 'active' ? 1 : 0,
      cpf: user.cpf,
      telefone: user.telefone,
    };

    this.api.post("users", newUser)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: async (res: any) => {
        // Upload photo if selected after user is created
        if (this.selectedPhotoFile && res && res.id) {
          await this.uploadUserPhoto(res.id);
        }
        this.getUsers();
      },
      error: error => {
        console.error('Erro ao criar usuário:', error);
        this.notificationService.showError('Erro ao criar usuário. Verifique os dados e tente novamente.');
      },
      complete: () => this.getUsers()
    })
  }

  public updateUser(user : User) {
    let newUser = {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      roles: user.role,
      status: user.status == 'active' ? 1 : 0,
      cpf: user.cpf,
      telefone: user.telefone,
    };

    this.api.update(`users/${user.id}` , newUser)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getUsers(),
      error: error => {
        console.error('Erro ao atualizar usuário:', error);
        this.notificationService.showError('Erro ao atualizar usuário. Verifique os dados e tente novamente.');
      },
      complete: () => this.getUsers()
    })
  }

  public delete(id: number) {
    this.api.delete("users/" + id)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => this.getUsers(),
      error: error => console.error(error),
      complete: () => this.getUsers()
    })
  }

  filterUsers() {
    if (!this.users || this.users.length === 0) {
      this.filteredUsers = [];
      this.totalPages = 1;
      this.currentPage = 1;
      return;
    }
    
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = (user.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
                           (user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false) ||
                           (user.username?.toLowerCase().includes(this.searchTerm.toLowerCase()) || false);
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesRole = !this.roleFilter || user.role?.toLowerCase() === this.roleFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRole;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getRoleText(role: string): string {
    const roleMap = {
      'root': 'Super Admin',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  }

  openUserModal(user?: User) {
    this.showUserModal = true;
    this.isEditing = !!user;
    this.currentUser = user ? { ...user } : {
      name: '',
      email: '',
      phone: '',
      role: '',
      status: 'active',
      password: ''
    };
    this.photoPreview = user?.fotoUrl || null;
    this.selectedPhotoFile = null;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = {};
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

  async uploadUserPhoto(userId: number): Promise<void> {
    if (!this.selectedPhotoFile) return;

    this.uploadingPhoto = true;
    const formData = new FormData();
    formData.append('file', this.selectedPhotoFile);

    try {
      const response: any = await this.http.post(
        `${environment.apiUrl}users/${userId}/upload-foto`,
        formData,
        { withCredentials: true }
      ).toPromise();
      
      if (response && response.fotoUrl) {
        this.currentUser.fotoUrl = response.fotoUrl;
        this.photoPreview = response.fotoUrl;
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.notificationService.showError('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      this.uploadingPhoto = false;
      this.selectedPhotoFile = null;
      this.cdr.markForCheck();
    }
  }

  viewUser(user: User) {
    this.viewingUser = { ...user };
    this.showViewModal = true;
    this.cdr.markForCheck();
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingUser = null;
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
    if (!this.filteredUsers || this.filteredUsers.length === 0) {
      return [];
    }
    
    return this.filteredUsers.map(user => ({
      ...user,
      _original: user, // Manter referência ao objeto original
      foto: user.fotoUrl || null,
      status: user.status === 'active' ? 'Ativo' : 'Inativo',
      role: user.role || user.profileName || 'USER'
    }));
  }

  getRoleLabel(role: string): string {
    return this.getRoleText(role);
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Ativo' : 'Inativo';
  }

  editUser(user: User) {
    this.closeViewModal();
    this.openUserModal(user);
  }

  getViewModalButtons(): ModalButton[] {
    if (!this.viewingUser) {
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
        label: 'Editar Usuário',
        type: 'primary',
        action: () => {
          if (this.viewingUser) {
            this.editUser(this.viewingUser);
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
        action: () => this.closeUserModal()
      },
      {
        label: 'Salvar Alterações',
        type: 'primary',
        action: () => this.saveUser()
      }
    ];
  }

  async saveUser() {
    // Marcar campos como tocados para exibir erros
    if (!this.currentUser.name || !this.currentUser.email || !this.currentUser.username || 
        !this.currentUser.role || !this.currentUser.cpf || !this.currentUser.telefone) {
      this.notificationService.showWarning('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (this.isEditing) {
      const index = this.users.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) this.users[index] = { ...this.currentUser };
      this.updateUser(this.users[index]);
      
      // Upload photo if selected
      if (this.selectedPhotoFile && this.currentUser.id) {
        await this.uploadUserPhoto(this.currentUser.id);
      }
      this.closeUserModal();
    } else {
      // Validar senha para novo usuário
      if (!this.currentUser.password) {
        this.notificationService.showWarning('Por favor, informe uma senha para o novo usuário.');
        return;
      }
      
      this.createUser(this.currentUser);
      
      // Upload photo after user is created (need to get the new user ID from response)
      // This will be handled in the createUser response
      this.closeUserModal();
    }
  }

  deleteUser(user: User) {
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      this.delete(user.id)
      this.users = this.users.filter(u => u.id !== user.id);
      this.filterUsers();
    }
  }

  getPermissionsForRole(role: string): string[] {
    const permissions = {
      'root': [
        'Acesso Total',
        'Gerenciar usuários',
        'Gerenciar membros',
        'Programar Mensagens',
        'Exportar Dados',
        'Configurações do sistema',
        'Logs do sistema'
      ],
      'admin': [
        'Gerenciar usuários',
        'Gerenciar membros',
        'Programar Mensagens',
        'Exportar Dados',
        'Configurações do sistema',
        'Logs do sistema'
      ],
      'manager': [
        'Programar Mensagens',
        'Aprovar solicitações',
        'Exportar dados'
      ],
      'user': [
        'Visualizar dashboard',
        'Editar perfil'
      ]
    };
    return permissions[role as keyof typeof permissions] || [];
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
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
  }

  getItemsPerPageOptions(): number[] {
    const total = this.filteredUsers.length;
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
