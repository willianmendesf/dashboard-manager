import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { normalizeImageUrl } from '../../utils/url-normalizer';

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo-upload.component.html',
  styleUrl: './logo-upload.component.scss'
})
export class LogoUploadComponent implements OnInit {
  @Input() currentLogoUrl: string | null = null;
  @Output() logoUploaded = new EventEmitter<string>();
  @Output() logoRemoved = new EventEmitter<void>();

  private apiUrl = environment.apiUrl;
  uploading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  get displayLogoUrl(): string {
    if (!this.currentLogoUrl) return '';
    const normalized = normalizeImageUrl(this.currentLogoUrl);
    // If normalization returned default, try to construct from apiUrl
    if (normalized === './img/avatar-default.png' && !this.currentLogoUrl.startsWith('/') && !this.currentLogoUrl.startsWith('http')) {
      return `${this.apiUrl}files/logos/${this.currentLogoUrl}`;
    }
    return normalized;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.isValidImageFile(file)) {
      this.error = 'Arquivo inválido. Apenas imagens JPEG, PNG ou GIF são permitidas.';
      return;
    }

    this.uploading = true;
    this.error = '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'logo');
    formData.append('entityId', 'empresa'); // Fixed ID for company logo
    formData.append('folder', 'logos'); // Store in logos folder

    this.http.post<{url: string}>(`${this.apiUrl}files/upload`, formData).subscribe({
      next: (response) => {
        this.logoUploaded.emit(response.url);
        this.uploading = false;
        input.value = ''; // Reset input
      },
      error: (error) => {
        console.error('Error uploading logo:', error);
        this.error = error.error?.error || 'Erro ao fazer upload do logo';
        this.uploading = false;
        input.value = ''; // Reset input
      }
    });
  }

  removeLogo(): void {
    if (confirm('Tem certeza que deseja remover o logo?')) {
      this.logoRemoved.emit();
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

