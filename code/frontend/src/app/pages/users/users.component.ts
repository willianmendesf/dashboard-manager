import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Usuários</h1>
        <p>Gerenciamento de usuários do sistema</p>
      </div>

      <div class="actions-bar">
        <div class="search-box">
          <input type="text" placeholder="Buscar usuários..." />
          <span class="search-icon">🔍</span>
        </div>
        <button class="btn-primary">+ Novo Usuário</button>
      </div>

      <div class="users-table">
        <div class="table-header">
          <div class="table-cell">Usuário</div>
          <div class="table-cell">Email</div>
          <div class="table-cell">Status</div>
          <div class="table-cell">Último Acesso</div>
          <div class="table-cell">Ações</div>
        </div>

        <div class="table-row" *ngFor="let user of users">
          <div class="table-cell user-cell">
            <div class="user-avatar">{{ user.name.charAt(0) }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-role">{{ user.role }}</div>
            </div>
          </div>
          <div class="table-cell">{{ user.email }}</div>
          <div class="table-cell">
            <span class="status-badge" [class]="user.status">
              {{ user.status === 'active' ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <div class="table-cell">{{ user.lastAccess }}</div>
          <div class="table-cell">
            <div class="action-buttons">
              <button class="btn-action edit">✏️</button>
              <button class="btn-action delete">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <div class="pagination">
        <button class="btn-pagination" disabled>← Anterior</button>
        <span class="pagination-info">Página 1 de 10</span>
        <button class="btn-pagination">Próxima →</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1200px;
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

    .search-box {
      position: relative;
      flex: 1;
      max-width: 400px;
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

    .btn-primary {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .users-table {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 24px;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1.5fr 1fr;
      gap: 16px;
      background: #F9FAFB;
      padding: 16px 24px;
      border-bottom: 1px solid #E5E7EB;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 2fr 1fr 1.5fr 1fr;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid #E5E7EB;
      transition: background 0.3s ease;
    }

    .table-row:hover {
      background: #F9FAFB;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-cell {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #374151;
    }

    .table-header .table-cell {
      font-weight: 600;
      color: #1F2937;
    }

    .user-cell {
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

    .user-role {
      font-size: 12px;
      color: #6B7280;
      margin-top: 2px;
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

    .btn-action.edit {
      background: #EEF2FF;
      color: #3730A3;
    }

    .btn-action.edit:hover {
      background: #E0E7FF;
      transform: scale(1.1);
    }

    .btn-action.delete {
      background: #FEF2F2;
      color: #B91C1C;
    }

    .btn-action.delete:hover {
      background: #FEE2E2;
      transform: scale(1.1);
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

    @media (max-width: 768px) {
      .actions-bar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .search-box {
        max-width: none;
      }
      
      .table-header,
      .table-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }
      
      .table-header {
        display: none;
      }
      
      .table-cell {
        justify-content: space-between;
        padding: 8px 0;
      }
      
      .table-cell:before {
        content: attr(data-label);
        font-weight: 600;
        color: #6B7280;
        font-size: 12px;
      }
    }
  `]
})
export class UsersComponent {
  users = [
    {
      name: 'Ana Silva',
      email: 'ana.silva@email.com',
      role: 'Administrador',
      status: 'active',
      lastAccess: '2h atrás'
    },
    {
      name: 'Carlos Santos',
      email: 'carlos.santos@email.com',
      role: 'Editor',
      status: 'active',
      lastAccess: '5h atrás'
    },
    {
      name: 'Maria Oliveira',
      email: 'maria.oliveira@email.com',
      role: 'Usuário',
      status: 'inactive',
      lastAccess: '2 dias atrás'
    },
    {
      name: 'João Costa',
      email: 'joao.costa@email.com',
      role: 'Editor',
      status: 'active',
      lastAccess: '1h atrás'
    },
    {
      name: 'Patricia Lima',
      email: 'patricia.lima@email.com',
      role: 'Usuário',
      status: 'active',
      lastAccess: '3h atrás'
    }
  ];
}