import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of, Subject, takeUntil } from 'rxjs';

interface MemberSpouseDTO {
  nomeCompleto: string;
  fotoUrl?: string;
  cpf?: string;
  celular?: string;
}

@Component({
  selector: 'app-spouse-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spouse-info-section">
      @if (isLoading) {
        <div class="loading-state">
          <p>Buscando informações do cônjuge...</p>
        </div>
      }
      
      @if (!isLoading && hasError) {
        <div class="error-state">
          <p>Não foi possível carregar as informações do cônjuge ou CPF não encontrado.</p>
        </div>
      }
      
      @if (!isLoading && !hasError && conjugue) {
        <div class="spouse-details-box">
          <img 
            [src]="conjugue.fotoUrl || 'img/avatar-default.png'" 
            alt="Foto do Cônjuge"
            class="spouse-avatar"
            onerror="this.src='img/avatar-default.png'"
          />
          <div class="spouse-text-details">
            <h3>{{ conjugue.nomeCompleto }}</h3>
            @if (conjugue.cpf) {
              <p><strong>CPF:</strong> {{ formatCpf(conjugue.cpf) }}</p>
            }
            @if (conjugue.celular) {
              <p><strong>Celular:</strong> {{ formatCelular(conjugue.celular) }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .spouse-info-section {
      width: 100%;
      margin-top: 12px;
    }
    
    .loading-state,
    .error-state {
      padding: 16px;
      text-align: center;
      border-radius: 8px;
      margin-top: 12px;
    }
    
    .loading-state {
      background: #f5f5f5;
      color: #666;
      border: 1px solid #e0e0e0;
    }
    
    .error-state {
      background: #fff5f5;
      color: #dc3545;
      border: 1px solid #fecaca;
    }
    
    .spouse-details-box {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 12px;
      border: 1px solid #e0e0e0;
      width: 100%;
      box-sizing: border-box;
    }
    
    .spouse-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 2px solid #e0e0e0;
    }
    
    .spouse-text-details {
      flex: 1;
      min-width: 0;
    }
    
    .spouse-text-details h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
    }
    
    .spouse-text-details p {
      margin: 4px 0;
      font-size: 0.9rem;
      color: #666;
    }
    
    .spouse-text-details strong {
      color: #333;
      font-weight: 600;
    }
  `]
})
export class SpousePreviewComponent implements OnInit, OnDestroy {
  private _cpf: string = '';
  conjugue: MemberSpouseDTO | null = null;
  isLoading = false;
  hasError = false;
  
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  
  @Input() 
  set cpf(value: string) {
    if (value !== this._cpf) {
      this._cpf = value;
      const cleanCpf = value ? value.replace(/\D/g, '') : '';
      if (cleanCpf.length === 11) {
        this.searchSpouse(cleanCpf);
      } else {
        this.conjugue = null;
        this.isLoading = false;
        this.hasError = false;
      }
    }
  }
  
  get cpf(): string {
    return this._cpf;
  }
  
  ngOnInit() {
    // Se o CPF já estiver presente na inicialização, buscar imediatamente
    if (this._cpf) {
      const cleanCpf = this._cpf.replace(/\D/g, '');
      if (cleanCpf.length === 11) {
        this.searchSpouse(cleanCpf);
      }
    }
  }
  
  searchSpouse(cpf: string) {
    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    this.conjugue = null;
    
    const cleanCpf = cpf.replace(/\D/g, '');
    const url = `${environment.apiUrl}members/cpf/${cleanCpf}/spouse`;
    console.log('[SpousePreview] Searching spouse for CPF:', cleanCpf);
    
    this.http.get<MemberSpouseDTO>(url, { 
      withCredentials: true 
    })
    .pipe(
      timeout(5000),
      catchError((err) => {
        console.error('[SpousePreview] Error loading spouse:', err);
        return of(null);
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data) => {
        if (data && data.nomeCompleto) {
          console.log('[SpousePreview] Spouse found:', data);
          this.conjugue = data;
          this.hasError = false;
        } else {
          console.warn('[SpousePreview] No spouse data returned');
          this.conjugue = null;
          this.hasError = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[SpousePreview] Subscribe error:', err);
        this.conjugue = null;
        this.isLoading = false;
        this.hasError = true;
      }
    });
  }
  
  formatCpf(cpf: string): string {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  }
  
  formatCelular(celular: string): string {
    if (!celular) return '';
    const clean = celular.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (clean.length === 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return celular;
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
