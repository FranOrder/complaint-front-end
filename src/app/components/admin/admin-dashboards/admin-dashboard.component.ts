import { Component, OnInit, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { AnalyticsService, ComplaintStats } from '../../../services/analytics.service';
import { STATUS_LABELS, VIOLENCE_TYPE_LABELS } from '../../../models/complaint.model';
import { Subscription, forkJoin } from 'rxjs';
import { NgbDropdownModule, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';

import ChartDataLabels from 'chartjs-plugin-datalabels';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgbDropdownModule,
    NgbProgressbarModule,
    NgChartsModule  
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  user: any = {};
  logoPath = 'assets/images/logoo.png';
  private routeSubscription: Subscription;

  loading = true;
  error: string | null = null;

  // Datos generales
  totalComplaints = 0;
  monthlyGrowth = 0;
  currentMonthCount = 0;
  previousMonthCount = 0;

  // Estadísticas rápidas 
  averageResolutionTime = 0;
  resolvedPercentage = 0;
  mostCommonViolenceType = '';

  // Datos gráficos
  pieChartType: ChartType = 'pie';
  barChartType: ChartType = 'bar';
  lineChartType: ChartType = 'line';

  pieChartData: any;
  barChartData: any;
  lineChartData: any;

  // Opciones  gráficos
  chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      datalabels: {
        formatter: (value: any, ctx: any) => `${value}`
      }
    }
  };

  // opciones espeiicas
  barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true }
    }
  };
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' }
    }
  };

constructor(
  private authService: AuthService,
  private analyticsService: AnalyticsService,
  public router: Router
) {
  Chart.register(...registerables);
  Chart.register(ChartDataLabels);
  this.routeSubscription = this.router.events.subscribe(() => {});
}

  ngOnInit(): void {
    const userInfo = this.authService.getUserInfo();
    if (userInfo) {
      this.user = userInfo;
      this.loadDashboardData();
    } else {
      this.error = 'No se pudo obtener la información del usuario';
      this.loading = false;
    }
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 60); 

   
    forkJoin({
      byStatus: this.analyticsService.getComplaintsByStatus(),
      byType: this.analyticsService.getComplaintsByType(),
      byDateRange: this.analyticsService.getComplaintsByDateRange(startDate, endDate),
      averageResolutionTime: this.analyticsService.getAverageResolutionTime()
    }).subscribe({
      next: (data) => {
        try {
          this.preparePieChart(data.byStatus);
          this.prepareBarChart(data.byType);
          this.prepareLineChart(data.byDateRange);
        
          if ((data.byStatus as any)?.total) {
            this.totalComplaints = (data.byStatus as any).total;
          }
          this.averageResolutionTime = data.averageResolutionTime || 0;

          const closedCount = data.byStatus?.data?.['CLOSED'] || 0;
          this.resolvedPercentage = this.totalComplaints > 0 ? Math.round((closedCount / this.totalComplaints) * 100) : 0;

          
          this.mostCommonViolenceType = 'N/A';
          if (data.byType?.data) {
            let max = -1;
            let mostCommonType = '';
            for (const [type, count] of Object.entries(data.byType.data)) {
              if ((count as number) > max) {
                max = count as number;
                mostCommonType = type;
              }
            }
            this.mostCommonViolenceType = VIOLENCE_TYPE_LABELS[mostCommonType] || mostCommonType;
          }

          this.calculateMonthlyComparison(data.byDateRange);
        } catch (e) {
          console.error('Error procesando datos del dashboard:', e);
          this.error = 'Error al procesar los datos del tablero';
        } finally {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error al cargar el dashboard:', error);
        this.error = 'Error al cargar los datos del dashboard';
        this.loading = false;
      }
    });
  }

  /** Pie Chart  */
  private preparePieChart(statusData: ComplaintStats): void {
    if (!statusData?.data) {
      this.pieChartData = { labels: [], datasets: [] };
      this.totalComplaints = 0;
      return;
    }
    
    const statusEntries = Object.entries(statusData.data);
    const labels = statusEntries.map(([key]) => STATUS_LABELS[key] || key);
    const values = statusEntries.map(([_, value]) => Number(value));
    
    this.totalComplaints = values.reduce((sum, v) => sum + v, 0);

    this.pieChartData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#5588b8ff', '#dfc87fff', '#71c98bff', '#8ce7eeff']
        }
      ]
    };
  }

  /** Bar Chart */
  private prepareBarChart(typeData: ComplaintStats): void {
    if (!typeData?.data) {
      this.barChartData = { labels: [], datasets: [] };
      return;
    }
    
  
    const typeEntries = Object.entries(typeData.data);
    const labels = typeEntries.map(([key]) => VIOLENCE_TYPE_LABELS[key] || key);
    const values = typeEntries.map(([_, value]) => Number(value));

    this.barChartData = {
      labels,
      datasets: [
        {
          label: 'Número de denuncias',
          data: values,
          backgroundColor: '#b497bd'
        }
      ]
    };
  }

  /** Line Chart */
  private prepareLineChart(dateRangeData: any): void {
    if (!dateRangeData?.data) {
      this.lineChartData = { labels: [], datasets: [] };
      return;
    }
    const sortedDates = Object.keys(dateRangeData.data).sort();
    const values = sortedDates.map(d => dateRangeData.data[d] as number);

    this.lineChartData = {
      labels: sortedDates,
      datasets: [
        {
          label: 'Denuncias por día',
          data: values,
          borderColor: '#4BC0C0',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  /** Cálculo */
  private calculateMonthlyComparison(dateRangeData: any): void {

    this.currentMonthCount = 0;
    this.previousMonthCount = 0;
    if (!dateRangeData?.data) {
      this.monthlyGrowth = 0;
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const previousMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    const currentYear = now.getFullYear();

    
    for (const [dateStr, count] of Object.entries(dateRangeData.data)) {
      const d = new Date(dateStr);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        this.currentMonthCount += count as number;
      }
      
      if (d.getMonth() === previousMonth && (currentMonth > 0 ? d.getFullYear() === currentYear : d.getFullYear() === currentYear - 1)) {
        this.previousMonthCount += count as number;
      }
    }

    this.monthlyGrowth = this.analyticsService.calculateMonthlyGrowth(this.currentMonthCount, this.previousMonthCount);
    
    
  }

  showDashboard(): boolean {
    return !['/admin/users', '/admin/complaints', '/admin/reports', '/admin/support-centers']
      .some((route) => this.router.url.includes(route));
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
