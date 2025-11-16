import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BookDTO {
  id?: number;
  titulo?: string;
  fotoUrl?: string;
  quantidadeTotal?: number;
  quantidadeDisponivel?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll(): Observable<BookDTO[]> {
    return this.http.get<BookDTO[]>(`${this.apiUrl}books`);
  }

  getById(id: number): Observable<BookDTO> {
    return this.http.get<BookDTO>(`${this.apiUrl}books/${id}`);
  }

  create(book: BookDTO): Observable<BookDTO> {
    return this.http.post<BookDTO>(`${this.apiUrl}books`, book);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}books/${id}`);
  }

  uploadPhoto(id: number, file: File): Observable<BookDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BookDTO>(`${this.apiUrl}books/${id}/upload-foto`, formData);
  }

  getAvailableBooks(): Observable<BookDTO[]> {
    return this.http.get<BookDTO[]>(`${this.apiUrl}public/loans/available-books`, { withCredentials: false });
  }
}

