import { Component, Input, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { of, Subject, takeUntil } from 'rxjs';
import { buildProfileImageUrl } from '../../../../shared/utils/image-url-builder';
import { UtilsService } from '../../../../shared/services/utils.service';
import { MessageIcons } from '../../../../shared/lib/utils/icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface MemberParentDTO {
  nomeCompleto: string;
  fotoUrl?: string;
  celular?: string;
}

@Component({
  selector: 'app-parent-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-preview.component.html',
  styleUrl: './parent-preview.component.scss'
})
export class ParentPreviewComponent implements OnInit, OnDestroy {
  private _telefone: string = '';
  parent: MemberParentDTO | null = null;
  isLoading = false;
  hasError = false;
  
  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private utilsService = inject(UtilsService);
  private sanitizer = inject(DomSanitizer);
  
  @Input() 
  set telefone(value: string) {
    if (value !== this._telefone) {
      this._telefone = value;
      const cleanTelefone = value ? value.replace(/\D/g, '') : '';
      if (cleanTelefone.length >= 10) {
        this.searchParent(cleanTelefone);
      } else {
        this.parent = null;
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
        this.searchParent(cleanTelefone);
      } else {
        this.cdr.detectChanges();
      }
    }
  }

  getWhatsAppLink(phone: string | null | undefined): string | null {
    return this.utilsService.getWhatsAppLink(phone);
  }

  getWhatsAppIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      MessageIcons.whatsapp({ size: 20, color: '#25D366' })
    );
  }
  
  searchParent(telefone: string) {
    if (!telefone || telefone.replace(/\D/g, '').length < 10) {
      return;
    }
    
    this.isLoading = true;
    this.hasError = false;
    this.parent = null;
    
    const cleanTelefone = telefone.replace(/\D/g, '');
    const url = `${environment.apiUrl}members/telefone/${cleanTelefone}/parent`;
    console.log('[ParentPreview] Searching parent for telefone:', cleanTelefone);
    
    this.http.get<MemberParentDTO>(url, { 
      withCredentials: true 
    })
    .pipe(
      timeout(5000),
      catchError((err) => {
        console.error('[ParentPreview] Error loading parent:', err);
        return of(null);
      }),
      takeUntil(this.destroy$)
    )
    .subscribe({
      next: (data) => {
        if (data && data.nomeCompleto) {
          console.log('[ParentPreview] Parent found:', data);
          this.parent = data;
          this.hasError = false;
        } else {
          console.warn('[ParentPreview] No parent data returned');
          this.parent = null;
          this.hasError = true;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ParentPreview] Subscribe error:', err);
        this.parent = null;
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

