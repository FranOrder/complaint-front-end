
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ComplaintStats {
  data: { [key: string]: number };
  total?: number;
}

export interface MonthlyStats {
  year: number;
  month: number;
  count: number;
}

export interface MonthlyComparison {
  currentMonth: number;
  previousMonth: number;
  percentageChange: number;
}

export interface DateRangeStats {
  data: { [key: string]: number };
  startDate: string;
  endDate: string;
}
interface AverageResolutionTimeResponse {
  averageResolutionTime: number;
}
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('Error en la petición HTTP:', error);
    let errorMessage = 'Ocurrió un error en la petición';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}, Mensaje: ${error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getComplaintsByStatus(dateRange?: { start: Date, end: Date }): Observable<ComplaintStats> {
    
    let params: any = {};
    if (dateRange) {
      params = {
        startDate: this.formatDate(dateRange.start),
        endDate: this.formatDate(dateRange.end)
      };
    }
    
    return this.http.get<ComplaintStats>(`${this.apiUrl}/complaints-by-status`, { 
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getComplaintsByType(): Observable<ComplaintStats> {
    return this.http.get<ComplaintStats>(`${this.apiUrl}/complaints-by-type`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getComplaintsByDateRange(startDate: Date, endDate: Date): Observable<DateRangeStats> {
    
    const params = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    };
    
    return this.http.get<DateRangeStats>(`${this.apiUrl}/complaints-by-date`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

 getAverageResolutionTime(): Observable<number> {
  return this.http.get<AverageResolutionTimeResponse>(
    `${this.apiUrl}/average-resolution-time`,
    { headers: this.getAuthHeaders() }
  ).pipe(
    map(response => response.averageResolutionTime),
    catchError(error => {
      console.error('Error getting average resolution time:', error);
      return of(0); 
    })
  );
}
  getDashboardSummary() {
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); 

    return forkJoin({
      byStatus: this.getComplaintsByStatus().pipe(
        catchError(error => {
          console.error('Error en byStatus:', error);
          return throwError(() => error);
        })
      ),
      byType: this.getComplaintsByType().pipe(
        catchError(error => {
          console.error('Error en byType:', error);
          return throwError(() => error);
        })
      ),
      byDateRange: this.getComplaintsByDateRange(startDate, endDate).pipe(
        catchError(error => {
          console.error('Error en byDateRange:', error);
          return throwError(() => error);
        })
      ),
      averageResolutionTime: this.getAverageResolutionTime().pipe(
        catchError(error => {
          console.error('Error en averageResolutionTime:', error);
          return throwError(() => error);
        })
      )
    }).pipe(
      map(response => {
        console.log('Respuesta completa del dashboard:', response);
        return response;
      }),
      catchError(error => {
        console.error('Error en forkJoin del dashboard:', error);
        return throwError(() => error);
      })
    );
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  calculateMonthlyGrowth(currentMonth: number, previousMonth: number): number {
    if (previousMonth === 0) return currentMonth > 0 ? 100 : 0;
    return Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
  }
}

