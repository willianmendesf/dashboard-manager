import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl:"./sidebar.html",
  styleUrl: "./sidebar.scss"
})
export class SidebarComponent {
  menuItems = [
    { path: '/home', label: 'Home', icon: '🏠', exact: false },
    //{ path: '/projects', label: 'Projetos', icon: '📂', exact: true },
    { path: '/appointments', label: 'Agendamentos', icon: '💬', exact: true },
    { path: '/whatsapp', label: 'WhatsApp', icon: '💬', exact: true },
    { path: '/member-management', label: 'Membros', icon: '👤', exact: true },
    { path: '/user-management', label: 'Usuários', icon: '👤', exact: true },
    { path: '/settings', label: 'Configurações', icon: '⚙️', exact: true }
  ];
}

// { path: '/analytics', label: 'Analytics', icon: '📊', exact: true },
// { path: '/messages', label: 'Mensagens', icon: '📨', exact: true },
