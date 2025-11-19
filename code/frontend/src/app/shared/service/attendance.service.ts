import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MemberAttendance {
  member: any;
  isPresent: boolean;
}

export interface AttendanceStats {
  dailyCounts: Array<{ date: string; count: number }>;
  periodAverage: number;
}

export interface AttendanceReport {
  member: any;
  totalEvents: number;
  presenceCount: number;
  absenceCount: number;
  presencePercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private api: ApiService) {}

  toggleAttendance(memberId: number, eventId: number): Observable<{ isPresent: boolean }> {
    // apiUrl já contém /api/v1/, então passa apenas 'attendance/toggle'
    return this.api.post('attendance/toggle', { memberId, eventId });
  }

  getMembersByEvent(eventId: number): Observable<MemberAttendance[]> {
    // apiUrl já contém /api/v1/, então passa apenas 'attendance/event/...'
    return this.api.get(`attendance/event/${eventId}/members`);
  }

  getStats(startDate: string, endDate: string): Observable<AttendanceStats> {
    // apiUrl já contém /api/v1/, então passa apenas 'attendance/stats'
    return this.api.get(`attendance/stats?startDate=${startDate}&endDate=${endDate}`);
  }

  getReport(
    startDate: string,
    endDate: string,
    minPresence?: number,
    maxPresence?: number,
    minAbsence?: number,
    maxAbsence?: number
  ): Observable<AttendanceReport[]> {
    // apiUrl já contém /api/v1/, então passa apenas 'attendance/report'
    let url = `attendance/report?startDate=${startDate}&endDate=${endDate}`;
    if (minPresence !== undefined) url += `&minPresence=${minPresence}`;
    if (maxPresence !== undefined) url += `&maxPresence=${maxPresence}`;
    if (minAbsence !== undefined) url += `&minAbsence=${minAbsence}`;
    if (maxAbsence !== undefined) url += `&maxAbsence=${maxAbsence}`;
    return this.api.get(url);
  }
}

