import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./components/Auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'victim',
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/Victim/victim-home/victim-home').then(m => m.VictimHomeComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      
      {
        path: 'complaint',
        loadComponent: () => import('./components/Victim/victim-complaint/victim-complaint').then(m => m.VictimComplaintComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./components/Victim/victim-chat/victim-chat').then(m => m.VictimChatComponent)
      },
      {
        path: 'map',
        loadComponent: () => import('./components/Victim/victim-map/victim-map').then(m => m.VictimMapComponent)
      },
      {
        path: 'info',
        loadComponent: () => import('./components/Victim/victim-info/victim-info').then(m => m.VictimInfoComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/Victim/victim-profile/victim-profile').then(m => m.VictimProfileComponent)
      },
      {
        path: '**',
        redirectTo: 'home'
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' },
    loadComponent: () => import('./components/admin/admin-dashboards/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () => import('./components/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'complaints',
        loadComponent: () => import('./components/admin/admin-complaints/admin-complaints.component').then(m => m.AdminComplaintsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/admin/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: '**',
        redirectTo: 'dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

