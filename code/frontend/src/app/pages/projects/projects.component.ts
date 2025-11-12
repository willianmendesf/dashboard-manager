import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, DatePipe],
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
      startDate: new Date(2024, 1, 1), // 01/02/2024
      endDate: new Date(2024, 3, 15) // 15/04/2024
    },
    {
      name: 'App Mobile',
      description: 'Aplicativo mobile para iOS e Android com funcionalidades de e-commerce e pagamentos.',
      progress: 45,
      status: 'active',
      team: ['D', 'E'],
      startDate: new Date(2024, 0, 15), // 15/01/2024
      endDate: new Date(2024, 4, 30) // 30/05/2024
    },
    {
      name: 'Website Corporativo',
      description: 'Redesign completo do website da empresa com nova identidade visual e otimizações SEO.',
      progress: 100,
      status: 'completed',
      team: ['F', 'G', 'H', 'I'],
      startDate: new Date(2023, 10, 1), // 01/11/2023
      endDate: new Date(2024, 0, 15) // 15/01/2024
    },
    {
      name: 'Sistema de CRM',
      description: 'Plataforma de gerenciamento de relacionamento com clientes integrada aos sistemas existentes.',
      progress: 30,
      status: 'paused',
      team: ['J', 'K'],
      startDate: new Date(2024, 2, 1), // 01/03/2024
      endDate: new Date(2024, 5, 30) // 30/06/2024
    },
    {
      name: 'Dashboard Analytics',
      description: 'Painel de controle com métricas em tempo real e relatórios customizáveis para a gestão.',
      progress: 60,
      status: 'active',
      team: ['L', 'M', 'N'],
      startDate: new Date(2024, 1, 15), // 15/02/2024
      endDate: new Date(2024, 3, 30) // 30/04/2024
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