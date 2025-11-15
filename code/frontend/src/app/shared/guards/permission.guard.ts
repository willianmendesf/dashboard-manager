import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Get required permission from route data
    const requiredPermission = route.data['permission'] as string;

    if (!requiredPermission) {
      // If no permission specified, just require authentication
      return true;
    }

    // Check if user has the required permission
    // getCurrentUser() now automatically loads from localStorage if needed
    if (this.authService.hasPermission(requiredPermission)) {
      return true;
    }

    // User doesn't have permission, redirect to home or show error
    this.router.navigate(['/home']);
    return false;
  }
}

