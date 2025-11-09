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

  public get(uri : string) {
    return this.http.get<any>(this.apiUrl + uri, this.httpOptions);
  }

  public post(uri : string, data : any) {
    return this.http.post<any>(this.apiUrl + uri, data, this.httpOptions);
  }

  public update(uri : string, data : any) {
    return this.http.patch<any>(this.apiUrl + uri, data, this.httpOptions);
  }

  public put(uri : string, data : any) {
    return this.http.put<any>(this.apiUrl + uri, data, this.httpOptions);
  }

  public delete(uri : string) {
    return this.http.delete<any>(this.apiUrl + uri, this.httpOptions);
  }
}
