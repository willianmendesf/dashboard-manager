import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  private apiUrl = environment.apiUrl;

  public get(uri : string) {

    return this.http.get<any>(this.apiUrl + uri);
  }

  public post(uri : string, data : any) {
    return this.http.post<any>(this.apiUrl + uri, data);
  }
}
