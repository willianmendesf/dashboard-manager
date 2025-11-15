import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface GroupDTO {
  id?: number;
  nome: string;
  descricao?: string;
  memberCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor(private api: ApiService) {}

  getAll(): Observable<GroupDTO[]> {
    return this.api.get('groups');
  }

  getById(id: number): Observable<GroupDTO> {
    return this.api.get(`groups/${id}`);
  }

  create(group: GroupDTO): Observable<GroupDTO> {
    return this.api.post('groups', group);
  }

  update(id: number, group: GroupDTO): Observable<GroupDTO> {
    return this.api.put(`groups/${id}`, group);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`groups/${id}`);
  }
}

