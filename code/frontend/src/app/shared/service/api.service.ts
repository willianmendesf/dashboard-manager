import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private apiUrl = environment.apiUrl;

  // Opções HTTP padrão com withCredentials para enviar/receber cookies
  private httpOptions = {
    withCredentials: true as const
  };

  /**
   * Constrói URL completa removendo barras duplicadas
   * Remove barra inicial do URI se existir e concatena corretamente
   */
  private buildUrl(uri: string): string {
    // Remove barra inicial do URI se existir
    const cleanUri = uri.startsWith('/') ? uri.substring(1) : uri;
    // Garante que apiUrl termina com / e remove barras duplicadas
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl : this.apiUrl + '/';
    return baseUrl + cleanUri;
  }

  public get(uri : string) {
    return this.http.get<any>(this.buildUrl(uri), this.httpOptions);
  }

  public post(uri : string, data : any) {
    return this.http.post<any>(this.buildUrl(uri), data, this.httpOptions);
  }

  public update(uri : string, data : any) {
    return this.http.patch<any>(this.buildUrl(uri), data, this.httpOptions);
  }

  public put(uri : string, data : any) {
    return this.http.put<any>(this.buildUrl(uri), data, this.httpOptions);
  }

  public delete(uri : string) {
    return this.http.delete<any>(this.buildUrl(uri), this.httpOptions);
  }

  public getBlob(uri: string) {
    return this.http.get(this.buildUrl(uri), { ...this.httpOptions, responseType: 'blob' });
  }

  public postFormData(uri: string, formData: FormData) {
    return this.http.post<any>(this.buildUrl(uri), formData, this.httpOptions);
  }
}
