import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Visitor, VisitorStats } from '../../pages/visitor-management/model/visitor.model';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  constructor(private api: ApiService) {}

  getAll(date?: string, nome?: string): Observable<Visitor[]> {
    let url = 'visitors';
    const params: string[] = [];
    if (date) params.push(`date=${date}`);
    if (nome) params.push(`nome=${encodeURIComponent(nome)}`);
    if (params.length > 0) url += '?' + params.join('&');
    return this.api.get(url);
  }

  getById(id: number): Observable<Visitor> {
    return this.api.get(`visitors/${id}`);
  }

  create(visitor: Partial<Visitor>): Observable<Visitor> {
    return this.api.post('visitors', visitor);
  }

  update(id: number, visitor: Partial<Visitor>): Observable<Visitor> {
    return this.api.put(`visitors/${id}`, visitor);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`visitors/${id}`);
  }

  getSundayStats(): Observable<VisitorStats[]> {
    return this.api.get('visitors/stats/sundays');
  }

  uploadPhoto(id: number, file: File): Observable<{ fotoUrl: string; visitor: Visitor }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData(`visitors/${id}/upload-foto`, formData);
  }

  downloadTemplate(): Observable<Blob> {
    return this.api.getBlob('visitors/import/template');
  }

  import(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postFormData('visitors/import', formData);
  }
}

