import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../shared/service/auth.service';
import { UserService } from '../../shared/service/user.service';
import { environment } from '../../../environments/environment';
import { PageTitleComponent } from '../../shared/modules/pagetitle/pagetitle.component';
import { ModalComponent, ModalButton } from '../../shared/modules/modal/modal.component';

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  cpf?: string;
  telefone?: string;
  profileName: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PageTitleComponent,
    ModalComponent
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  saving = false;
  uploadingPhoto = false;
  showPasswordModal = false;
  currentUser: UserProfile | null = null;
  error = '';
  successMessage = '';

  get profilePhotoUrl(): string {
    if (this.currentUser?.fotoUrl) {
      if (this.currentUser.fotoUrl.startsWith('/')) {
        return `${window.location.origin}${this.currentUser.fotoUrl}`;
      }
      return this.currentUser.fotoUrl;
    }
    return './img/avatar-default.png';
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      telefone: ['']
    });

    this.passwordForm = this.fb.group({
      senhaAtual: ['', [Validators.required]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarNovaSenha: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          name: user.name,
          telefone: user.telefone || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = 'Erro ao carregar perfil';
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    const request = {
      name: this.profileForm.get('name')?.value,
      telefone: this.profileForm.get('telefone')?.value
    };

    this.http.put<UserProfile>(`${environment.apiUrl}users/me`, request).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        // Update auth service cache with new user data
        const currentAuth = this.authService.getCurrentUser();
        if (currentAuth) {
          const updatedUserData: any = {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            name: updated.name,
            profileName: updated.profileName,
            fotoUrl: updated.fotoUrl,
            telefone: updated.telefone,
            permissions: currentAuth.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
        this.successMessage = 'Perfil atualizado com sucesso!';
        this.saving = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.error = error.error?.error || 'Erro ao atualizar perfil';
        this.saving = false;
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.isValidImageFile(file)) {
      this.error = 'Arquivo inválido. Apenas imagens JPEG, PNG ou GIF são permitidas.';
      return;
    }

    this.uploadingPhoto = true;
    this.error = '';
    this.successMessage = '';

    this.userService.uploadProfilePhoto(file).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        // Update auth service cache with new photo
        const currentAuth = this.authService.getCurrentUser();
        if (currentAuth) {
          const updatedUserData: any = {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            name: updated.name,
            profileName: updated.profileName,
            fotoUrl: updated.fotoUrl,
            permissions: currentAuth.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
        this.successMessage = 'Foto atualizada com sucesso!';
        this.uploadingPhoto = false;
        setTimeout(() => this.successMessage = '', 3000);
        input.value = ''; // Reset input
      },
      error: (error) => {
        console.error('Error uploading photo:', error);
        this.error = 'Erro ao fazer upload da foto';
        this.uploadingPhoto = false;
        input.value = ''; // Reset input
      }
    });
  }

  removePhoto(): void {
    if (!confirm('Tem certeza que deseja remover sua foto de perfil?')) {
      return;
    }

    this.http.delete<UserProfile>(`${environment.apiUrl}users/me/remove-foto`).subscribe({
      next: (updated) => {
        this.currentUser = updated;
        // Update auth service cache
        const currentAuth = this.authService.getCurrentUser();
        if (currentAuth) {
          const updatedUserData: any = {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            name: updated.name,
            profileName: updated.profileName,
            fotoUrl: undefined,
            permissions: currentAuth.permissions || []
          };
          this.authService.updateUserCache(updatedUserData);
        }
        this.successMessage = 'Foto removida com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error removing photo:', error);
        this.error = 'Erro ao remover foto';
      }
    });
  }

  openPasswordModal(): void {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.error = '';
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    const request = {
      senhaAtual: this.passwordForm.get('senhaAtual')?.value,
      novaSenha: this.passwordForm.get('novaSenha')?.value,
      confirmarNovaSenha: this.passwordForm.get('confirmarNovaSenha')?.value
    };

    this.http.put<{message: string}>(`${environment.apiUrl}users/me/alterar-senha`, request).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Senha alterada com sucesso!';
        this.saving = false;
        this.closePasswordModal();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.error = error.error?.error || 'Erro ao alterar senha';
        this.saving = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const novaSenha = form.get('novaSenha');
    const confirmarNovaSenha = form.get('confirmarNovaSenha');

    if (!novaSenha || !confirmarNovaSenha) return null;

    if (novaSenha.value !== confirmarNovaSenha.value) {
      confirmarNovaSenha.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      confirmarNovaSenha.setErrors(null);
      return null;
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = './img/avatar-default.png';
  }

  formatCPF(cpf: string): string {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  }

  getPasswordModalButtons(): ModalButton[] {
    return [
      {
        label: 'Cancelar',
        type: 'secondary',
        action: () => this.closePasswordModal()
      },
      {
        label: 'Alterar Senha',
        type: 'primary',
        action: () => this.changePassword(),
        disabled: this.saving || this.passwordForm.invalid
      }
    ];
  }
}

