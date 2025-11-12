import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavigationIcons } from '../../shared/lib/utils/icons';
import { AuthService } from '../../shared/service/auth.service';
import { ConfigService } from '../../shared/service/config.service';
import { catchError, of } from 'rxjs';

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
      path: '/appointments', 
      label: 'Agendamentos', 
      icon: this.getSafeIcon(() => NavigationIcons.appointments({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: null
    },
    { 
      path: '/whatsapp', 
      label: 'WhatsApp', 
      icon: this.getSafeIcon(() => NavigationIcons.whatsapp({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: null
    },
    { 
      path: '/member-management', 
      label: 'Membros', 
      icon: this.getSafeIcon(() => NavigationIcons.members({ size: 20, color: 'currentColor' })),
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
      path: '/visitor-management', 
      label: 'Visitantes', 
      icon: this.getSafeIcon(() => NavigationIcons.users({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_VISITORS'
    },
    { 
      path: '/user-management', 
      label: 'Usuários', 
      icon: this.getSafeIcon(() => NavigationIcons.users({ size: 20, color: 'currentColor' })),
      exact: true,
      permission: 'READ_USERS'
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
    const user = this.currentUser;
    if (user?.fotoUrl) {
      if (user.fotoUrl.startsWith('/')) {
        return `${window.location.origin}${user.fotoUrl}`;
      }
      return user.fotoUrl;
    }
    return './img/avatar-default.png';
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