import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  styleUrl: "./analytics.scss",
  templateUrl: "./analytics.html",
})

export class AnalyticsComponent {
  chartData = [65, 45, 78, 92, 57, 83, 69, 88, 76, 94, 82, 67];
  chartLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  topPages = [
    { name: '/dashboard', views: '12,847' },
    { name: '/produtos', views: '8,923' },
    { name: '/sobre', views: '5,671' },
    { name: '/contato', views: '3,249' },
    { name: '/blog', views: '2,156' }
  ];

  deviceStats = [
    { name: 'Desktop', percentage: 58 },
    { name: 'Mobile', percentage: 35 },
    { name: 'Tablet', percentage: 7 }
  ];
}
