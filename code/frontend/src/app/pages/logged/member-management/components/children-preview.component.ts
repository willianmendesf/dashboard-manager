import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of, Subject, takeUntil } from 'rxjs';
import { buildProfileImageUrl } from '../../../../shared/utils/image-url-builder';

interface MemberChildDTO {
  nomeCompleto: string;
  fotoUrl?: string;
  celular?: string;
}

@Component({
  selector: 'app-children-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './children-preview.component.html',
  styleUrl: './children-preview.component.scss'
})
export class ChildrenPreviewComponent implements OnInit, OnDestroy {
  private _telefone: string = '';
  children: MemberChildDTO[] = [];
  isLoading = false;
  hasError = false;
  
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  
  @Input() 
  set telefone(value: string) {
    if (value !== this._telefone) {
      this._telefone = value;
      const cleanTelefone = value ? value.replace(/\D/g, '') : '';
      if (cleanTelefone.length >= 10) {
        this.searchChildren(cleanTelefone);
      } else {
        this.children = [];
        this.isLoading = false;
        this.hasError = false;
        this.cdr.detectChanges();
      }
    }
  }
  
  get telefone(): string {
    return this._telefone;
  }
  
  ngOnInit() {
    // Se o telefone já estiver presente na inicialização, buscar imediatamente
    if (this._telefone) {
      const cleanTelefone = this._telefone.replace(/\D/g, '');
      if (cleanTelefone.length >= 10) {
        this.searchChildren(cleanTelefone);
      } else {
        this.cdr.detectChanges();
      }
    }
  }
  
  searchChildren(telefone: string) {
    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    this.children = [];
    
    const cleanTelefone = telefone.replace(/\D/g, '');
    const url = `${environment.apiUrl}members/telefone/${cleanTelefone}/children`;
    console.log('[ChildrenPreview] Searching children for telefone:', cleanTelefone);
    
    this.http.get<MemberChildDTO[]>(url, { 
      withCredentials: true 
    })
    .pipe(
      timeout(5000),
      catchError((err) => {
        console.error('[ChildrenPreview] Error loading children:', err);
        return of([]);
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('[ChildrenPreview] Children found:', data);
          this.children = data;
          this.hasError = false;
        } else {
          console.log('[ChildrenPreview] No children found');
          this.children = [];
          this.hasError = false;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ChildrenPreview] Subscribe error:', err);
        this.children = [];
        this.isLoading = false;
        this.hasError = true;
        this.cdr.detectChanges();
      }
    });
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

