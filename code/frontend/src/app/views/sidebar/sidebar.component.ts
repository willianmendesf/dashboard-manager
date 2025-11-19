import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationIcons } from '../../shared/lib/utils/icons';
import { AuthService } from '../../shared/service/auth.service';
import { ConfigService } from '../../shared/service/config.service';
import { catchError, of } from 'rxjs';
import { buildProfileImageUrl } from '../../shared/utils/image-url-builder';

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
export class SidebarComponent implements OnInit {
  public isOpen = signal(false);
  public logoUrl = signal<string>('./img/logo.png');
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  private configService = inject(ConfigService);

  ngOnInit(): void {
    // Load logo URL from configuration
    this.configService.getLogoUrl().pipe(
      catchError(() => of(null))
    ).subscribe(url => {
      if (url && url.trim() !== '') {
        this.logoUrl.set(url);
      } else {
        this.logoUrl.set('./img/logo.png');
      }
    });
  }

  menuItems = [
    { 
      path: '/home', 
      label: 'Home', 
      icon: this.getSafeIcon(() => NavigationIcons.home({ size: 20, color: 'currentColor' })),
      exact: false,
      permission: null // No permission required
    },
    { 
      path: '/visitor-management', 
      label: 'Visitantes', 
      icon: this.getSafeIcon(() => NavigationIcons.users({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_VISITORS'
    },
    { 
      path: '/loans', 
      label: 'Empréstimos', 
      icon: this.getSafeIcon(() => NavigationIcons.book({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_MEMBERS'
    },
    { 
      path: '/whatsapp', 
      label: 'WhatsApp', 
      icon: this.getSafeIcon(() => NavigationIcons.whatsapp({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: null
    },
    { 
      path: '/group-management', 
      label: 'Grupos', 
      icon: this.getSafeIcon(() => NavigationIcons.groups({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_MEMBERS'
    },
    { 
      path: '/member-management', 
      label: 'Membros', 
      icon: this.getSafeIcon(() => NavigationIcons.members({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: null
    },
    { 
      path: '/user-management', 
      label: 'Usuários', 
      icon: this.getSafeIcon(() => NavigationIcons.users({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_USERS'
    },
    { 
      path: '/appointments', 
      label: 'Agendamentos', 
      icon: this.getSafeIcon(() => NavigationIcons.appointments({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: null
    },
    { 
      path: '/banner-management', 
      label: 'Banners', 
      icon: this.getSafeIcon(() => NavigationIcons.monitor({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_MEMBERS'
    },
    { 
      path: '/settings', 
      label: 'Configurações', 
      icon: this.getSafeIcon(() => NavigationIcons.settings({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'ACCESS_SCREEN_SETTINGS'
    }
  ];

  get filteredMenuItems() {
    return this.menuItems.filter(item => {
      if (!item.permission) {
        return true;
      }
      if (this.authService.hasPermission(item.permission)) {
        return true;
      }
      const user = this.authService.getCurrentUser();
      if (user && (user.profileName === 'ROOT' || user.profileName === 'ADMIN')) {
        return true;
      }
      return false;
    });
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get userPhotoUrl(): string {
    return buildProfileImageUrl(this.currentUser?.fotoUrl);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/avatar-default.png';
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/logo.png';
  }

  logout() {
    this.authService.logout();
  }

  getProfileIcon(): SafeHtml {
    // Ícone de perfil/usuário
    const profileSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(profileSVG);
  }

  getLogoutIcon(): SafeHtml {
    // Ícone de logout/saída
    const logoutSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(logoutSVG);
  }

  private getSafeIcon(iconFn: () => string): SafeHtml {
    const html = iconFn();
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggle() {
    this.isOpen.update(value => !value);
  }

  close() {
    this.isOpen.set(false);
  }
}