import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateVisitorDTO {
  nomeCompleto: string;
  dataVisita?: string; // ISO date string
  telefone?: string;
  jaFrequentaIgreja?: string;
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
  private apiUrl = `${environment.apiUrl}/public/visitors`;

  constructor(private http: HttpClient) {}

  create(visitor: CreateVisitorDTO): Observable<VisitorDTO> {
    return this.http.post<VisitorDTO>(this.apiUrl, visitor);
  }
}

