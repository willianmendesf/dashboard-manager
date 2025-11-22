import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface VisitorChartPreference {
  useCustomRange?: boolean;
  chartStartDate?: string | null;
  chartEndDate?: string | null;
}

export interface AttendanceChartPreference {
  useCustomRange?: boolean;
  chartStartDate?: string | null;
  chartEndDate?: string | null;
  includeVisitorsInPresence?: boolean;
  showVisitorsSeparate?: boolean;
  showAbsences?: boolean;
  showAverage?: boolean;
  defaultIntervalMonths?: number;
  periodType?: 'weeks' | 'months' | 'years';
  averagePeriodType?: 'monthly' | 'bimonthly' | 'quarterly' | 'semester' | 'annual' | 'full';
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferenceService {
  private api = inject(ApiService);

  getVisitorChartPreference(): Observable<VisitorChartPreference> {
    return this.api.get('/user-preferences/visitor-chart');
  }

  saveVisitorChartPreference(preference: VisitorChartPreference): Observable<void> {
    return this.api.post('/user-preferences/visitor-chart', preference);
  }

  deleteVisitorChartPreference(): Observable<void> {
    return this.api.delete('/user-preferences/visitor-chart');
  }

  getAttendanceChartPreference(): Observable<AttendanceChartPreference> {
    return this.api.get('/user-preferences/attendance-chart');
  }

  saveAttendanceChartPreference(preference: AttendanceChartPreference): Observable<void> {
    return this.api.post('/user-preferences/attendance-chart', preference);
  }

  deleteAttendanceChartPreference(): Observable<void> {
    return this.api.delete('/user-preferences/attendance-chart');
  }
}

