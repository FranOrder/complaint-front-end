import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-victim-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NgbDropdownModule],
  templateUrl: './victim-home.html',
  styleUrls: ['./victim-home.css']
})
export class VictimHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  user: any = {};
  logoPath = 'assets/images/logoo.png';
  currentUrl: string = '';
  private routeSubscription: Subscription;

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    this.routeSubscription = this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });
  }

  ngOnInit(): void {
    const userData = this.authService.getUserInfo();
    
    if (!userData) {
      this.router.navigate(['/login']);
      return;
    }

    this.user = {
      firstName: userData.firstName || 'Usuario',
      lastName: userData.lastName || ''
    };

    this.currentUrl = this.router.url;
  }

  ngAfterViewInit(): void {
    // Any view initialization can go here
  }

  showDashboard(): boolean {
    return !['/victim/chat', '/victim/complaint', '/victim/map', '/victim/info', '/victim/profile']
      .some(route => this.router.url.includes(route));
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
}