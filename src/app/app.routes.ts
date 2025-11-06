import { Routes } from '@angular/router';
import { LoginComponent } from './components/Auth/login/login.component';
import { RegisterComponent } from './components/Auth/register/register.component';
import { VictimHomeComponent } from './components/Victim/victim-home/victim-home';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  { 
    path: 'register', 
    component: RegisterComponent 
  },
  { 
    path: 'home', 
    component: VictimHomeComponent,
    canActivate: [AuthGuard] 
  },
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];

