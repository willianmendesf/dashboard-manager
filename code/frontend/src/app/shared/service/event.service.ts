import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Event {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  name: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private api: ApiService) {}

  getAll(date?: string): Observable<Event[]> {
    // Sempre passa uma data (hoje se não especificada)
    const dateToUse = date || new Date().toISOString().split('T')[0];
    // apiUrl já contém /api/v1/, então passa apenas 'events'
    const url = `events?date=${dateToUse}`;
    return this.api.get(url);
  }

  create(event: Partial<Event>): Observable<Event> {
    // apiUrl já contém /api/v1/, então passa apenas 'events'
    return this.api.post('events', event);
  }
}

