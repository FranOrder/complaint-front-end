import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  UserProfile, 
  UpdateProfileRequest, 
  UserResponse, 
  CreateUserRequest, 
 
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

  updateUserProfile(userId: number, profileData: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(
      `${this.apiUrl}/${userId}`,
      profileData,
      { headers: this.getAuthHeaders() }
    );
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


  createAdmin(adminData: Omit<CreateUserRequest, 'role'>): Observable<UserResponse> {
    // Set role to ADMIN by default
    const adminRequest: CreateUserRequest = {
      ...adminData,
      role: 'ADMIN'
    };
    
    return this.http.post<UserResponse>(
      `${this.apiUrl}/admin`, 
      adminRequest,
      { headers: this.getAuthHeaders() }
    );
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
getAllUsers(role?: string): Observable<UserResponse[]> {
  let params = new HttpParams();
  if (role) {
    params = params.set('role', role);
  }
  return this.http.get<UserResponse[]>(`${this.apiUrl}`, { params });
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
