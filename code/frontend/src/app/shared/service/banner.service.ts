import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BannerType {
  IMAGE_SLIDE: 'IMAGE_SLIDE';
  VIDEO_YOUTUBE: 'VIDEO_YOUTUBE';
}

export interface BannerConfigDTO {
  id?: number;
  type: 'IMAGE_SLIDE' | 'VIDEO_YOUTUBE';
  startTime: string;
  endTime: string;
  youtubeUrl?: string;
  isActive?: boolean;
  order?: number;
  muted?: boolean;
}

export interface BannerImageDTO {
  id?: number;
  title?: string;
  imageUrl: string;
  active?: boolean;
  displayOrder?: number;
  transitionDurationSeconds?: number;
}

export interface BannerCurrentStateDTO {
  mode: 'SLIDE' | 'VIDEO';
  videoUrl?: string;
  muted?: boolean;
  images?: BannerImageDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getCurrentState(): Observable<BannerCurrentStateDTO> {
    return this.http.get<BannerCurrentStateDTO>(
      `${this.apiUrl}public/banners/current-state`,
      { withCredentials: false }
    );
  }

  getAllConfigs(): Observable<BannerConfigDTO[]> {
    return this.http.get<BannerConfigDTO[]>(`${this.apiUrl}banners/configs`);
  }

  getConfigById(id: number): Observable<BannerConfigDTO> {
    return this.http.get<BannerConfigDTO>(`${this.apiUrl}banners/configs/${id}`);
  }

  createConfig(config: BannerConfigDTO): Observable<BannerConfigDTO> {
    return this.http.post<BannerConfigDTO>(`${this.apiUrl}banners/configs`, config);
  }

  updateConfig(id: number, config: BannerConfigDTO): Observable<BannerConfigDTO> {
    return this.http.put<BannerConfigDTO>(`${this.apiUrl}banners/configs/${id}`, config);
  }

  toggleConfigActive(id: number): Observable<BannerConfigDTO> {
    return this.http.patch<BannerConfigDTO>(`${this.apiUrl}banners/configs/${id}/toggle-active`, {});
  }

  deleteConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}banners/configs/${id}`);
  }

  getAllImages(): Observable<BannerImageDTO[]> {
    return this.http.get<BannerImageDTO[]>(`${this.apiUrl}banners/images`);
  }

  getImageById(id: number): Observable<BannerImageDTO> {
    return this.http.get<BannerImageDTO>(`${this.apiUrl}banners/images/${id}`);
  }

  uploadImage(file: File, title?: string, displayOrder?: number, transitionDurationSeconds?: number): Observable<BannerImageDTO> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (displayOrder !== undefined) formData.append('displayOrder', displayOrder.toString());
    if (transitionDurationSeconds !== undefined) formData.append('transitionDurationSeconds', transitionDurationSeconds.toString());

    return this.http.post<BannerImageDTO>(
      `${this.apiUrl}banners/images`,
      formData,
      { withCredentials: true }
    );
  }

  updateImage(id: number, image: BannerImageDTO): Observable<BannerImageDTO> {
    return this.http.put<BannerImageDTO>(`${this.apiUrl}banners/images/${id}`, image);
  }

  deleteImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}banners/images/${id}`);
  }
}

