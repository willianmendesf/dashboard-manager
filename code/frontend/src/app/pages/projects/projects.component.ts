import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
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