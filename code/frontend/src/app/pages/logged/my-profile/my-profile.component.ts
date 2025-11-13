import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../shared/service/auth.service';
import { UserService } from '../../../shared/service/user.service';
import { environment } from '../../../../environments/environment';
import { PageTitleComponent } from '../../../shared/modules/pagetitle/pagetitle.component';
import { Observable, catchError, of, tap } from 'rxjs';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { buildProfileImageUrl } from '../../../shared/utils/image-url-builder';

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
    NgxMaskDirective
  ],
  providers: [provideNgxMask()],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  profileForm!: FormGroup;
  saving = false;
  uploadingPhoto = false;
  error = '';
  successMessage = '';
  
  // Observable para o perfil do usuário
  profileData$!: Observable<UserProfile | null>;
  currentUserData: UserProfile | null = null;

  getProfilePhotoUrl(user: UserProfile | null): string {
    return buildProfileImageUrl(user?.fotoUrl);
  }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      telefone: [''],
      senhaAtual: [''],
      novaSenha: [''],
      confirmarNovaSenha: ['']
    }, { validators: [this.passwordMatchValidator, this.passwordChangeValidator] });

    // Carregar perfil usando Observable com async pipe
    this.profileData$ = this.userService.getCurrentUserProfile().pipe(
      tap((user) => {
        // Armazenar dados do usuário atual
        this.currentUserData = user;
        // Popular formulário quando os dados chegarem
        this.profileForm.patchValue({
          name: user.name,
          telefone: user.telefone || '',
          senhaAtual: '',
          novaSenha: '',
          confirmarNovaSenha: ''
        });
        // Desabilitar campo telefone se já tiver valor no banco
        if (user.telefone) {
          this.profileForm.get('telefone')?.disable();
        } else {
          this.profileForm.get('telefone')?.enable();
        }
      }),
      catchError((error) => {
        console.error('Error loading profile:', error);
        this.error = 'Erro ao carregar perfil';
        return of(null);
      })
    );
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    const senhaAtual = this.profileForm.get('senhaAtual')?.value?.trim() || '';
    const novaSenha = this.profileForm.get('novaSenha')?.value?.trim() || '';
    const confirmarNovaSenha = this.profileForm.get('confirmarNovaSenha')?.value?.trim() || '';

    // Se alguma senha foi preenchida, todas devem ser preenchidas
    const isChangingPassword = senhaAtual || novaSenha || confirmarNovaSenha;
    
    if (isChangingPassword) {
      if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        this.error = 'Para alterar a senha, preencha todos os campos de senha';
        this.saving = false;
        this.profileForm.get('senhaAtual')?.markAsTouched();
        this.profileForm.get('novaSenha')?.markAsTouched();
        this.profileForm.get('confirmarNovaSenha')?.markAsTouched();
        return;
      }
    }

    // Primeiro atualiza o perfil
    // Telefone só é enviado se não existir (write once)
    const profileRequest: any = {
      name: this.profileForm.get('name')?.value
    };
    
    // Só envia telefone se ainda não estiver preenchido no perfil
    const telefoneValue = this.profileForm.get('telefone')?.value?.trim();
    if (this.currentUserData && !this.currentUserData.telefone && telefoneValue) {
      profileRequest.telefone = telefoneValue;
    }

    this.http.put<UserProfile>(`${environment.apiUrl}users/me`, profileRequest).subscribe({
      next: (updated) => {
        // Se houver alteração de senha, fazer em segundo request
        if (isChangingPassword) {
          const passwordRequest = {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha,
            confirmarNovaSenha: confirmarNovaSenha
          };

          this.http.put<{message: string}>(`${environment.apiUrl}users/me/alterar-senha`, passwordRequest).subscribe({
            next: (response) => {
              // Update auth service cache
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
              this.currentUserData = updated;
              this.profileData$ = of(updated);
              this.successMessage = 'Perfil e senha atualizados com sucesso!';
              this.saving = false;
              // Limpar campos de senha e atualizar telefone no formulário
              this.profileForm.patchValue({
                telefone: updated.telefone || '',
                senhaAtual: '',
                novaSenha: '',
                confirmarNovaSenha: ''
              });
              // Desabilitar campo telefone se agora tem valor
              if (updated.telefone) {
                this.profileForm.get('telefone')?.disable();
              }
              setTimeout(() => this.successMessage = '', 3000);
            },
            error: (error) => {
              console.error('Error changing password:', error);
              this.error = error.error?.error || 'Erro ao alterar senha';
              this.saving = false;
            }
          });
        } else {
          // Update auth service cache
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
          this.currentUserData = updated;
          this.profileData$ = of(updated);
          this.successMessage = 'Perfil atualizado com sucesso!';
          this.saving = false;
          // Atualizar telefone no formulário e desabilitar se agora tem valor
          this.profileForm.patchValue({
            telefone: updated.telefone || ''
          });
          if (updated.telefone) {
            this.profileForm.get('telefone')?.disable();
          }
          setTimeout(() => this.successMessage = '', 3000);
        }
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
        // Recarregar o perfil para atualizar o Observable
        this.currentUserData = updated;
        this.profileData$ = of(updated);
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
        // Recarregar o perfil para atualizar o Observable
        this.currentUserData = updated;
        this.profileData$ = of(updated);
        this.successMessage = 'Foto removida com sucesso!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error removing photo:', error);
        this.error = 'Erro ao remover foto';
      }
    });
  }


  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const novaSenha = form.get('novaSenha');
    const confirmarNovaSenha = form.get('confirmarNovaSenha');

    if (!novaSenha || !confirmarNovaSenha) return null;

    const novaSenhaValue = novaSenha.value?.trim() || '';
    const confirmarNovaSenhaValue = confirmarNovaSenha.value?.trim() || '';

    // Só valida se ambos os campos tiverem valor
    if (novaSenhaValue && confirmarNovaSenhaValue) {
      if (novaSenhaValue !== confirmarNovaSenhaValue) {
        confirmarNovaSenha.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        if (confirmarNovaSenha.hasError('passwordMismatch')) {
          confirmarNovaSenha.setErrors(null);
        }
      }
    }
    return null;
  }

  passwordChangeValidator(form: FormGroup): { [key: string]: boolean } | null {
    const senhaAtual = form.get('senhaAtual');
    const novaSenha = form.get('novaSenha');
    const confirmarNovaSenha = form.get('confirmarNovaSenha');

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) return null;

    const senhaAtualValue = senhaAtual.value?.trim() || '';
    const novaSenhaValue = novaSenha.value?.trim() || '';
    const confirmarNovaSenhaValue = confirmarNovaSenha.value?.trim() || '';

    // Se algum campo de senha foi preenchido, todos devem ser preenchidos
    if (senhaAtualValue || novaSenhaValue || confirmarNovaSenhaValue) {
      if (!senhaAtualValue || !novaSenhaValue || !confirmarNovaSenhaValue) {
        // Limpa erros anteriores e define novos
        if (!senhaAtualValue) {
          const currentErrors = senhaAtual.errors || {};
          senhaAtual.setErrors({ ...currentErrors, passwordRequired: true });
        } else {
          const currentErrors = senhaAtual.errors || {};
          if (currentErrors['passwordRequired']) {
            delete currentErrors['passwordRequired'];
            senhaAtual.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
          }
        }

        if (!novaSenhaValue) {
          const currentErrors = novaSenha.errors || {};
          novaSenha.setErrors({ ...currentErrors, passwordRequired: true });
        } else {
          const currentErrors = novaSenha.errors || {};
          if (currentErrors['passwordRequired']) {
            delete currentErrors['passwordRequired'];
            novaSenha.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
          }
        }

        if (!confirmarNovaSenhaValue) {
          const currentErrors = confirmarNovaSenha.errors || {};
          confirmarNovaSenha.setErrors({ ...currentErrors, passwordRequired: true });
        } else {
          const currentErrors = confirmarNovaSenha.errors || {};
          if (currentErrors['passwordRequired']) {
            delete currentErrors['passwordRequired'];
            confirmarNovaSenha.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
          }
        }
        return { passwordIncomplete: true };
      } else {
        // Se todos estão preenchidos, remove erros passwordRequired
        const senhaAtualErrors = senhaAtual.errors || {};
        if (senhaAtualErrors['passwordRequired']) {
          delete senhaAtualErrors['passwordRequired'];
          senhaAtual.setErrors(Object.keys(senhaAtualErrors).length > 0 ? senhaAtualErrors : null);
        }

        const novaSenhaErrors = novaSenha.errors || {};
        if (novaSenhaErrors['passwordRequired']) {
          delete novaSenhaErrors['passwordRequired'];
          novaSenha.setErrors(Object.keys(novaSenhaErrors).length > 0 ? novaSenhaErrors : null);
        }

        const confirmarNovaSenhaErrors = confirmarNovaSenha.errors || {};
        if (confirmarNovaSenhaErrors['passwordRequired']) {
          delete confirmarNovaSenhaErrors['passwordRequired'];
          confirmarNovaSenha.setErrors(Object.keys(confirmarNovaSenhaErrors).length > 0 ? confirmarNovaSenhaErrors : null);
        }
      }
    } else {
      // Se todos os campos estão vazios, remove todos os erros relacionados a senha
      const senhaAtualErrors = senhaAtual.errors || {};
      if (senhaAtualErrors['passwordRequired']) {
        delete senhaAtualErrors['passwordRequired'];
        senhaAtual.setErrors(Object.keys(senhaAtualErrors).length > 0 ? senhaAtualErrors : null);
      }

      const novaSenhaErrors = novaSenha.errors || {};
      if (novaSenhaErrors['passwordRequired']) {
        delete novaSenhaErrors['passwordRequired'];
        novaSenha.setErrors(Object.keys(novaSenhaErrors).length > 0 ? novaSenhaErrors : null);
      }

      const confirmarNovaSenhaErrors = confirmarNovaSenha.errors || {};
      if (confirmarNovaSenhaErrors['passwordRequired']) {
        delete confirmarNovaSenhaErrors['passwordRequired'];
        confirmarNovaSenha.setErrors(Object.keys(confirmarNovaSenhaErrors).length > 0 ? confirmarNovaSenhaErrors : null);
      }
    }

    // Validação de tamanho mínimo da nova senha
    if (novaSenhaValue && novaSenhaValue.length > 0 && novaSenhaValue.length < 6) {
      const existingErrors = novaSenha.errors || {};
      novaSenha.setErrors({ ...existingErrors, minlength: { requiredLength: 6, actualLength: novaSenhaValue.length } });
      return { minlength: true };
    } else if (novaSenhaValue && novaSenhaValue.length >= 6) {
      // Remove erro de minlength se a senha for válida
      const existingErrors = novaSenha.errors || {};
      if (existingErrors['minlength']) {
        delete existingErrors['minlength'];
        novaSenha.setErrors(Object.keys(existingErrors).length > 0 ? existingErrors : null);
      }
    }

    return null;
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

}

