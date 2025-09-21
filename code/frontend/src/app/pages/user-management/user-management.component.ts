import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Gerenciamento de Usuários</h1>
        <p>Crie, edite e gerencie usuários do sistema</p>
      </div>

      <div class="actions-bar">
        <div class="search-filters">
          <div class="search-box">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="filterUsers()"
              placeholder="Buscar usuários..."
            />
            <span class="search-icon">🔍</span>
          </div>
          <select [(ngModel)]="statusFilter" (change)="filterUsers()" class="filter-select">
            <option value="">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select [(ngModel)]="roleFilter" (change)="filterUsers()" class="filter-select">
            <option value="">Todas as Funções</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="user">Usuário</option>
          </select>
        </div>
        <button class="btn-primary" (click)="openUserModal()">
          + Novo Usuário
        </button>
      </div>

      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Função</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers" class="user-row">
              <td class="user-cell">
                <div class="user-avatar">{{ user.name.charAt(0) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ user.name }}</div>
                  <div class="user-id">ID: {{ user.id }}</div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.phone }}</td>
              <td>
                <span class="role-badge" [class]="user.role">
                  {{ getRoleText(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-badge" [class]="user.status">
                  {{ user.status === 'active' ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>{{ user.lastLogin || 'Nunca' }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-action view" (click)="viewUser(user)" title="Visualizar">
                    👁️
                  </button>
                  <button class="btn-action edit" (click)="editUser(user)" title="Editar">
                    ✏️
                  </button>
                  <button class="btn-action delete" (click)="deleteUser(user)" title="Excluir">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="filteredUsers.length === 0">
          <div class="empty-icon">👤</div>
          <h3>Nenhum usuário encontrado</h3>
          <p>Tente ajustar os filtros ou criar um novo usuário</p>
        </div>
      </div>

      <div class="pagination">
        <button class="btn-pagination" [disabled]="currentPage === 1" (click)="previousPage()">
          ← Anterior
        </button>
        <span class="pagination-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <button class="btn-pagination" [disabled]="currentPage === totalPages" (click)="nextPage()">
          Próxima →
        </button>
      </div>

      <!-- User Modal -->
      <div class="modal-overlay" *ngIf="showUserModal" (click)="closeUserModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
            <button class="btn-close" (click)="closeUserModal()">×</button>
          </div>

          <form class="modal-body" (ngSubmit)="saveUser()">
            <div class="form-grid">
              <div class="form-group">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  [(ngModel)]="currentUser.name"
                  name="name"
                  class="form-control"
                  required
                />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  [(ngModel)]="currentUser.email"
                  name="email"
                  class="form-control"
                  required
                />
              </div>

              <div class="form-group">
                <label>Telefone *</label>
                <input
                  type="tel"
                  [(ngModel)]="currentUser.phone"
                  name="phone"
                  class="form-control"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              <div class="form-group">
                <label>Função *</label>
                <select [(ngModel)]="currentUser.role" name="role" class="form-control" required>
                  <option value="">Selecione uma função</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="user">Usuário</option>
                </select>
              </div>

              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="currentUser.status" name="status" class="form-control">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div class="form-group" *ngIf="!isEditing">
                <label>Senha Temporária *</label>
                <input
                  type="password"
                  [(ngModel)]="currentUser.password"
                  name="password"
                  class="form-control"
                  placeholder="Senha será enviada por email"
                />
              </div>
            </div>

            <div class="permissions-section" *ngIf="currentUser.role">
              <h4>Permissões</h4>
              <div class="permissions-grid">
                <label class="permission-item" *ngFor="let permission of getPermissionsForRole(currentUser.role)">
                  <input type="checkbox" [checked]="true" disabled />
                  <span>{{ permission }}</span>
                </label>
              </div>
            </div>
          </form>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closeUserModal()">
              Cancelar
            </button>
            <button type="button" class="btn-primary" (click)="saveUser()">
              {{ isEditing ? 'Salvar Alterações' : 'Criar Usuário' }}
            </button>
          </div>
        </div>
      </div>

      <!-- View User Modal -->
      <div class="modal-overlay" *ngIf="showViewModal" (click)="closeViewModal()">
        <div class="modal-content view-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Detalhes do Usuário</h3>
            <button class="btn-close" (click)="closeViewModal()">×</button>
          </div>

          <div class="modal-body">
            <div class="user-profile">
              <div class="profile-avatar">{{ viewingUser?.name?.charAt(0) || '' }}</div>
              <div class="profile-info">
                <h2>{{ viewingUser?.name }}</h2>
                <p class="profile-role">{{ getRoleText(viewingUser?.role || '') }}</p>
                <span class="status-badge" [class]="viewingUser?.status">
                  {{ viewingUser?.status === 'active' ? 'Ativo' : 'Inativo' }}
                </span>
              </div>
            </div>

            <div class="details-grid">
              <div class="detail-item">
                <label>Email</label>
                <span>{{ viewingUser?.email }}</span>
              </div>
              <div class="detail-item">
                <label>Telefone</label>
                <span>{{ viewingUser?.phone }}</span>
              </div>
              <div class="detail-item">
                <label>Data de Criação</label>
                <span>{{ viewingUser?.createdAt }}</span>
              </div>
              <div class="detail-item">
                <label>Último Acesso</label>
                <span>{{ viewingUser?.lastLogin || 'Nunca acessou' }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="closeViewModal()">
              Fechar
            </button>
            <button type="button" class="btn-primary" (click)="editUser(viewingUser!)">
              Editar Usuário
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      color: #1F2937;
      font-size: 32px;
      font-weight: bold;
    }

    .page-header p {
      margin: 0;
      color: #6B7280;
      font-size: 16px;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .search-filters {
      display: flex;
      gap: 12px;
      flex: 1;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 300px;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 48px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s ease;
    }

    .search-box input:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #9CA3AF;
      font-size: 16px;
    }

    .filter-select {
      padding: 12px 16px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }

    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .users-table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table th {
      background: #F9FAFB;
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #1F2937;
      border-bottom: 1px solid #E5E7EB;
      font-size: 14px;
    }

    .users-table td {
      padding: 16px;
      border-bottom: 1px solid #E5E7EB;
      font-size: 14px;
      color: #374151;
    }

    .user-row:hover {
      background: #F9FAFB;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      color: #1F2937;
    }

    .user-id {
      font-size: 12px;
      color: #6B7280;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-badge.admin {
      background: #FEE2E2;
      color: #DC2626;
    }

    .role-badge.manager {
      background: #FEF3C7;
      color: #B45309;
    }

    .role-badge.user {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #DEF7EC;
      color: #047857;
    }

    .status-badge.inactive {
      background: #FEE2E2;
      color: #DC2626;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .btn-action.view {
      background: #F0F9FF;
      color: #0369A1;
    }

    .btn-action.edit {
      background: #EEF2FF;
      color: #3730A3;
    }

    .btn-action.delete {
      background: #FEF2F2;
      color: #B91C1C;
    }

    .btn-action:hover {
      transform: scale(1.1);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #6B7280;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }

    .btn-pagination {
      background: white;
      border: 1px solid #D1D5DB;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      color: #374151;
    }

    .btn-pagination:hover:not(:disabled) {
      background: #F3F4F6;
      border-color: #9CA3AF;
    }

    .btn-pagination:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      color: #6B7280;
      font-size: 14px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.view-modal {
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 24px 0 24px;
      border-bottom: 1px solid #E5E7EB;
      margin-bottom: 24px;
    }

    .modal-header h3 {
      margin: 0;
      color: #1F2937;
      font-size: 20px;
      font-weight: bold;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6B7280;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-body {
      padding: 0 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }

    .form-control {
      padding: 12px;
      border: 1px solid #D1D5DB;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .permissions-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #E5E7EB;
    }

    .permissions-section h4 {
      margin: 0 0 16px 0;
      color: #1F2937;
      font-size: 16px;
      font-weight: 600;
    }

    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .permission-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
      cursor: pointer;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 32px;
      padding: 24px;
      background: #F9FAFB;
      border-radius: 8px;
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 32px;
    }

    .profile-info h2 {
      margin: 0 0 8px 0;
      color: #1F2937;
      font-size: 24px;
    }

    .profile-role {
      margin: 0 0 8px 0;
      color: #6B7280;
      font-size: 16px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item label {
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .detail-item span {
      color: #1F2937;
      font-size: 14px;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 24px;
      border-top: 1px solid #E5E7EB;
      margin-top: 24px;
    }

    .btn-secondary {
      background: #F3F4F6;
      color: #374151;
      border: 1px solid #D1D5DB;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-secondary:hover {
      background: #E5E7EB;
    }

    @media (max-width: 768px) {
      .actions-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-filters {
        flex-direction: column;
      }

      .search-box {
        max-width: none;
      }

      .users-table-container {
        overflow-x: auto;
      }

      .users-table {
        min-width: 800px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .permissions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserManagementComponent {
  users: User[] = [
    {
      id: 1,
      name: 'Ana Silva',
      email: 'ana.silva@empresa.com',
      phone: '(11) 99999-1111',
      role: 'admin',
      status: 'active',
      createdAt: '15/01/2024',
      lastLogin: '2h atrás'
    },
    {
      id: 2,
      name: 'Carlos Santos',
      email: 'carlos.santos@empresa.com',
      phone: '(11) 99999-2222',
      role: 'manager',
      status: 'active',
      createdAt: '10/01/2024',
      lastLogin: '1 dia atrás'
    },
    {
      id: 3,
      name: 'Maria Oliveira',
      email: 'maria.oliveira@empresa.com',
      phone: '(11) 99999-3333',
      role: 'user',
      status: 'inactive',
      createdAt: '05/01/2024',
      lastLogin: '1 semana atrás'
    },
    {
      id: 4,
      name: 'João Costa',
      email: 'joao.costa@empresa.com',
      phone: '(11) 99999-4444',
      role: 'user',
      status: 'active',
      createdAt: '20/12/2023',
      lastLogin: '3h atrás'
    },
    {
      id: 5,
      name: 'Patricia Lima',
      email: 'patricia.lima@empresa.com',
      phone: '(11) 99999-5555',
      role: 'manager',
      status: 'active',
      createdAt: '18/12/2023',
      lastLogin: '5h atrás'
    }
  ];

  filteredUsers: User[] = [...this.users];
  searchTerm = '';
  statusFilter = '';
  roleFilter = '';

  showUserModal = false;
  showViewModal = false;
  isEditing = false;
  currentUser: any = {};
  viewingUser: User | null = null;

  currentPage = 1;
  itemsPerPage = 10;
  totalPages = Math.ceil(this.users.length / this.itemsPerPage);

  ngOnInit() {
    this.filterUsers();
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter || user.status === this.statusFilter;
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  getRoleText(role: string): string {
    const roleMap = {
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
  }

  closeUserModal() {
    this.showUserModal = false;
    this.currentUser = {};
  }

  viewUser(user: User) {
    this.viewingUser = user;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewingUser = null;
  }

  editUser(user: User) {
    this.closeViewModal();
    this.openUserModal(user);
  }

  saveUser() {
    if (this.isEditing) {
      const index = this.users.findIndex(u => u.id === this.currentUser.id);
      if (index !== -1) {
        this.users[index] = { ...this.currentUser };
      }
    } else {
      const newUser: User = {
        ...this.currentUser,
        id: Math.max(...this.users.map(u => u.id)) + 1,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      this.users.push(newUser);
    }

    this.filterUsers();
    this.closeUserModal();
  }

  deleteUser(user: User) {
    if (confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      this.users = this.users.filter(u => u.id !== user.id);
      this.filterUsers();
    }
  }

  getPermissionsForRole(role: string): string[] {
    const permissions = {
      'admin': [
        'Gerenciar usuários',
        'Configurações do sistema',
        'Relatórios avançados',
        'Backup e restauração',
        'Logs do sistema'
      ],
      'manager': [
        'Visualizar relatórios',
        'Gerenciar projetos',
        'Aprovar solicitações',
        'Exportar dados'
      ],
      'user': [
        'Visualizar dashboard',
        'Criar projetos',
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
}
