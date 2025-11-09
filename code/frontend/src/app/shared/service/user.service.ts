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
  cpf?: string;
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

    return this.http.post<UserDTO>(`${this.apiUrl}users/perfil/upload-foto`, formData).pipe(
      tap(user => {
        // Update current user in AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          currentUser.fotoUrl = user.fotoUrl;
          this.authService.saveUser(currentUser);
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

