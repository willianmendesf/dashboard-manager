import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GroupDTO {
  id?: number;
  nome?: string;
  descricao?: string;
  memberCount?: number;
}

export interface MemberDTO {
  id?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  comercial?: string;
  celular?: string;
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
  groupIds?: number[];
}

export interface UpdateMemberDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  comercial?: string;
  celular?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  nascimento?: string;
  idade?: number;
  estadoCivil?: boolean;
  rg?: string;
  conjugueCPF?: string;
  tipoCadastro?: string;
  grupos?: string;
  rede?: string;
  operadora?: string;
  contato?: string;
  groupIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PublicMemberService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getMemberByCpf(cpf: string): Observable<MemberDTO> {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.http.get<MemberDTO>(
      `${this.apiUrl}public/members/cpf/${cleanCpf}`,
      { withCredentials: false }
    );
  }

  updateMemberByCpf(cpf: string, memberData: UpdateMemberDTO): Observable<MemberDTO> {
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.http.put<MemberDTO>(
      `${this.apiUrl}public/members/cpf/${cleanCpf}`,
      memberData,
      { withCredentials: false }
    );
  }

  getAllGroups(): Observable<GroupDTO[]> {
    return this.http.get<GroupDTO[]>(
      `${this.apiUrl}public/members/groups`,
      { withCredentials: false }
    );
  }
}

