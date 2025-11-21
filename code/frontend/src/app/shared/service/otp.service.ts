import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OtpRequestDTO {
  phone: string;
  context: string;
}

export interface OtpValidateDTO {
  phone: string;
  code: string;
  context: string;
}

export interface OtpValidateResponseDTO {
  token: string;
  phone: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OtpService {

  private apiUrl = `${environment.apiUrl}auth/otp/`;

  constructor(private http: HttpClient) { }

  /**
   * Solicita o envio de um código OTP
   */
  requestOtp(phone: string, context: string): Observable<any> {
    const request: OtpRequestDTO = {
      phone,
      context
    };
    return this.http.post(`${this.apiUrl}request`, request);
  }

  /**
   * Valida um código OTP
   */
  validateOtp(phone: string, code: string, context: string): Observable<OtpValidateResponseDTO> {
    const request: OtpValidateDTO = {
      phone,
      code,
      context
    };
    return this.http.post<OtpValidateResponseDTO>(`${this.apiUrl}validate`, request);
  }
}

