import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Projetos</h1>
        <p>Gerencie todos os seus projetos em um só lugar</p>
      </div>

      <div class="projects-grid">
        <div class="project-card" *ngFor="let project of projects">
          <div class="project-header">
            <h3>{{ project.name }}</h3>
            <div class="project-status" [class]="project.status">
              {{ getStatusText(project.status) }}
            </div>
          </div>
          
          <p class="project-description">{{ project.description }}</p>
          
          <div class="project-progress">
            <div class="progress-info">
              <span>Progresso</span>
              <span>{{ project.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="project.progress"></div>
            </div>
          </div>

          <div class="project-team">
            <div class="team-avatars">
              <div class="avatar" *ngFor="let member of project.team">
                {{ member }}
              </div>
            </div>
            <span class="team-count">{{ project.team.length }} membros</span>
          </div>

          <div class="project-footer">
            <div class="project-dates">
              <div class="date-item">
                <span class="date-label">Início:</span>
                <span class="date-value">{{ project.startDate }}</span>
              </div>
              <div class="date-item">
                <span class="date-label">Entrega:</span>
                <span class="date-value">{{ project.endDate }}</span>
              </div>
            </div>
            <div class="project-actions">
              <button class="btn-action">Ver Detalhes</button>
            </div>
          </div>
        </div>

        <div class="project-card add-project">
          <div class="add-project-content">
            <div class="add-icon">+</div>
            <h3>Novo Projeto</h3>
            <p>Clique aqui para criar um novo projeto</p>
          </div>
        </div>
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

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .project-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }

    .project-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .project-header h3 {
      margin: 0;
      color: #1F2937;
      font-size: 20px;
      font-weight: bold;
      flex: 1;
    }

    .project-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .project-status.active {
      background: #DEF7EC;
      color: #047857;
    }

    .project-status.paused {
      background: #FEF3C7;
      color: #B45309;
    }

    .project-status.completed {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .project-description {
      color: #6B7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .project-progress {
      margin-bottom: 20px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .progress-info span:first-child {
      color: #374151;
      font-weight: 500;
    }

    .progress-info span:last-child {
      color: #6B7280;
    }

    .progress-bar {
      height: 8px;
      background: #E5E7EB;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%);
      transition: width 0.3s ease;
    }

    .project-team {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .team-avatars {
      display: flex;
      gap: -8px;
    }

    .avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      margin-left: -8px;
    }

    .avatar:first-child {
      margin-left: 0;
    }

    .team-count {
      color: #6B7280;
      font-size: 12px;
    }

    .project-footer {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .project-dates {
      display: flex;
      justify-content: space-between;
    }

    .date-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-label {
      color: #6B7280;
      font-size: 12px;
    }

    .date-value {
      color: #374151;
      font-size: 13px;
      font-weight: 500;
    }

    .project-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-action {
      background: #3B82F6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-action:hover {
      background: #2563EB;
      transform: translateY(-1px);
    }

    .add-project {
      border: 2px dashed #D1D5DB;
      background: #F9FAFB;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }

    .add-project:hover {
      border-color: #3B82F6;
      background: #F0F9FF;
    }

    .add-project-content {
      text-align: center;
    }

    .add-icon {
      font-size: 48px;
      color: #9CA3AF;
      margin-bottom: 16px;
    }

    .add-project h3 {
      color: #374151;
      margin-bottom: 8px;
    }

    .add-project p {
      color: #6B7280;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .projects-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProjectsComponent {
  projects = [
    {
      name: 'Sistema de Vendas',
      description: 'Desenvolvimento de uma plataforma completa para gerenciamento de vendas com dashboard analytics.',
      progress: 75,
      status: 'active',
      team: ['A', 'B', 'C'],
      startDate: '01/02/2024',
      endDate: '15/04/2024'
    },
    {
      name: 'App Mobile',
      description: 'Aplicativo mobile para iOS e Android com funcionalidades de e-commerce e pagamentos.',
      progress: 45,
      status: 'active',
      team: ['D', 'E'],
      startDate: '15/01/2024',
      endDate: '30/05/2024'
    },
    {
      name: 'Website Corporativo',
      description: 'Redesign completo do website da empresa com nova identidade visual e otimizações SEO.',
      progress: 100,
      status: 'completed',
      team: ['F', 'G', 'H', 'I'],
      startDate: '01/11/2023',
      endDate: '15/01/2024'
    },
    {
      name: 'Sistema de CRM',
      description: 'Plataforma de gerenciamento de relacionamento com clientes integrada aos sistemas existentes.',
      progress: 30,
      status: 'paused',
      team: ['J', 'K'],
      startDate: '01/03/2024',
      endDate: '30/06/2024'
    },
    {
      name: 'Dashboard Analytics',
      description: 'Painel de controle com métricas em tempo real e relatórios customizáveis para a gestão.',
      progress: 60,
      status: 'active',
      team: ['L', 'M', 'N'],
      startDate: '15/02/2024',
      endDate: '30/04/2024'
    }
  ];

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'Ativo',
      'paused': 'Pausado',
      'completed': 'Concluído'
    };
    return statusMap[status] || status;
  }
}