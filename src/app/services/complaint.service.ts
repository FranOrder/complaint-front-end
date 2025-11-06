import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface Complaint {
  id?: number;
  description: string;
  violenceType: string;
  incidentDate: string | null;
  incidentLocation?: string | null;
  aggressorFullName: string;
  aggressorRelationship?: string | null;
  aggressorAdditionalDetails?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FileMetadata {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private apiUrl = `${environment.apiUrl}/api/v1/complaints`;

  constructor(private http: HttpClient) { }

  // Create a new complaint
  // In complaint.service.ts
// En complaint.service.ts
createComplaint(complaintData: Omit<Complaint, 'id'>): Observable<Complaint> {
  const formattedData = this.formatComplaintData(complaintData);
  
  return this.http.post<Complaint>(this.apiUrl, formattedData, {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }).pipe(
    tap(response => console.log('Denuncia creada exitosamente:', response)),
    catchError(error => {
      console.error('Error al crear la denuncia:', error);
      return throwError(() => error);
    })
  );
}

  // Get all complaints for the current user
  getComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}/my-complaints`, {
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get a single complaint by ID
  getComplaintById(id: number): Observable<Complaint> {
    return this.http.get<Complaint>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update complaint status
  updateComplaintStatus(id: number, status: string): Observable<Complaint> {
    return this.http.patch<Complaint>(
      `${this.apiUrl}/${id}/status`, 
      { status },
      { withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Upload file for a complaint
  uploadFile(complaintId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/${complaintId}/files`, formData, {
      reportProgress: true,
      observe: 'events',
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get files for a complaint
  getComplaintFiles(complaintId: number): Observable<FileMetadata[]> {
    return this.http.get<FileMetadata[]>(`${this.apiUrl}/${complaintId}/files`, {
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Download a file
  downloadFile(complaintId: number, fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${complaintId}/files/${fileId}`, {
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Format complaint data before sending to the server
  private formatComplaintData(complaintData: any): any {
    const formatDate = (dateString: string): string | null => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error formatting date:', e);
        return null;
      }
    };

    return {
      ...complaintData,
      incidentDate: formatDate(complaintData.incidentDate),
      incidentLocation: complaintData.incidentLocation || null,
      aggressorRelationship: complaintData.aggressorRelationship || null,
      aggressorAdditionalDetails: complaintData.aggressorAdditionalDetails || null
    };
  }

  // Handle HTTP errors
  private handleError(error: HttpErrorResponse) {
    console.error('Error in ComplaintService:', error);
    let errorMessage = 'Ocurrió un error al procesar la solicitud';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos. Por favor, verifica la información.';
          break;
        case 401:
        case 403:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.';
          break;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
