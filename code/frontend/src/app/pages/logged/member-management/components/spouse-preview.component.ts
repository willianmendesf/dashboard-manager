import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of, Subject, takeUntil } from 'rxjs';
import { buildProfileImageUrl } from '../../../../shared/utils/image-url-builder';

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
  templateUrl: './spouse-preview.component.html',
  styleUrl: './spouse-preview.component.scss'
})
export class SpousePreviewComponent implements OnInit, OnDestroy {
  private _cpf: string = '';
  conjugue: MemberSpouseDTO | null = null;
  isLoading = false;
  hasError = false;
  
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
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
        this.cdr.detectChanges();
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
      } else {
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[SpousePreview] Subscribe error:', err);
        this.conjugue = null;
        this.isLoading = false;
        this.hasError = true;
        this.cdr.detectChanges();
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
  
  getNormalizedPhotoUrl(fotoUrl: string | null | undefined): string {
    return buildProfileImageUrl(fotoUrl);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
