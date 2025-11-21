import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface UserDTO {
  id: number;
  username: string;
  name: string;
  email: string;
  telefone?: string;
  enabled: boolean;
  profileId: number;
  profileName: string;
  fotoUrl?: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Upload profile photo for current user
   */
  uploadProfilePhoto(file: File): Observable<UserDTO> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UserDTO>(
      `${this.apiUrl}users/me/upload-foto`, 
      formData,
      { withCredentials: true } // CRITICAL: Send/receive session cookies
    ).pipe(
      tap(user => {
        // Update current user in AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const updatedUserData: any = {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            profileName: user.profileName,
            fotoUrl: user.fotoUrl,
            permissions: currentUser.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
      })
    );
  }

  /**
   * Get current user profile
   */
  getCurrentUserProfile(): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}users/me`);
  }
}

