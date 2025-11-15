import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/service/api.service';
import { PrayerPerson } from '../model/prayer-person.model';
import { PrayerDistribution, PrayerDistributionRequest, PrayerDistributionResponse } from '../model/prayer-distribution.model';
import { PrayerConfig } from '../model/prayer-config.model';
import { PrayerTemplate } from '../model/prayer-template.model';
import { PrayerCycle } from '../model/prayer-cycle.model';

@Injectable({
  providedIn: 'root'
})
export class Prayer360Service {

  constructor(private api: ApiService) {}

  // PrayerPerson endpoints
  getPersons(): Observable<PrayerPerson[]> {
    return this.api.get('prayer360/persons');
  }

  getPerson(id: number): Observable<PrayerPerson> {
    return this.api.get(`prayer360/persons/${id}`);
  }

  createPerson(person: PrayerPerson): Observable<PrayerPerson> {
    return this.api.post('prayer360/persons', person);
  }

  updatePerson(id: number, person: PrayerPerson): Observable<PrayerPerson> {
    return this.api.put(`prayer360/persons/${id}`, person);
  }

  deletePerson(id: number): Observable<void> {
    return this.api.delete(`prayer360/persons/${id}`);
  }

  getIntercessors(): Observable<PrayerPerson[]> {
    return this.api.get('prayer360/persons/intercessors');
  }

  getCandidates(): Observable<PrayerPerson[]> {
    return this.api.get('prayer360/persons/candidates');
  }

  // PrayerDistribution endpoints
  generateDistribution(request: PrayerDistributionRequest): Observable<PrayerDistributionResponse> {
    return this.api.post('prayer360/distribute', request);
  }

  // PrayerTemplate endpoints
  getTemplates(): Observable<PrayerTemplate[]> {
    return this.api.get('prayer360/templates');
  }

  getTemplate(id: number): Observable<PrayerTemplate> {
    return this.api.get(`prayer360/templates/${id}`);
  }

  getDefaultTemplate(): Observable<PrayerTemplate> {
    return this.api.get('prayer360/templates/default');
  }

  createTemplate(template: PrayerTemplate): Observable<PrayerTemplate> {
    return this.api.post('prayer360/templates', template);
  }

  updateTemplate(id: number, template: PrayerTemplate): Observable<PrayerTemplate> {
    return this.api.put(`prayer360/templates/${id}`, template);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.api.delete(`prayer360/templates/${id}`);
  }

  setDefaultTemplate(id: number): Observable<void> {
    return this.api.post(`prayer360/templates/${id}/set-default`, {});
  }

  previewTemplate(id: number, variables?: Record<string, string>): Observable<string> {
    return this.api.post(`prayer360/templates/preview?id=${id}`, variables || {});
  }

  // PrayerConfig endpoints
  getConfig(): Observable<PrayerConfig> {
    return this.api.get('prayer360/config');
  }

  updateConfig(config: PrayerConfig): Observable<void> {
    return this.api.put('prayer360/config', config);
  }

  resetConfig(): Observable<void> {
    return this.api.post('prayer360/config/reset', {});
  }

  // PrayerHistory endpoints
  getHistory(startDate?: string, endDate?: string): Observable<Record<string, PrayerDistribution[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.api.get(`prayer360/history${query}`);
  }

  getCycles(intercessorId?: number): Observable<PrayerCycle[]> {
    const query = intercessorId ? `?intercessorId=${intercessorId}` : '';
    return this.api.get(`prayer360/history/cycles${query}`);
  }

  getCyclesByIntercessor(id: number): Observable<PrayerCycle[]> {
    return this.api.get(`prayer360/history/cycles/intercessor/${id}`);
  }

  clearIntercessorHistory(id: number): Observable<void> {
    return this.api.delete(`prayer360/history/intercessor/${id}`);
  }
}

