import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WhatsappsService {
  constructor(private http: HttpClient) {}

  public send(data : any) {
    const localUrl = `${environment.apiUrl}/whatsapp`;
    return this.http.post<any>(localUrl, data);
  }
}
