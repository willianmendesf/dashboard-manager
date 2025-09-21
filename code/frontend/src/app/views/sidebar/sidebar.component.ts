import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl:"./sidebar.html",
  styleUrl: "./sidebar.scss"
})
export class SidebarComponent {
  menuItems = [
    {
      path: '/home',
      label: 'Home',
      icon: '🏠',
      exact: false
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📊',
      exact: true
    },
    {
      path: '/users',
      label: 'Usuários',
      icon: '👥',
      exact: true
    },
    {
      path: '/projects',
      label: 'Projetos',
      icon: '📂',
      exact: true
    },
    {
      path: '/settings',
      label: 'Configurações',
      icon: '⚙️',
      exact: true
    }
  ];
}
