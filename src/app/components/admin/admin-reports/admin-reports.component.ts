import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true,
      },
    }
  };

  public barChartType: ChartType = 'bar';
  public barChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 40], label: 'Denuncias' },
      { data: [28, 48, 40, 19, 86, 27, 90], label: 'Usuarios' }
    ]
  };

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    }
  };
  public pieChartLabels = ['Resueltas', 'En Progreso', 'Pendientes'];
  public pieChartData = {
    labels: this.pieChartLabels,
    datasets: [{
      data: [300, 150, 100],
      backgroundColor: ['#28a745', '#17a2b8', '#ffc107']
    }]
  };
  public pieChartType: ChartType = 'pie';

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // Load report data
  }

  // Events
  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }
}
