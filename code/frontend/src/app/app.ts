import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarComponent } from "./views/sidebar/sidebar.component";
import { NotificationComponent } from './shared/components/notification/notification.component';
import { NavigationIcons } from './shared/lib/utils/icons';
import { AuthService } from './shared/service/auth.service';
import { ConfigService } from './shared/service/config.service';
import { filter, catchError, of } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    SidebarComponent,
    NotificationComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  public readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 999 : false);
  public showSidebar = signal(true);
  public logoUrl = signal<string>('./img/logo.png');
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private authService = inject(AuthService);
  private configService = inject(ConfigService);
  
  public readonly menuIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    NavigationIcons.menu({ size: 24, color: 'white' })
  );

  ngOnInit(): void {
    // Initialize isMobile on component init
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth <= 999);
    }

    // Hide sidebar on public pages (login, password reset) and check authentication
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const isPublicPage = this.isPublicRoute(event.url);
      const isAuthenticated = this.authService.isAuthenticated();
      this.showSidebar.set(!isPublicPage && isAuthenticated);
    });

    // Initial check
    const currentUrl = this.router.url;
    const isPublicPage = this.isPublicRoute(currentUrl);
    const isAuthenticated = this.authService.isAuthenticated();
    this.showSidebar.set(!isPublicPage && isAuthenticated);

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

    // Load and set favicon from configuration
    this.configService.getByKey('FAVICON_URL').pipe(
      catchError(() => of(null))
    ).subscribe(config => {
      const faviconUrl = config?.value || null;
      this.updateFaviconInDOM(faviconUrl);
    });
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/logo.png';
  }

  /**
   * Atualiza o favicon no DOM
   */
  private updateFaviconInDOM(faviconUrl: string | null): void {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
    existingLinks.forEach(link => link.remove());

    if (faviconUrl && faviconUrl.trim() !== '') {
      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = faviconUrl;
      document.head.appendChild(link);
    } else {
      // Restore default favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = './img/icon.png';
      document.head.appendChild(link);
    }
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/esqueci-senha', '/redefinir-senha', '/atualizar-cadastro', '/adicionar-visitantes', '/landing'];
    return publicRoutes.some(route => url.startsWith(route));
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth <= 999);
    }
  }
}
