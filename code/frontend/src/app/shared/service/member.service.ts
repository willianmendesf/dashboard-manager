import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { GroupEnrollmentDTO } from './enrollment.service';

export interface MemberDTO {
  id: number;
  nome: string;
  email?: string;
  celular?: string;
  telefone?: string;
  comercial?: string;
  nascimento?: string;
  idade?: number;
  estadoCivil?: string;
  cpf?: string;
  rg?: string;
  conjugueCPF?: string;
  fotoUrl?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  groupEnrollments?: GroupEnrollmentDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private api = inject(ApiService);

  getAll(): Observable<MemberDTO[]> {
    return this.api.get('members');
  }

  getById(id: number): Observable<MemberDTO> {
    return this.api.get(`members/${id}`);
  }
}

