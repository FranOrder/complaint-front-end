import { HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  
  if (token) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  if (request.url.includes('/api/v1/complaints') && request.method === 'POST') {
    return next(request);
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
  authService.logout();
  router.navigate(['/auth/login']);
}
      return throwError(() => error);
    })
  );
}
