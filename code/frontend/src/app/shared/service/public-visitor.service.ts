import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateVisitorDTO {
  nomeCompleto: string;
  dataVisita?: string; // ISO date string
  telefone?: string;
  jaFrequentaIgreja?: string;
  nomeIgreja?: string;
  procuraIgreja?: string;
  eDeSP?: boolean;
  estado?: string;
}

export interface VisitorDTO {
  id?: number;
  nomeCompleto: string;
  dataVisita: string;
  telefone?: string;
  jaFrequentaIgreja?: string;
  nomeIgreja?: string;
  procuraIgreja?: string;
  eDeSP?: boolean;
  estado?: string;
  fotoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicVisitorService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    // Remove barras duplicadas ao construir URL
    const baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    const path = 'public/visitors';
    this.apiUrl = baseUrl + path;
  }

  create(visitor: CreateVisitorDTO): Observable<VisitorDTO> {
    return this.http.post<VisitorDTO>(this.apiUrl, visitor);
  }
}

