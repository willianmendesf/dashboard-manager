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
import { NavigationIcons, ActionIcons, MessageIcons } from '../../shared/lib/utils/icons';
import { DataTableComponent, TableColumn, TableAction } from '../../shared/lib/utils/data-table.component';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthService } from '../../shared/service/auth.service';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { UtilsService } from '../../shared/services/utils.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, ModalComponent, DataTableComponent, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit, OnDestroy {
  private unsubscribe$ = new Subject<void>();
  private sanitizer = inject(DomSanitizer);
  public utilsService = inject(UtilsService);

  users: User[] = [];
  filteredUsers: User[] = [...this.users];
  tableData: any[] = []; // Dados formatados para a tabela
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';
  currentSort: { column: string; direction: 'asc' | 'desc' } | null = null;

  // Configuração da tabela
  tableColumns: TableColumn[] = [
    { key: 'foto', label: '', width: '60px', align: 'center' },
    { key: 'username', label: 'Usuário', sortable: true },
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true }
  ];

  getTableActions(): TableAction[] {
    const loggedInUser = this.authService.getCurrentUser();
    const isLoggedInRoot = loggedInUser?.profileName?.toUpperCase() === 'ROOT';
    
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
        condition: (row) => {
          const isTargetRoot = row.role?.toUpperCase() === 'ROOT' || 
                              row.profileName?.toUpperCase() === 'ROOT';
          // Allow edit if: not ROOT, or if ROOT and user is editing themselves
          if (isTargetRoot) {
            return isLoggedInRoot && loggedInUser?.id === row._original?.id;
          }
          return true; // Non-ROOT users can always be edited
        }
      },
      {
        label: 'Excluir',
        icon: 'delete',
        action: (row) => {
          if (row._original) this.deleteUser(row._original);
        },
        condition: (row) => {
          const isTargetRoot = row.role?.toUpperCase() === 'ROOT' || 
                              row.profileName?.toUpperCase() === 'ROOT';
          return !isTargetRoot; // ROOT users cannot be deleted
        }
      }
    ];
  }

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: User | null = null;

  // Paginação agora é gerenciada pelo DataTableComponent

  selectedPhotoFile: File | null = null;
  photoPreview: string | null = null;
  uploadingPhoto = false;

  // Security: Track if user is editing themselves
  isEditingSelf = false;
  isTargetRoot = false; // Indica se o usuário sendo editado é Root
  loggedInUser: any = null;
  
  // Write-once logic: Track if CPF/Telefone should be disabled
  get isCpfDisabled(): boolean {
    return this.isEditingSelf && this.currentUser?.cpf && this.currentUser.cpf.trim() !== '';
  }
  
  get isTelefoneDisabled(): boolean {
    return this.isEditingSelf && this.currentUser?.telefone && this.currentUser.telefone.trim() !== '';
  }
  
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
          this.users = res.map((user: any) => {
            // Debug: verificar se profileName está vindo do backend
            if (!user.profileName) {
              console.warn('UserDTO sem profileName:', user);
            }
            
            // Garantir que sempre tenha um profileName/role válido
            // O backend deve retornar profileName, mas se não retornar, usamos 'USER' como fallback
            const profileName = (user.profileName && user.profileName.trim() !== '') 
              ? user.profileName 
              : 'USER';
            
          // Adicionar timestamp à fotoUrl para cache busting se existir
          let fotoUrl = user.fotoUrl || null;
          if (fotoUrl && fotoUrl.trim() !== '') {
            fotoUrl = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          }
          
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: profileName, // Usar profileName como role
            status: user.enabled ? 'active' : 'inactive',
            profileName: profileName, // Sempre ter um valor
            profileId: user.profileId || null,
            permissions: user.permissions || [],
            fotoUrl: fotoUrl,
            cpf: user.cpf || null,
            telefone: user.telefone || null
          };
          });
          this.filterUsers();
          this.getTableData(); // Garantir que tableData seja atualizado
          this.cdr.markForCheck()
        },
        error: error => {
          console.error('Error loading users:', error);
          this.users = [];
          this.filterUsers();
          this.cdr.markForCheck();
        },
        complete: () => {
          this.filterUsers();
          this.cdr.markForCheck();
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
        // Handle 409 Conflict (duplicate data)
        if (error?.status === 409) {
          const errorMessage = error?.error?.message || error?.error || 'Dados duplicados. Verifique CPF, Email, Telefone ou Nome de usuário.';
          this.notificationService.showError(errorMessage);
        } else {
          const errorMessage = error?.error?.error || error?.error?.message || 'Erro ao criar usuário. Verifique os dados e tente novamente.';
          this.notificationService.showError(errorMessage);
        }
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
    // CRITICAL: Don't send role if target user is Root (Root function cannot be changed)
    if (!this.isEditingSelf && !this.isTargetRoot) {
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
    
    // WRITE-ONCE: Don't send CPF/Telefone if user is editing themselves and fields already have values
    // SECURITY: Don't send username if user is editing themselves (username cannot be changed)
    if (this.isEditingSelf) {
      // Remove username from update payload - username cannot be changed
      delete newUser.username;
      
      if (this.isCpfDisabled) {
        delete newUser.cpf;
      }
      if (this.isTelefoneDisabled) {
        delete newUser.telefone;
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
          // Adicionar timestamp à fotoUrl para cache busting
          let fotoUrl = res.fotoUrl || null;
          if (fotoUrl && fotoUrl.trim() !== '') {
            fotoUrl = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          }
          
          const updatedUserData: any = {
            id: res.id,
            username: res.username,
            email: res.email,
            name: res.name,
            profileName: res.profileName,
            fotoUrl: fotoUrl,
            permissions: res.permissions || loggedInUser.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
        
        this.getUsers();
      },
      error: error => {
        console.error('Erro ao atualizar usuário:', error);
        // Handle 403 Forbidden (e.g., trying to change Root user function)
        if (error?.status === 403) {
          const errorMessage = error?.error?.message || error?.error || 'Operação não permitida. Você não tem permissão para realizar esta ação.';
          this.notificationService.showError(errorMessage);
        } else if (error?.status === 409) {
          // Handle 409 Conflict (duplicate data)
          const errorMessage = error?.error?.message || error?.error || 'Dados duplicados. Verifique CPF, Email, Telefone ou Nome de usuário.';
          this.notificationService.showError(errorMessage);
        } else {
          const errorMessage = error?.error?.error || error?.error?.message || 'Erro ao atualizar usuário. Verifique os dados e tente novamente.';
          this.notificationService.showError(errorMessage);
        }
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
      this.getTableData(); // Atualizar tableData
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

    // Atualizar tableData após filtrar
    this.getTableData();
  }

  getRoleText(role: string): string {
    if (!role || role.trim() === '') {
      return 'Usuário';
    }
    const roleMap: { [key: string]: string } = {
      'root': 'Super Admin',
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário',
      'ROOT': 'Super Admin',
      'ADMIN': 'Administrador',
      'MANAGER': 'Gerente',
      'USER': 'Usuário'
    };
    return roleMap[role] || roleMap[role.toUpperCase()] || role;
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
    
    // Check if the user being edited is Root - CRITICAL: Root users cannot have their function changed
    if (user) {
      const userRole = user.role || user.profileName || '';
      this.isTargetRoot = userRole.toUpperCase() === 'ROOT';
    } else {
      this.isTargetRoot = false;
    }
    
    // Set photo preview - ensure fotoUrl is set on currentUser
    // Adicionar timestamp para forçar atualização (cache busting)
    if (user?.fotoUrl && user.fotoUrl.trim() !== '') {
      const fotoUrlWithTimestamp = user.fotoUrl + (user.fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      this.photoPreview = fotoUrlWithTimestamp;
      this.currentUser.fotoUrl = fotoUrlWithTimestamp;
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
    this.isEditingSelf = false;
    this.isTargetRoot = false;
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
      
      // Adicionar timestamp para forçar atualização da imagem (cache busting)
      const fotoUrlWithTimestamp = fotoUrl + (fotoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
      
      // CRITICAL: Update current user in modal with the actual URL from backend
      this.currentUser.fotoUrl = fotoUrlWithTimestamp;
      
      // Update user in local list immediately - criar nova referência do objeto
      const userIndex = this.users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        // Atualizar o objeto completo para garantir que a referência mude
        this.users[userIndex] = {
          ...this.users[userIndex],
          fotoUrl: fotoUrlWithTimestamp
        };
      }
      
      this.notificationService.showSuccess('Foto enviada com sucesso!');
      
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      // Atualizar photoPreview de forma assíncrona (igual na tela de membros)
      setTimeout(() => {
        this.photoPreview = fotoUrlWithTimestamp;
        
        // Atualizar viewingUser com nova referência se for o mesmo usuário
        if (this.viewingUser && this.viewingUser.id === userId) {
          this.viewingUser = {
            ...this.viewingUser,
            fotoUrl: fotoUrlWithTimestamp
          };
        }
        
        // Atualizar filteredUsers com a nova fotoUrl - criar nova referência do array
        const filteredIndex = this.filteredUsers.findIndex(u => u.id === userId);
        if (filteredIndex !== -1) {
          // Criar nova referência do array filteredUsers para garantir detecção de mudanças
          this.filteredUsers = this.filteredUsers.map((user, index) => {
            if (index === filteredIndex) {
              // Criar nova referência do objeto atualizado
              return {
                ...user,
                fotoUrl: fotoUrlWithTimestamp
              };
            }
            return user;
          });
        }
        
        // Forçar atualização da tabela recriando os dados (cria nova referência do array)
        this.getTableData();
        this.cdr.detectChanges(); // Usar detectChanges() em vez de markForCheck() para forçar atualização imediata
      }, 0);
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error?.error?.error || error?.error?.message || error?.message || 'Erro ao fazer upload da foto. Tente novamente.';
      this.notificationService.showError(errorMessage);
      throw error; // Re-throw to stop the save process
    } finally {
      // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => {
        this.uploadingPhoto = false;
        this.selectedPhotoFile = null;
        this.cdr.markForCheck();
      }, 0);
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
      this.tableData = [];
      return this.tableData;
    }
    
    // Criar uma nova referência do array para evitar problemas de detecção de mudanças
    const newTableData = this.filteredUsers.map(user => {
      // Garantir que sempre tenha um profileName/role válido
      const roleValue = (user.profileName && user.profileName.trim() !== '') 
        ? user.profileName 
        : ((user.role && user.role.trim() !== '') ? user.role : 'USER');
      
      return {
        ...user,
        _original: user, // Manter referência ao objeto original
        foto: user.fotoUrl || null,
        telefone: user.telefone || '-',
        status: user.status === 'active' ? 'Ativo' : 'Inativo',
        role: roleValue, // Sempre ter um valor
        profileName: roleValue // Garantir que profileName sempre tenha um valor
      };
    });
    
    // Aplicar ordenação se houver
    if (this.currentSort) {
      newTableData.sort((a, b) => {
        const column = this.currentSort!.column;
        const aValue = (a as any)[column];
        const bValue = (b as any)[column];
        
        // Tratar valores nulos ou indefinidos
        if (aValue === null || aValue === undefined || aValue === '-') return 1;
        if (bValue === null || bValue === undefined || bValue === '-') return -1;
        
        // Comparação de strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'pt-BR', { sensitivity: 'base' });
          return this.currentSort!.direction === 'asc' ? comparison : -comparison;
        }
        
        // Comparação numérica
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.currentSort!.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Fallback: converter para string e comparar
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr, 'pt-BR', { sensitivity: 'base' });
        return this.currentSort!.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    // Atribuir a nova referência
    this.tableData = newTableData;
    return this.tableData;
  }
  
  onSortChange(sort: { column: string; direction: 'asc' | 'desc' }): void {
    this.currentSort = sort;
    this.getTableData(); // Reaplica a ordenação
    this.cdr.markForCheck();
  }

  getRoleLabel(role: string | null | undefined): string {
    if (!role) {
      return 'Usuário';
    }
    return this.getRoleText(role);
  }

  getRoleForDisplay(row: any): string {
    // Método helper para garantir que sempre retorne um valor válido
    const value = row?.profileName || row?.role || 'USER';
    return value;
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Ativo' : 'Inativo';
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      MessageIcons.whatsapp({ size: 20, color: '#25D366' })
    );
  }

  editUser(user: User) {
    // SECURITY: Check if trying to edit ROOT user
    const loggedInUser = this.authService.getCurrentUser();
    const isTargetRoot = (user.role?.toUpperCase() === 'ROOT' || 
                         user.profileName?.toUpperCase() === 'ROOT');
    const isLoggedInRoot = loggedInUser?.profileName?.toUpperCase() === 'ROOT';
    
    // Block editing ROOT users unless the logged-in user is the ROOT themselves
    if (isTargetRoot) {
      if (!isLoggedInRoot || loggedInUser?.id !== user.id) {
        this.notificationService.showError('Usuários ROOT só podem ser editados por si mesmos.');
        return;
      }
    }
    
    this.closeViewModal();
    this.openUserModal(user);
  }

  getViewModalButtons(): ModalButton[] {
    const buttons: ModalButton[] = [
      {
        label: 'Fechar',
        type: 'secondary',
        action: () => this.closeViewModal()
      }
    ];

    // Add "Editar Usuário" button only if user can edit
    if (this.viewingUser) {
      const loggedInUser = this.authService.getCurrentUser();
      const isTargetRoot = (this.viewingUser.role?.toUpperCase() === 'ROOT' || 
                           this.viewingUser.profileName?.toUpperCase() === 'ROOT');
      const isLoggedInRoot = loggedInUser?.profileName?.toUpperCase() === 'ROOT';
      
      // Show edit button only if: not ROOT, or if ROOT and user is editing themselves
      const canEdit = !isTargetRoot || (isLoggedInRoot && loggedInUser?.id === this.viewingUser.id);
      
      if (canEdit) {
        buttons.push({
          label: 'Editar Usuário',
          type: 'primary',
          action: () => {
            if (this.viewingUser) {
              // Check if can edit (same security check as editUser)
              const loggedInUser = this.authService.getCurrentUser();
              const isTargetRoot = (this.viewingUser.role?.toUpperCase() === 'ROOT' || 
                                   this.viewingUser.profileName?.toUpperCase() === 'ROOT');
              const isLoggedInRoot = loggedInUser?.profileName?.toUpperCase() === 'ROOT';
              
              if (isTargetRoot && (!isLoggedInRoot || loggedInUser?.id !== this.viewingUser.id)) {
                this.notificationService.showError('Usuários ROOT só podem ser editados por si mesmos.');
                return;
              }
              
              this.editUser(this.viewingUser);
            }
          }
        });
      }
    }

    return buttons;
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
            
            // WRITE-ONCE: Don't send CPF/Telefone if they already have values (user cannot change them)
            if (this.isCpfDisabled) {
              delete userToUpdate.cpf;
            }
            if (this.isTelefoneDisabled) {
              delete userToUpdate.telefone;
            }
          }
          
          // CRITICAL: Don't send role if target user is Root (Root function cannot be changed)
          if (this.isTargetRoot) {
            delete userToUpdate.role;
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
          
          // WRITE-ONCE: Don't send CPF/Telefone if they already have values (user cannot change them)
          if (this.isCpfDisabled) {
            delete userToUpdate.cpf;
          }
          if (this.isTelefoneDisabled) {
            delete userToUpdate.telefone;
          }
        }
        
        // CRITICAL: Don't send role if target user is Root (Root function cannot be changed)
        if (this.isTargetRoot) {
          delete userToUpdate.role;
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

  // Métodos de paginação removidos - agora gerenciados pelo DataTableComponent
}
