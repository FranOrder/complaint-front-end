import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SupportCenter, SupportCenterResponse } from '../models/support-center.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupportCenterService {
  private readonly apiUrl = `${environment.apiUrl}/support-centers`;
  private readonly token = localStorage.getItem('auth_token');

  constructor(private http: HttpClient) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  getAllSupportCenters(): Observable<SupportCenterResponse[]> {
    return this.http.get<SupportCenterResponse[]>(this.apiUrl, { headers: this.headers });
  }

  getSupportCenterById(id: number): Observable<SupportCenterResponse> {
    return this.http.get<SupportCenterResponse>(`${this.apiUrl}/${id}`, { headers: this.headers });
  }

  createSupportCenter(supportCenter: Partial<SupportCenter>): Observable<SupportCenterResponse> {
    return this.http.post<SupportCenterResponse>(
      `${this.apiUrl}/create`,
      supportCenter,
      { headers: this.headers }
    );
  }

  updateSupportCenter(id: number, supportCenter: Partial<SupportCenter>): Observable<SupportCenterResponse> {
    return this.http.put<SupportCenterResponse>(
      `${this.apiUrl}/${id}/edit`,
      supportCenter,
      { headers: this.headers }
    );
  }

  deleteSupportCenter(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}/delete`,
      { headers: this.headers }
    );
  }
}
