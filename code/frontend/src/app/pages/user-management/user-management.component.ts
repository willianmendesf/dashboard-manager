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
import { AuthService } from '../../shared/service/auth.service';

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

  // Security: Track if user is editing themselves
  isEditingSelf = false;
  loggedInUser: any = null;
  
  // Profile mapping: role name -> profileId (will be loaded from backend)
  profiles: any[] = [];

  constructor(
    private api : ApiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {

  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    this.getUsers();
    this.loadProfiles();
  }

  /**
   * Load profiles from backend to map role names to profileId
   */
  private loadProfiles() {
    this.api.get("profiles")
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (res: any) => {
          this.profiles = res || [];
        },
        error: (error) => {
          console.error('Error loading profiles:', error);
        }
      });
  }

  /**
   * Get profileId from role name
   * Maps frontend role names (admin, manager, user) to backend profile names (ADMIN, MANAGER, USER)
   */
  private getProfileIdFromRole(roleName: string): number | null {
    if (!roleName || !this.profiles || this.profiles.length === 0) {
      return null;
    }
    
    // Map frontend role names to backend profile names
    const roleMapping: { [key: string]: string } = {
      'admin': 'ADMIN',
      'manager': 'MANAGER',
      'user': 'USER',
      'root': 'ROOT'
    };
    
    const backendRoleName = roleMapping[roleName.toLowerCase()] || roleName.toUpperCase();
    const profile = this.profiles.find((p: any) => 
      p.name?.toUpperCase() === backendRoleName
    );
    return profile?.id || null;
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
            profileId: user.profileId,
            permissions: user.permissions || [],
            fotoUrl: user.fotoUrl,
            cpf: user.cpf,
            telefone: user.telefone
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
    // Map role to profileId
    const profileId = this.getProfileIdFromRole(user.role);
    if (!profileId) {
      this.notificationService.showError('Perfil inválido. Por favor, selecione uma função válida.');
      return;
    }

    let newUser: any = {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      profileId: profileId,
      enabled: user.status === 'active',
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
    let newUser: any = {
      username: user.username,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone,
    };

    // Add new password if provided
    if (user.novaSenha && user.novaSenha.trim() !== '') {
      newUser.novaSenha = user.novaSenha;
    }

    // Security: Don't send role/status if editing self (backend will also validate)
    if (!this.isEditingSelf) {
      // Map role to profileId if role is provided
      if (user.role) {
        const profileId = this.getProfileIdFromRole(user.role);
        if (profileId) {
          newUser.profileId = profileId;
        }
      }
      // Map status to enabled
      if (user.status !== undefined) {
        newUser.enabled = user.status === 'active';
      }
    }

    // Use PUT instead of PATCH for user update (backend expects PUT)
    this.api.put(`users/${user.id}`, newUser)
    .pipe(takeUntil(this.unsubscribe$))
    .subscribe({
      next: res => {
        this.notificationService.showSuccess('Usuário atualizado com sucesso!');
        
        // CRITICAL: Update user cache if the updated user is the logged-in user
        const loggedInUser = this.authService.getCurrentUser();
        if (loggedInUser && loggedInUser.id === user.id) {
          // Map backend response to LoginResponse format
          const updatedUserData: any = {
            id: res.id,
            username: res.username,
            email: res.email,
            name: res.name,
            profileName: res.profileName,
            fotoUrl: res.fotoUrl,
            permissions: res.permissions || loggedInUser.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
        
        this.getUsers();
      },
      error: error => {
        console.error('Erro ao atualizar usuário:', error);
        const errorMessage = error?.error?.error || 'Erro ao atualizar usuário. Verifique os dados e tente novamente.';
        this.notificationService.showError(errorMessage);
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
    
    // Initialize currentUser
    if (user) {
      this.currentUser = { 
        ...user,
        novaSenha: '',
        confirmarSenha: ''
      };
    } else {
      this.currentUser = {
        name: '',
        email: '',
        phone: '',
        role: '',
        status: 'active',
        password: '',
        novaSenha: '',
        confirmarSenha: '',
        cpf: '',
        telefone: '',
        fotoUrl: null
      };
    }
    
    // Get logged in user for security check
    this.loggedInUser = this.authService.getCurrentUser();
    
    // Check if user is editing themselves - CRITICAL: Compare IDs correctly
    if (user && this.loggedInUser) {
      const userId = user.id;
      const loggedUserId = this.loggedInUser.id;
      this.isEditingSelf = (userId === loggedUserId);
    } else {
      this.isEditingSelf = false;
    }
    
    // Set photo preview - ensure fotoUrl is set on currentUser
    if (user?.fotoUrl && user.fotoUrl.trim() !== '') {
      this.photoPreview = user.fotoUrl;
      this.currentUser.fotoUrl = user.fotoUrl;
    } else {
      this.photoPreview = null;
      this.currentUser.fotoUrl = null;
    }
    this.selectedPhotoFile = null;
    
    // Force change detection
    this.cdr.detectChanges();
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = {};
    this.photoPreview = null;
    this.selectedPhotoFile = null;
    this.uploadingPhoto = false;
    this.cdr.markForCheck();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.selectedPhotoFile = file;
        
        // CRITICAL: Create preview URL immediately for display
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const previewUrl = e.target?.result as string;
          this.photoPreview = previewUrl;
          // Update currentUser.fotoUrl for immediate preview
          this.currentUser.fotoUrl = previewUrl;
          this.cdr.markForCheck();
        };
        reader.readAsDataURL(file);
      } else {
        this.notificationService.showError('Por favor, selecione um arquivo de imagem válido.');
      }
    }
  }

  async uploadUserPhoto(userId: number): Promise<void> {
    if (!this.selectedPhotoFile) {
      throw new Error('Nenhum arquivo selecionado');
    }

    this.uploadingPhoto = true;
    const formData = new FormData();
    formData.append('file', this.selectedPhotoFile);

    try {
      const response: any = await this.http.post(
        `${environment.apiUrl}users/${userId}/upload-foto`,
        formData,
        { withCredentials: true }
      ).toPromise();
      
      // Get fotoUrl from response - backend returns { "fotoUrl": "...", "user": {...} }
      const fotoUrl = response?.fotoUrl || response?.user?.fotoUrl;
      
      if (!fotoUrl) {
        throw new Error('Resposta inválida do servidor: fotoUrl não encontrada');
      }
      
      // CRITICAL: Update current user in modal with the actual URL from backend
      this.currentUser.fotoUrl = fotoUrl;
      this.photoPreview = fotoUrl;
      
      // Update user in local list immediately
      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        this.users[userIndex].fotoUrl = fotoUrl;
        this.filterUsers(); // Refresh filtered list
      }
      
      // Update viewing user if it's the same user
      if (this.viewingUser && this.viewingUser.id === userId) {
        this.viewingUser.fotoUrl = fotoUrl;
      }
      
      this.cdr.detectChanges(); // Force change detection
      
      // Don't show success notification here - it will be shown after user update completes
      // Success will be shown in updateUser's callback
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Erro ao fazer upload da foto. Tente novamente.';
      this.notificationService.showError(errorMessage);
      throw error; // Re-throw to stop the save process
    } finally {
      this.uploadingPhoto = false;
      // Don't clear selectedPhotoFile here - keep it until save is complete
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

  /**
   * Get photo URL with fallback to default avatar
   */
  getPhotoUrl(): string {
    // Priority: currentUser.fotoUrl > photoPreview > default
    const fotoUrl = this.currentUser?.fotoUrl;
    if (fotoUrl && fotoUrl.trim() !== '') {
      return fotoUrl;
    }
    if (this.photoPreview && this.photoPreview.trim() !== '' && this.photoPreview !== 'img/avatar-default.png') {
      return this.photoPreview;
    }
    // Always return default if no photo exists
    return 'img/avatar-default.png';
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

    // Validate password fields if editing
    if (this.isEditing && this.currentUser.novaSenha) {
      if (this.currentUser.novaSenha !== this.currentUser.confirmarSenha) {
        this.notificationService.showError('As senhas não coincidem.');
        return;
      }
      if (this.currentUser.novaSenha.length < 6) {
        this.notificationService.showError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    if (this.isEditing) {
      const userId = this.currentUser.id;
      if (!userId) {
        this.notificationService.showError('ID do usuário não encontrado.');
        return;
      }

      // CRITICAL: Upload photo FIRST if selected, then update user data
      if (this.selectedPhotoFile) {
        try {
          // STEP 1: Upload photo first using the dedicated upload endpoint
          // This uses POST to /api/v1/users/{id}/upload-foto
          await this.uploadUserPhoto(userId);
          
          // STEP 2: After successful upload, update user data
          // fotoUrl is already updated in currentUser by uploadUserPhoto
          const userToUpdate = { ...this.currentUser };
          
          // Remove fields that shouldn't be sent
          delete userToUpdate.novaSenha;
          delete userToUpdate.confirmarSenha;
          delete userToUpdate.password; // Don't send password unless it's novaSenha
          
          if (this.isEditingSelf) {
            // Don't send role and status changes when editing self
            delete userToUpdate.role;
            delete userToUpdate.status;
          }
          
          // STEP 3: Update user data using PUT to /api/v1/users/{id}
          // This sends JSON data, NOT FormData
          this.updateUser(userToUpdate);
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Error notification already shown in uploadUserPhoto
          return; // Don't proceed with update if photo upload fails
        }
      } else {
        // No photo selected, just update user data
        const userToUpdate = { ...this.currentUser };
        
        // Remove fields that shouldn't be sent
        delete userToUpdate.novaSenha;
        delete userToUpdate.confirmarSenha;
        delete userToUpdate.password;
        
        if (this.isEditingSelf) {
          delete userToUpdate.role;
          delete userToUpdate.status;
        }
        
        // Update user data using PUT to /api/v1/users/{id}
        this.updateUser(userToUpdate);
      }
      
      // Note: Modal will be closed in updateUser's success callback
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
