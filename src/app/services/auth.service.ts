import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<any>;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  currentUser$: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserInfo());
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    // Check if token exists in localStorage when service initializes
    if (this.getToken()) {
      this.isAuthenticatedSubject.next(true);
    }
  }
  
  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      withCredentials: true
    })
      .pipe(
        tap((response: AuthResponse) => {
          if (response.token) {
            this.saveAuthData(response);
            this.currentUserSubject.next({
              id: response.id,
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
              role: response.role
            });
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // Set default role if not provided
    if (!userData.role) {
      userData.role = 'USER';
    }
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    // Remove the token from localStorage
    localStorage.removeItem('auth_token');
    
    // Clear auth data and update observables
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Alias for isLoggedIn for better readability
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getToken(): string | null {
    // First check localStorage for the token
    const token = localStorage.getItem('auth_token');
    if (token) {
      return token;
    }
    
    // Fallback to the old token storage for backward compatibility
    return localStorage.getItem('token');
  }

  private saveAuthData(authData: AuthResponse): void {
    if (authData.token) {
      localStorage.setItem('auth_token', authData.token);
      
      const userData = {
        id: authData.id,
        email: authData.email,
        firstName: authData.firstName,
        lastName: authData.lastName,
        role: authData.role
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      this.currentUserSubject.next(userData);
      this.isAuthenticatedSubject.next(true);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  getUserInfo(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
