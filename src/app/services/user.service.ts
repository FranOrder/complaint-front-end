import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  UserProfile, 
  UpdateProfileRequest, 
  UserResponse, 
  CreateUserRequest, 
  UserRole,
  UserFilters
} from '../models/user.model';

@Injectable({ providedIn: 'root' })

export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

 
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, {
      headers: this.getAuthHeaders()
    });
  }

  updatePhone(userId: number, phoneData: { phone: string }): Observable<UserProfile> {
    return this.http.patch<UserProfile>(
      `${this.apiUrl}/${userId}`,
      phoneData,
      { headers: this.getAuthHeaders() }
    );
  }

  updateProfile(userId: number, data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${userId}`, data, {
      headers: this.getAuthHeaders()
    });
  }


  getCurrentUserId(): number | null {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    return user.id || null;
  } catch {
    return null;
  }
}


  // Admin user management methods
   getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.apiUrl}`, {
      headers: this.getAuthHeaders()
    });
  }


 createUser(userData: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/admin`, userData, {
      headers: this.getAuthHeaders()
    });
  }

  updateUser(id: number, userData: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(
      `${this.apiUrl}/${id}`,
      userData,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }


  private getAuthHeaders(isFormData: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }
}
