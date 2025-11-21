import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoanDTO {
  id?: number;
  bookId?: number;
  bookTitulo?: string;
  bookFotoUrl?: string;
  memberPhone?: string;
  memberNome?: string;
  memberFotoUrl?: string;
  memberCelular?: string;
  memberTelefone?: string;
  dataEmprestimo?: string | Date;
  dataDevolucao?: string | Date;
  devolvido?: boolean;
  dataDevolucaoReal?: string | Date;
  status?: string; // "ativo", "vencido", "devolvido"
}

export interface CreateLoanDTO {
  bookId: number;
  memberPhone: string; // Telefone do membro (em vez de CPF por LGPD)
}

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll(): Observable<LoanDTO[]> {
    return this.http.get<LoanDTO[]>(`${this.apiUrl}loans`);
  }

  getById(id: number): Observable<LoanDTO> {
    return this.http.get<LoanDTO>(`${this.apiUrl}loans/${id}`);
  }

  create(dto: CreateLoanDTO): Observable<LoanDTO> {
    return this.http.post<LoanDTO>(`${this.apiUrl}public/loans`, dto, { withCredentials: false })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error);
        })
      );
  }

  markAsReturned(id: number): Observable<LoanDTO> {
    return this.http.patch<LoanDTO>(`${this.apiUrl}loans/${id}/return`, {});
  }
}

