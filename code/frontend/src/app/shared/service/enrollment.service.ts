import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface GroupEnrollmentDTO {
  id: number;
  memberId: number;
  memberName: string;
  memberFotoUrl?: string;
  memberCelular?: string;
  groupId: number;
  groupName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt?: string;
  processedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  processedBy?: string;
  rejectedBy?: string;
}

export interface RejectEnrollmentDTO {
  justifyRejection: boolean;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  requestEnrollment(memberId: number, groupId: number, isPublic: boolean = false): Observable<GroupEnrollmentDTO> {
    const url = `${this.apiUrl}enrollments/request?memberId=${memberId}&groupId=${groupId}`;
    if (isPublic) {
      return this.http.post<GroupEnrollmentDTO>(url, {}, { withCredentials: false });
    }
    return this.api.post(`enrollments/request?memberId=${memberId}&groupId=${groupId}`, {});
  }

  approveEnrollment(enrollmentId: number): Observable<void> {
    return this.api.post(`enrollments/${enrollmentId}/approve`, {});
  }

  rejectEnrollment(enrollmentId: number, dto: RejectEnrollmentDTO): Observable<void> {
    return this.api.post(`enrollments/${enrollmentId}/reject`, dto);
  }

  removeEnrollment(enrollmentId: number): Observable<void> {
    return this.api.delete(`enrollments/${enrollmentId}`);
  }

  getPendingEnrollments(): Observable<GroupEnrollmentDTO[]> {
    return this.api.get('enrollments/pending');
  }

  getEnrollmentHistory(): Observable<GroupEnrollmentDTO[]> {
    return this.api.get('enrollments/history');
  }

  getMemberEnrollments(memberId: number, isPublic: boolean = false): Observable<GroupEnrollmentDTO[]> {
    const url = `${this.apiUrl}enrollments/member/${memberId}`;
    if (isPublic) {
      return this.http.get<GroupEnrollmentDTO[]>(url, { withCredentials: false });
    }
    return this.api.get(`enrollments/member/${memberId}`);
  }

  getGroupMembers(groupId: number): Observable<any[]> {
    return this.api.get(`enrollments/group/${groupId}`);
  }

  canRequestAgain(memberId: number, groupId: number, isPublic: boolean = false): Observable<boolean> {
    const url = `${this.apiUrl}enrollments/can-request/${memberId}/${groupId}`;
    if (isPublic) {
      return this.http.get<boolean>(url, { withCredentials: false });
    }
    return this.api.get(`enrollments/can-request/${memberId}/${groupId}`);
  }

  createDirectApproval(memberId: number, groupId: number): Observable<GroupEnrollmentDTO> {
    return this.api.post(`enrollments/direct-approval?memberId=${memberId}&groupId=${groupId}`, {});
  }
}

