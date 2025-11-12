// admin-reports.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../services/analytics.service';
import { ComplaintService } from '../../../services/complaint.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { STATUS_LABELS, VIOLENCE_TYPE_LABELS } from '../../../models/complaint.model';

import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgChartsModule,
    
  ]
})
export class AdminReportsComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  // Form
  filtersForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  
  // Data
  complaints: any[] = [];
  filteredComplaints: any[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  sortColumn = 'createdAt';
  sortDirection = 'desc';
  
  // Charts
  statusChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  trendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  
  // Table columns
  displayedColumns: string[] = [
    'id', 'type', 'status', 'createdAt', 'updatedAt', 'resolutionTime', 'actions'
  ];

  constructor(
    private analyticsService: AnalyticsService,
    private complaintService: ComplaintService,
    private fb: FormBuilder
  ) {
    this.filtersForm = this.fb.group({
      startDate: [''],
      endDate: [''],
      violenceType: [''],
      status: ['']
    });
  }

  ngOnInit(): void {
  this.filtersForm = this.fb.group({
    startDate: [''],
    endDate: [''],
    violenceType: [''],
    status: ['']
  });

  this.loadInitialData();
}

  private loadInitialData(): void {
  this.isLoading = true;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1); // Default to last month
  
  this.filtersForm.patchValue({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  });
  
  // Fetch complaints data
  this.complaintService.getAllComplaints().pipe(
    finalize(() => this.isLoading = false)
  ).subscribe({
    next: (data) => {
      this.complaints = data;
      this.filteredComplaints = [...this.complaints];
      this.updateCharts();
    },
    error: (error) => {
      console.error('Error loading complaints:', error);
      this.error = 'Error al cargar las denuncias. Por favor, intente de nuevo.';
    }
  });
}

 applyFilters(): void {
  this.isLoading = true;
  const filters = this.filtersForm.value;

  this.filteredComplaints = this.complaints.filter((complaint: any) => {
    // ✅ 1. Filtrar por rango de fechas
    const complaintDate = new Date(
      complaint.incidentDate || complaint.createdAt
    );

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (complaintDate < startDate) return false;
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // incluir todo el día
      if (complaintDate > endDate) return false;
    }

    // ✅ 2. Filtrar por tipo de violencia (usa violenceType)
    if (
      filters.violenceType &&
      complaint.violenceType?.toUpperCase() !== filters.violenceType.toUpperCase()
    ) {
      return false;
    }

    // ✅ 3. Filtrar por estado
    if (
      filters.status &&
      complaint.status?.toUpperCase() !== filters.status.toUpperCase()
    ) {
      return false;
    }

    return true;
  });

  this.currentPage = 1; // Reinicia a la primera página
  this.updateCharts();
  this.isLoading = false;
}


  private updateCharts(): void {
    // Update status chart
    const statusCounts = this.filteredComplaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {});
    const allStatuses = Object.keys(STATUS_LABELS);
    this.statusChartData = {
      labels: allStatuses.map(status => STATUS_LABELS[status] || status),
      datasets: [{
        data: allStatuses.map(status => statusCounts[status] || 0),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
      }]
    };

    // Update trend chart (group by day)
    const trendData = this.filteredComplaints.reduce((acc, complaint) => {
      const date = new Date(complaint.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    const sortedDates = Object.keys(trendData).sort();
    this.trendChartData = {
      labels: sortedDates,
      datasets: [{
        label: 'Tendencia de denuncias',
        data: sortedDates.map(date => trendData[date]),
        borderColor: '#36A2EB',
        fill: false,
        tension: 0.3
      }]
    };
    
    if (this.chart) {
      this.chart.update();
    }
  }

  // Sorting
  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.filteredComplaints.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      
      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  // Export functions
  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredComplaints);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportToCSV(): void {
    const csv = this.convertToCSV(this.filteredComplaints);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `reporte-${new Date().toISOString().split('T')[0]}.csv`);
  }

 exportToPDF(): void {
  const doc = new jsPDF('landscape');
  const title = 'Reporte de Denuncias';

  // Título principal
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Fecha de generación
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

  // --- Capturar gráficos como imágenes ---
  const statusCanvas = document.querySelector('canvas[type="pie"], canvas[ng-reflect-type="pie"]') as HTMLCanvasElement;
  const trendCanvas = document.querySelector('canvas[type="line"], canvas[ng-reflect-type="line"]') as HTMLCanvasElement;

  let yPosition = 40;

  if (statusCanvas) {
    const statusImg = statusCanvas.toDataURL('image/png', 1.0);
    doc.addImage(statusImg, 'PNG', 14, yPosition, 100, 80);
  }

  if (trendCanvas) {
    const trendImg = trendCanvas.toDataURL('image/png', 1.0);
    doc.addImage(trendImg, 'PNG', 120, yPosition, 150, 80);
  }

  yPosition += 90; // espacio después de los gráficos

  // --- Tabla de datos ---
  const headers = [
    'ID',
    'Tipo',
    'Estado',
    'Fecha de Creación',
    'Última Actualización',
    'Tiempo de Resolución'
  ];

  const data = this.filteredComplaints.map(complaint => [
    complaint.id,
    this.getViolenceTypeLabel(complaint.violenceType),
    this.getStatusLabel(complaint.status),
    this.formatDate(complaint.createdAt),
    this.formatDate(complaint.updatedAt),
    this.calculateResolutionTime(complaint) || 'N/A'
  ]);

  autoTable(doc, {
    head: [headers],
    body: data,
    startY: yPosition,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  // Guardar PDF
  doc.save(`reporte-denuncias-${new Date().toISOString().split('T')[0]}.pdf`);
}
resetFilters(): void {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1); // último mes por defecto

  this.filtersForm.patchValue({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    violenceType: '',
    status: ''
  });

  // Restaurar todas las denuncias
  this.filteredComplaints = [...this.complaints];
  this.currentPage = 1;
  this.updateCharts();
}
private convertToCSV(items: any[]): string {
  if (items.length === 0) return '';
  
  // Get headers from displayedColumns
  const headers = this.displayedColumns;
  
  // Process data
  const rows = items.map(item => {
    return headers.map(header => {
      let value = item[header] || '';
      
      // Format dates
      if ((header === 'createdAt' || header === 'updatedAt') && value) {
        value = new Date(value).toLocaleString();
      }
      
      // Translate status and type
      if (header === 'status') return this.getStatusLabel(value);
      if (header === 'type') return this.getViolenceTypeLabel(value);
      
      return JSON.stringify(value);
    });
  });
  
  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');
}

formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
  // Helper methods
getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}
private calculateResolutionTime(complaint: any): string {
  // Validamos que existan ambas fechas
  if (!complaint.createdAt || !complaint.updatedAt) {
    return 'N/A';
  }

  const created = new Date(complaint.createdAt);
  const updated = new Date(complaint.updatedAt);

  // Calculamos la diferencia en milisegundos
  const diffMs = updated.getTime() - created.getTime();

  if (diffMs < 0) {
    return 'N/A'; // Evita errores si por alguna razón updatedAt < createdAt
  }

  // Convertimos a días y horas
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days === 0 && hours === 0) {
    return 'Menos de 1 hora';
  }

  if (days > 0) {
    return `${days} día${days !== 1 ? 's' : ''} ${hours} hora${hours !== 1 ? 's' : ''}`;
  }

  return `${hours} hora${hours !== 1 ? 's' : ''}`;
}

getViolenceTypeLabel(type: string): string {
  return VIOLENCE_TYPE_LABELS[type] || type;
}

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredComplaints.length / this.itemsPerPage);
  }

  get paginatedItems(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredComplaints.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }
   getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'RECEIVED':
        return 'bg-primary';
      case 'IN_REVIEW':
        return 'bg-warning';
      case 'ACTION_TAKEN':
        return 'bg-info';
      case 'CLOSED':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }
}