import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Complaint, FileMetadata } from '../models/complaint.model';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private apiUrl = `${environment.apiUrl}/complaints`;

  constructor(private http: HttpClient) { }

  // Create a new complaint
  createComplaint(complaintData: Omit<Complaint, 'id'>): Observable<Complaint> {
    // Validate required fields
    if (!complaintData.description || !complaintData.violenceType || !complaintData.aggressorFullName) {
      return throwError(() => new Error('Los campos descripción, tipo de violencia y nombre del agresor son obligatorios'));
    }

    const formattedData = this.formatComplaintData(complaintData);
    
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.'));
    }
    
    // Create headers with the token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<Complaint>(this.apiUrl, formattedData, { headers })
      .pipe(
        tap(response => console.log('Denuncia creada exitosamente:', response)),
        catchError(error => {
          console.error('Error al crear la denuncia:', error);
          return throwError(() => error);
        })
      );
  }

  getComplaints(): Observable<Complaint[]> {
  const token = localStorage.getItem('auth_token');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  

  return this.http.get<Complaint[]>(`${this.apiUrl}/my-complaints`, {
    headers,
    withCredentials: true
  }).pipe(
    map((complaints) =>
      complaints.map((c) => ({
        ...c,
        // 🔧 Crear el objeto aggressor directamente aquí
        aggressor: {
          fullName: c.aggressorFullName || 'No registrado',
          relationship: c.aggressorRelationship || 'No especificada',
          additionalDetails: c.aggressorAdditionalDetails || 'Sin detalles'
        },
      }))
    ),
    catchError(this.handleError)
  );
}

 getComplaintById(id: number): Observable<Complaint> {
  const token = localStorage.getItem('auth_token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.get<Complaint>(`${this.apiUrl}/${id}`, { headers, withCredentials: true })
    .pipe(
      tap(response => console.log('Detalles completos de la denuncia:', response)),
      catchError(this.handleError)
    );
}
// In complaint.service.ts
getEvidenceUrl(fileName: string): string {
  return `${environment.apiUrl}/files/${fileName}`;
}
  // Update complaint status
  updateComplaintStatus(id: number, status: string): Observable<Complaint> {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // Create headers with the token
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.patch<Complaint>(
      `${this.apiUrl}/${id}/status`, 
      { status },
      { headers, withCredentials: true }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Upload file for a complaint
  uploadFile(complaintId: number, file: File): Observable<any> {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return throwError(() => new Error('No se encontró el token de autenticación'));
    }
    
    // Create headers with the token
    // Note: Don't set Content-Type when using FormData, let the browser set it with the correct boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json' // Explicitly accept JSON response
    });
    
    // Create FormData and append the file with the correct field name
    const formData = new FormData();
    formData.append('file', file, file.name);
    
    // Log the file details for debugging
    console.log('Uploading file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Make the request to the correct endpoint
    return this.http.post<{
      id: number;
      fileName: string;
      fileType: string;
      fileSize: number;
      uploadedAt: string;
    }>(`${this.apiUrl}/${complaintId}/evidence`, formData, {
      headers,
      reportProgress: true,
      observe: 'events',
      withCredentials: true
    }).pipe(
      tap((event: HttpEvent<any>) => {
        // Log upload progress
        if (event.type === 1) { // HttpEventType.UploadProgress
          const percentDone = Math.round(100 * event.loaded / (event.total || 1));
          console.log(`File is ${percentDone}% uploaded`);
        } else if (event.type === 4) { // HttpEventType.Response
          console.log('File upload complete', event.body);
        }
      }),
      map(event => {
        // Transform the response to match the expected format
        if (event.type === 4) { // HttpEventType.Response
          const response = event.body as any;
          return {
            ...response,
            uploadedAt: new Date(response.uploadedAt)
          };
        }
        return event;
      }),
      catchError(error => {
        console.error('Error uploading file:', file.name, error);
        
        let errorMessage = 'Error al subir el archivo';
        
        if (error.error) {
          // Handle backend validation errors
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
          
          // Handle file size limit exceeded
          if (error.status === 413 || 
              (typeof error.error === 'string' && error.error.includes('File size exceeds'))) {
            errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB.';
          }
          
          // Handle invalid file type
          if (error.error.includes('File type not allowed')) {
            errorMessage = 'Tipo de archivo no permitido. Formatos aceptados: imágenes, PDF, documentos de Word';
          }
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Get files for a complaint
  getComplaintFiles(complaintId: number): Observable<FileMetadata[]> {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // Create headers with the token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<FileMetadata[]>(`${this.apiUrl}/${complaintId}/files`, {
      headers,
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Download a file
  downloadFile(complaintId: number, fileId: number): Observable<Blob> {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // Create headers with the token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get(`${this.apiUrl}/${complaintId}/files/${fileId}`, {
      headers,
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Format complaint data before sending to the server
  private formatComplaintData(complaintData: any): any {
    const formatDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        // Format as yyyy-MM-dd
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error('Error formatting date:', e);
        return null;
      }
    };

    return {
      description: complaintData.description,
      violenceType: complaintData.violenceType,
      incidentDate: formatDate(complaintData.incidentDate),
      incidentLocation: complaintData.incidentLocation || null,
      aggressorFullName: complaintData.aggressorFullName,
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
