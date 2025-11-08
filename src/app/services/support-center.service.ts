import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SupportCenter, SupportCenterResponse } from '../models/support-center.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  /** 🔹 GET ALL */
  getAllSupportCenters(): Observable<SupportCenter[]> {
    return this.http.get<SupportCenterResponse[]>(this.apiUrl, { headers: this.headers }).pipe(
      map((centers: SupportCenterResponse[]) =>
        centers.map(center => this.mapFromResponse(center))
      )
    );
  }

  /** 🔹 GET BY ID */
  getSupportCenterById(id: number): Observable<SupportCenter> {
    return this.http.get<SupportCenterResponse>(`${this.apiUrl}/${id}`, { headers: this.headers }).pipe(
      map(center => this.mapFromResponse(center))
    );
  }

  /** 🔹 CREATE */
  createSupportCenter(supportCenter: Partial<SupportCenter>): Observable<SupportCenterResponse> {
    const payload = this.mapToRequest(supportCenter);
    return this.http.post<SupportCenterResponse>(`${this.apiUrl}/create`, payload, { headers: this.headers });
  }

  /** 🔹 UPDATE */
  updateSupportCenter(id: number, supportCenter: Partial<SupportCenter>): Observable<SupportCenterResponse> {
    const payload = this.mapToRequest(supportCenter);
    return this.http.put<SupportCenterResponse>(`${this.apiUrl}/${id}/edit`, payload, { headers: this.headers });
  }

  /** 🔹 DELETE */
  deleteSupportCenter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/delete`, { headers: this.headers });
  }

  /** 🧩 Mapear del backend → frontend */
  private mapFromResponse(center: SupportCenterResponse): SupportCenter {
    return {
      id: center.id,
      name: center.name,
      street: center.street,
      district: center.district,
      phone: center.phone,
      email: center.email,
      schedule: center.schedule,
      isActive: center.active ?? center.isActive ?? true, // 👈 Detecta ambos
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
      createdBy: center.createdBy
    };
  }

  /** 🧩 Mapear del frontend → backend */
  private mapToRequest(center: Partial<SupportCenter>): any {
    return {
      ...center,
      active: center.isActive ?? true // 👈 Lo transforma al formato del back
    };
  }
}
