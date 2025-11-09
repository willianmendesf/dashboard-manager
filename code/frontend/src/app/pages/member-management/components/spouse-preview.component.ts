import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface MemberSpouseDTO {
  nomeCompleto: string;
  fotoUrl?: string;
}

@Component({
  selector: 'app-spouse-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (spouse && !isLoading) {
      <div class="spouse-preview-box">
        <img 
          [src]="spouse.fotoUrl || 'img/avatar-default.png'" 
          alt="Foto do cônjuge"
          class="spouse-avatar"
          onerror="this.src='img/avatar-default.png'"
        />
        <span class="spouse-name">{{ spouse.nomeCompleto }}</span>
      </div>
    } @else if (isLoading) {
      <div class="spouse-preview-loading">Buscando...</div>
    } @else if (error) {
      <div class="spouse-preview-error">Cônjuge não encontrado</div>
    }
  `,
  styles: [`
    .spouse-preview-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .spouse-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .spouse-name {
      font-weight: 500;
      color: #333;
    }
    
    .spouse-preview-loading,
    .spouse-preview-error {
      padding: 8px;
      margin-top: 8px;
      font-size: 0.9rem;
      color: #666;
    }
    
    .spouse-preview-error {
      color: #dc3545;
    }
  `]
})
export class SpousePreviewComponent implements OnChanges {
  @Input() cpf: string = '';
  
  spouse: MemberSpouseDTO | null = null;
  isLoading = false;
  error = false;
  
  private http = inject(HttpClient);
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['cpf'] && this.cpf && this.cpf.replace(/\D/g, '').length === 11) {
      this.loadSpouse();
    } else {
      this.spouse = null;
      this.error = false;
    }
  }
  
  loadSpouse() {
    if (!this.cpf) return;
    
    this.isLoading = true;
    this.error = false;
    const cleanCpf = this.cpf.replace(/\D/g, '');
    
    this.http.get<MemberSpouseDTO>(`${environment.apiUrl}members/cpf/${cleanCpf}/spouse`, { 
      withCredentials: true 
    }).subscribe({
      next: (data) => {
        this.spouse = data;
        this.isLoading = false;
        this.error = false;
      },
      error: (err) => {
        console.error('Error loading spouse:', err);
        this.spouse = null;
        this.isLoading = false;
        this.error = true;
      }
    });
  }
}

