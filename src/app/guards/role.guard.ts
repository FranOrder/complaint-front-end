import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole = route.data['role'];
    const userInfo = this.authService.getUserInfo();
    const userRole = userInfo ? userInfo.role : null;
    
    if (this.authService.isLoggedIn() && userRole === expectedRole) {
      return true;
    }
    
    // Redirect to unauthorized or login page
    this.router.navigate(['/auth/login']);
    return false;
  }
}
