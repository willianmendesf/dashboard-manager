import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginResponse } from '../../shared/service/auth.service';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ClickOutsideDirective],
  templateUrl: './user-header.component.html',
  styleUrl: './user-header.component.scss'
})
export class UserHeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  public showDropdown = signal(false);

  get currentUser(): LoginResponse | null {
    return this.authService.getCurrentUser();
  }

  get userPhotoUrl(): string {
    const user = this.currentUser;
    if (user?.fotoUrl) {
      // If fotoUrl is a relative path, prepend API URL
      if (user.fotoUrl.startsWith('/')) {
        return `${window.location.origin}${user.fotoUrl}`;
      }
      return user.fotoUrl;
    }
    return './img/avatar-default.png';
  }

  get userName(): string {
    return this.currentUser?.name || this.currentUser?.username || 'Usuário';
  }

  get userProfile(): string {
    return this.currentUser?.profileName || 'USER';
  }

  toggleDropdown(): void {
    this.showDropdown.update(value => !value);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  goToProfile(): void {
    this.router.navigate(['/meu-perfil']);
    this.closeDropdown();
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdown();
    this.router.navigate(['/login']);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/avatar-default.png';
  }
}
