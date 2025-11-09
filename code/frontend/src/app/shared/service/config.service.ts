import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, map } from 'rxjs';

export interface Configuration {
  id?: number;
  key: string;
  value: string;
  description?: string;
  type?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Configuration[]> {
    return this.api.get('/configurations');
  }

  getByKey(key: string): Observable<Configuration> {
    return this.api.get(`/configurations/${key}`);
  }

  updateConfiguration(key: string, value: string): Observable<Configuration> {
    return this.api.put(`/configurations/${key}`, { value });
  }

  updateConfigurations(configurations: { [key: string]: string }): Observable<{ [key: string]: string }> {
    return this.api.put('/configurations', configurations);
  }

  createConfiguration(config: Configuration): Observable<Configuration> {
    return this.api.post('/configurations', config);
  }

  // Helper methods to get specific configurations
  getLogoUrl(): Observable<string | null> {
    return this.getByKey('LOGO_URL').pipe(
      map(config => config?.value || null)
    );
  }

  getPrimaryColor(): Observable<string | null> {
    return this.getByKey('PRIMARY_COLOR').pipe(
      map(config => config?.value || null)
    );
  }

  getSecondaryColor(): Observable<string | null> {
    return this.getByKey('SECONDARY_COLOR').pipe(
      map(config => config?.value || null)
    );
  }
}

