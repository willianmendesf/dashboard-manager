import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SidebarComponent } from "./views/sidebar/sidebar.component";
import { NotificationComponent } from './shared/components/notification/notification.component';
import { NavigationIcons } from './shared/lib/utils/icons';
import { AuthService } from './shared/service/auth.service';
import { filter } from 'rxjs/operators';

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
  public readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  public showSidebar = signal(true);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);
  private authService = inject(AuthService);
  
  public readonly menuIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    NavigationIcons.menu({ size: 24, color: 'white' })
  );

  ngOnInit(): void {
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
  }

  private isPublicRoute(url: string): boolean {
    const publicRoutes = ['/login', '/esqueci-senha', '/redefinir-senha', '/atualizar-cadastro'];
    return publicRoutes.some(route => url.startsWith(route));
  }

  @HostListener('window:resize')
  onResize() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth <= 768);
    }
  }
}
