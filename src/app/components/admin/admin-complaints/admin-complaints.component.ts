import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Complaint, STATUS_LABELS, VIOLENCE_TYPE_LABELS, RELATIONSHIP_LABELS } from '../../../models/complaint.model';
import { ComplaintService } from '../../../services/complaint.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { TruncatePipe } from '../../../pipes/truncate.pipe';

const ITEMS_PER_PAGE = 10;

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    ToastComponent,
    TruncatePipe
  ],
  templateUrl: './admin-complaints.component.html',
  styleUrls: ['./admin-complaints.component.css']
})
export class AdminComplaintsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component
  complaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  isLoading = false;
  isFormVisible = false;
  currentPage: number = 1;
  itemsPerPage: number = ITEMS_PER_PAGE;
  totalItems: number = 0;
  
  // Filter
  searchTerm = '';
  violenceTypeFilter = '';
  violenceTypes = [
    { value: '', label: 'Todos los tipos' },
    { value: 'PHYSICAL', label: 'Física' },
    { value: 'PSYCHOLOGICAL', label: 'Psicológica' },
    { value: 'EMOTIONAL', label: 'Emocional' },
    { value: 'SOCIAL', label: 'Social' },
    { value: 'HARASSMENT', label: 'Acoso' },
    { value: 'ECONOMIC', label: 'Económica' },
    { value: 'SEXUAL', label: 'Sexual' },
    { value: 'OTHER', label: 'Otra' }
  ];
  selectedStatus: string = '';
  
  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';
  
  // Constants
  readonly statusLabels = STATUS_LABELS;
  readonly violenceTypeLabels = VIOLENCE_TYPE_LABELS;
  readonly statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
  
  constructor(private complaintService: ComplaintService) {}

  ngOnInit(): void {
    this.loadComplaints();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadComplaints(): void {
  this.isLoading = true;

  this.complaintService.getAllComplaints()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (complaints) => {
        let filteredComplaints = [...complaints];

        if (this.selectedStatus) {
          filteredComplaints = filteredComplaints.filter(
            complaint => complaint.status === this.selectedStatus
          );
        }

        if (this.violenceTypeFilter) {
          filteredComplaints = filteredComplaints.filter(
            complaint => complaint.violenceType === this.violenceTypeFilter
          );
        }

        if (this.searchTerm) {
          const searchTermLower = this.searchTerm.toLowerCase();

          filteredComplaints = filteredComplaints.filter(complaint => {
            return (
              (complaint.description?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.incidentLocation?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.status?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.id?.toString().includes(this.searchTerm) || false) ||
              (complaint.violenceType?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.aggressor?.fullName?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.aggressor?.relationship?.toLowerCase() || '').includes(searchTermLower) ||
              (complaint.victimName?.toLowerCase() || '').includes(searchTermLower) ||
              (this.getViolenceTypeLabel(complaint.violenceType)?.toLowerCase() || '').includes(searchTermLower)
            );
          });
        }

        this.totalItems = filteredComplaints.length;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        this.complaints = filteredComplaints.slice(
          startIndex,
          startIndex + this.itemsPerPage
        );

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading complaints:', error);
        this.showError('Error al cargar las denuncias');
        this.isLoading = false;
      }
    });
}
  
 onPageChange(page: number): void {
    this.currentPage = page;
    this.loadComplaints();
  }
  
 onFilterClick(): void {
  this.currentPage = 1; 
  this.loadComplaints();
}
  
 hasActiveFilters(): boolean {
    return !!this.searchTerm || !!this.selectedStatus || !!this.violenceTypeFilter;
  }

 clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.violenceTypeFilter = '';
    this.currentPage = 1;
    this.loadComplaints();
  }

  toggleComplaintDetails(complaint: Complaint): void {
  this.selectedComplaint = null;

  if (complaint.id) {
    this.complaintService.getComplaintById(complaint.id).subscribe({
      next: (details) => {
        this.selectedComplaint = {
          ...complaint,
          ...details,
          evidences: details.evidences || []
        };
      },
      error: (error) => {
        console.error('Error al cargar detalles de la denuncia:', error);
        this.showError('No se pudieron cargar los detalles');
      }
    });
  }
}

  closeModal(): void {
  this.selectedComplaint = null;
}
  
  private updateComplaintInList(updatedComplaint: Complaint) {
  const index = this.complaints.findIndex(c => c.id === updatedComplaint.id);
  if (index !== -1) {
    const wasExpanded = this.complaints[index].isExpanded;
    this.complaints[index] = { ...updatedComplaint, isExpanded: wasExpanded };
  }
  this.loadComplaints(); 
}

  private handleStatusUpdateError(error: any, complaint: Complaint) {
  console.error('Error updating status:', error);
  
  let errorMessage = 'Error al actualizar el estado';
  if (error.error?.message) {
    errorMessage += `: ${error.error.message}`;
  } else if (error.message) {
    errorMessage += `: ${error.message}`;
  }
  
  this.showError(errorMessage);
  this.isLoading = false;
  
  if (error.error?.code) {
    console.warn('Error code from server:', error.error.code);
  }
}

  updateStatus(complaint: Complaint, newStatus: string): void {
  if (!confirm(`¿Está seguro de cambiar el estado a "${this.statusLabels[newStatus] || newStatus}"?`)) {
    return;
  }

  this.isLoading = true;
  
  this.showToast = true;
  this.toastType = 'info';
  this.toastMessage = 'Actualizando estado...';

  const currentStatus = complaint.status;
  let targetStatus = newStatus;

  if (currentStatus === 'RECEIVED' && newStatus === 'ACTION_TAKEN') {
    targetStatus = 'IN_REVIEW';
  }

const updateStatus = () => {
    this.complaintService.updateComplaintStatus(complaint.id!, targetStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedComplaint) => {
          if (updatedComplaint.status === 'IN_REVIEW' && newStatus === 'ACTION_TAKEN') {
            const index = this.complaints.findIndex(c => c.id === updatedComplaint.id);
            if (index !== -1) {
              this.complaints[index] = { ...updatedComplaint, isExpanded: this.complaints[index].isExpanded };
            }
            
            this.complaintService.updateComplaintStatus(complaint.id!, 'ACTION_TAKEN')
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (finalComplaint) => {
                  this.updateComplaintInList(finalComplaint);
                  this.showSuccess('Estado actualizado correctamente a ACTION_TAKEN');
                  this.isLoading = false;
                },
                error: (error) => this.handleStatusUpdateError(error, complaint)
              });
          } else {
            this.updateComplaintInList(updatedComplaint);
            this.showSuccess('Estado actualizado correctamente');
            this.isLoading = false;
          }
        },
        error: (error) => this.handleStatusUpdateError(error, complaint)
      });
  };

  updateStatus();
}

  shouldHideStatusButton(currentStatus: string, buttonStatus: string): boolean {
    if (currentStatus === 'CLOSED') {
      return true;
    }
    
    const currentStatusIndex = this.statusOptions.findIndex(opt => opt.value === currentStatus);
    const buttonStatusIndex = this.statusOptions.findIndex(opt => opt.value === buttonStatus);
    
    if (currentStatusIndex === -1 || buttonStatusIndex === -1) {
      return false;
    }
    
    if (buttonStatus === currentStatus) {
      return true;
    }
    
    if (buttonStatusIndex < currentStatusIndex) {
      return true;
    }
    
    return false;
  }
  
  getViolenceTypeLabel(type: string): string {
    const found = this.violenceTypes.find(t => t.value === type);
    return found ? found.label : type || 'No especificado';
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
  
  formatDate(dateString: string | null): string {
    if (!dateString) return 'No especificada';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }

  get endItemNumber(): number {
    if (!this.itemsPerPage || !this.totalItems) return 0;
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get startItemNumber(): number {
    if (!this.itemsPerPage || !this.totalItems) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getPageNumbers(): number[] {
    if (!this.itemsPerPage || !this.totalItems) {
      return [1];
    }
    
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const pages: number[] = [];
    const maxPagesToShow = 5; 
    
    let startPage = 1;
    let endPage = totalPages;
    
    if (totalPages > maxPagesToShow) {
      const halfMaxPages = Math.floor(maxPagesToShow / 2);
      
      if (this.currentPage <= halfMaxPages) {
        endPage = maxPagesToShow;
      } else if (this.currentPage >= totalPages - halfMaxPages) {
        startPage = totalPages - maxPagesToShow + 1;
      } else {
        startPage = this.currentPage - halfMaxPages;
        endPage = this.currentPage + halfMaxPages;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  showSuccess(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
  }
  
  showError(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
  }

  onToastClosed(): void {
    this.showToast = false;
  }
  
  trackById(index: number, item: Complaint): number | undefined {
    return item.id;
  }

  getRelationshipLabel(relation: string | undefined): string {
    return relation ? RELATIONSHIP_LABELS[relation] || relation : 'No especificado';
  }
}
