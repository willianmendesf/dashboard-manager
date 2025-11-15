import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { buildFaviconImageUrl } from '../../utils/image-url-builder';

@Component({
  selector: 'app-favicon-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favicon-upload.component.html',
  styleUrl: './favicon-upload.component.scss'
})
export class FaviconUploadComponent implements OnInit {
  @Input() currentFaviconUrl: string | null = null;
  @Output() faviconUploaded = new EventEmitter<string>();
  @Output() faviconRemoved = new EventEmitter<void>();

  private apiUrl = environment.apiUrl;
  uploading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  get displayFaviconUrl(): string {
    return buildFaviconImageUrl(this.currentFaviconUrl);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.isValidImageFile(file)) {
      this.error = 'Arquivo inválido. Apenas imagens PNG, ICO ou SVG são permitidas.';
      return;
    }

    this.uploading = true;
    this.error = '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'favicon');
    formData.append('entityId', 'empresa'); // Fixed ID for company favicon
    formData.append('folder', 'favicons'); // Store in favicons folder

    this.http.post<{url: string}>(`${this.apiUrl}files/upload`, formData).subscribe({
      next: (response) => {
        this.faviconUploaded.emit(response.url);
        this.uploading = false;
        input.value = ''; // Reset input
      },
      error: (error) => {
        console.error('Error uploading favicon:', error);
        this.error = error.error?.error || 'Erro ao fazer upload do favicon';
        this.uploading = false;
        input.value = ''; // Reset input
      }
    });
  }

  removeFavicon(): void {
    if (confirm('Tem certeza que deseja remover o favicon?')) {
      this.faviconRemoved.emit();
    }
  }

  isValidImageFile(file: File): boolean {
    const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
    const validExtensions = ['.png', '.ico', '.svg'];
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || validExtensions.some(ext => fileName.endsWith(ext));
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

