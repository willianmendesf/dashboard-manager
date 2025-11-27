import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BannerType {
  IMAGE_SLIDE: 'IMAGE_SLIDE';
  VIDEO_YOUTUBE: 'VIDEO_YOUTUBE';
}

export interface BannerChannelDTO {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: string;
}

export interface BannerConfigDTO {
  id?: number;
  type: 'IMAGE_SLIDE' | 'VIDEO_YOUTUBE';
  startTime: string;
  endTime: string;
  title?: string;
  youtubeUrl?: string;
  isActive?: boolean;
  order?: number;
  muted?: boolean;
  specificDate?: string;
  isRecurring?: boolean;
  channelIds?: number[];
  channelNames?: string[]; // Nomes dos canais para exibição
}

export interface BannerImageDTO {
  id?: number;
  title?: string;
  imageUrl: string;
  active?: boolean;
  displayOrder?: number;
  transitionDurationSeconds?: number;
  channelIds?: number[];
  channelNames?: string[]; // Nomes dos canais para exibição
}

export interface BannerCurrentStateDTO {
  mode: 'SLIDE' | 'VIDEO';
  videoUrl?: string;
  muted?: boolean;
  images?: BannerImageDTO[];
  channelId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getCurrentState(channelId?: number): Observable<BannerCurrentStateDTO> {
    const params = channelId ? `?channelId=${channelId}` : '';
    return this.http.get<BannerCurrentStateDTO>(
      `${this.apiUrl}public/banners/current-state${params}`,
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

  getAllImages(channelId?: number): Observable<BannerImageDTO[]> {
    const params = channelId ? `?channelId=${channelId}` : '';
    return this.http.get<BannerImageDTO[]>(`${this.apiUrl}banners/images${params}`);
  }

  getImageById(id: number): Observable<BannerImageDTO> {
    return this.http.get<BannerImageDTO>(`${this.apiUrl}banners/images/${id}`);
  }

  uploadImage(file: File, title?: string, displayOrder?: number, transitionDurationSeconds?: number, channelIds?: number[]): Observable<BannerImageDTO> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (displayOrder !== undefined) formData.append('displayOrder', displayOrder.toString());
    if (transitionDurationSeconds !== undefined) formData.append('transitionDurationSeconds', transitionDurationSeconds.toString());
    if (channelIds && channelIds.length > 0) {
      channelIds.forEach(id => formData.append('channelIds', id.toString()));
    }

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

  // Channel methods
  getAllChannels(): Observable<BannerChannelDTO[]> {
    return this.http.get<BannerChannelDTO[]>(`${this.apiUrl}banners/channels`);
  }

  getActiveChannels(): Observable<BannerChannelDTO[]> {
    return this.http.get<BannerChannelDTO[]>(
      `${this.apiUrl}banners/channels/active`,
      { withCredentials: false }
    );
  }

  getChannelById(id: number): Observable<BannerChannelDTO> {
    return this.http.get<BannerChannelDTO>(`${this.apiUrl}banners/channels/${id}`);
  }

  createChannel(channel: BannerChannelDTO): Observable<BannerChannelDTO> {
    return this.http.post<BannerChannelDTO>(`${this.apiUrl}banners/channels`, channel);
  }

  updateChannel(id: number, channel: BannerChannelDTO): Observable<BannerChannelDTO> {
    return this.http.put<BannerChannelDTO>(`${this.apiUrl}banners/channels/${id}`, channel);
  }

  toggleChannelActive(id: number): Observable<BannerChannelDTO> {
    return this.http.patch<BannerChannelDTO>(`${this.apiUrl}banners/channels/${id}/toggle-active`, {});
  }

  deleteChannel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}banners/channels/${id}`);
  }
}

