import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MemberDTO {
  id?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  nascimento?: string;
  idade?: number;
  estadoCivil?: string;
  cpf?: string;
  rg?: string;
  fotoUrl?: string;
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
  estadoCivil?: boolean;
  rg?: string;
  tipoCadastro?: string;
  grupos?: string;
  rede?: string;
  operadora?: string;
  contato?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicMemberService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  /**
   * Busca um membro por CPF (endpoint público, sem autenticação)
   */
  getMemberByCpf(cpf: string): Observable<MemberDTO> {
    // Remove formatação do CPF para enviar na URL
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.http.get<MemberDTO>(
      `${this.apiUrl}public/members/cpf/${cleanCpf}`,
      { withCredentials: false } // Endpoint público, não precisa de cookies
    );
  }

  /**
   * Atualiza um membro por CPF (endpoint público, sem autenticação)
   */
  updateMemberByCpf(cpf: string, memberData: UpdateMemberDTO): Observable<MemberDTO> {
    // Remove formatação do CPF para enviar na URL
    const cleanCpf = cpf.replace(/\D/g, '');
    return this.http.put<MemberDTO>(
      `${this.apiUrl}public/members/cpf/${cleanCpf}`,
      memberData,
      { withCredentials: false } // Endpoint público, não precisa de cookies
    );
  }
}

