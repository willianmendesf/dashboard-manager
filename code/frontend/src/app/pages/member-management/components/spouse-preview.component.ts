import { Component, Input, OnChanges, SimpleChanges, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
    } @else if (isLoading && hasValidCpf()) {
      <div class="spouse-preview-loading">Buscando...</div>
    } @else if (error && hasValidCpf()) {
      <div class="spouse-preview-error">Cônjuge não encontrado</div>
    }
  `,
  styles: [`
    .spouse-preview-box {
      display: flex;
      align-items: center;
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
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .spouse-name {
      font-weight: 600;
      color: #333;
      font-size: 1rem;
      flex: 1;
    }
    
    .spouse-preview-loading,
    .spouse-preview-error {
      padding: 12px;
      margin-top: 12px;
      font-size: 0.9rem;
      color: #666;
      width: 100%;
      text-align: center;
      background: #f5f5f5;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .spouse-preview-error {
      color: #dc3545;
      background: #fff5f5;
      border-color: #fecaca;
    }
  `]
})
export class SpousePreviewComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() cpf: string = '';
  
  spouse: MemberSpouseDTO | null = null;
  isLoading = false;
  error = false;
  private hasLoaded = false;
  
  private http = inject(HttpClient);
  
  ngOnInit() {
    // Não fazer nada aqui - aguardar ngOnChanges ou ngAfterViewInit
  }
  
  ngAfterViewInit() {
    // Garantir que carregue após a view estar inicializada
    // Usar setTimeout para garantir que o @Input já foi definido
    setTimeout(() => {
      if (!this.hasLoaded && this.hasValidCpf()) {
        this.checkAndLoad();
      }
    }, 200);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (changes['cpf']) {
      const previousValue = changes['cpf'].previousValue;
      const currentValue = changes['cpf'].currentValue;
      
      // Reset flag quando CPF muda
      if (previousValue !== currentValue) {
        this.hasLoaded = false;
      }
      
      // Carregar se CPF válido
      if (this.hasValidCpf()) {
        this.checkAndLoad();
      } else {
        // Limpar estado se CPF inválido
        this.spouse = null;
        this.error = false;
        this.isLoading = false;
      }
    } else if (!this.hasLoaded && this.hasValidCpf()) {
      // Se não houve mudança mas CPF é válido, tentar carregar
      this.checkAndLoad();
    }
  }
  
  hasValidCpf(): boolean {
    if (!this.cpf) return false;
    const cleanCpf = this.cpf.replace(/\D/g, '');
    return cleanCpf.length === 11;
  }
  
  private checkAndLoad() {
    if (this.hasLoaded) return; // Evitar carregamentos duplicados
    
    if (this.hasValidCpf()) {
      this.hasLoaded = true;
      this.loadSpouse();
    } else {
      this.spouse = null;
      this.error = false;
      this.isLoading = false;
    }
  }
  
  loadSpouse() {
    if (!this.hasValidCpf()) {
      this.isLoading = false;
      return;
    }
    
    const cleanCpf = this.cpf.replace(/\D/g, '');
    this.isLoading = true;
    this.error = false;
    this.spouse = null; // Limpar dados anteriores
    
    const url = `${environment.apiUrl}members/cpf/${cleanCpf}/spouse`;
    console.log('Loading spouse from:', url, 'CPF:', cleanCpf);
    
    this.http.get<MemberSpouseDTO>(url, { 
      withCredentials: true 
    })
    .pipe(
      timeout(10000), // 10 segundos de timeout
      catchError((err) => {
        console.error('Error loading spouse:', err);
        console.error('URL attempted:', url);
        return of(null); // Retornar null em caso de erro
      })
    )
    .subscribe({
      next: (data) => {
        if (data) {
          console.log('Spouse loaded successfully:', data);
          this.spouse = data;
          this.isLoading = false;
          this.error = false;
        } else {
          console.warn('No spouse data returned');
          this.spouse = null;
          this.isLoading = false;
          this.error = true;
        }
      }
    });
  }
}

