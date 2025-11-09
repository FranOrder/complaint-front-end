import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

// Models
import { Complaint, STATUS_LABELS, VIOLENCE_TYPE_LABELS, RELATIONSHIP_LABELS } from '../../../models/complaint.model';

// Services
import { ComplaintService, ComplaintFilters } from '../../../services/complaint.service';

// Components
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { TruncatePipe } from '../../../pipes/truncate.pipe';

// Constants
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
  
  // Component state
  complaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  isLoading = false;
  isFormVisible = false;
  currentPage: number = 1;
  itemsPerPage: number = ITEMS_PER_PAGE;
  totalItems: number = 0;
  
  // Filter state
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
  
  // Toast state
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

  // Data loading
  
loadComplaints(): void {
  this.isLoading = true;

  this.complaintService.getAllComplaints()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (complaints) => {
        // Make a copy of all complaints initially
        let filteredComplaints = [...complaints];

        // Apply status filter if selected
        if (this.selectedStatus) {
          filteredComplaints = filteredComplaints.filter(
            complaint => complaint.status === this.selectedStatus
          );
        }

        // Apply violence type filter if selected
        if (this.violenceTypeFilter) {
          filteredComplaints = filteredComplaints.filter(
            complaint => complaint.violenceType === this.violenceTypeFilter
          );
        }

        // Apply search term filter if it exists
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

        // 🔸 Actualizar total de elementos después de aplicar los filtros
        this.totalItems = filteredComplaints.length;

        // 🔸 Aplicar paginación
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

  
  // UI Actions
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadComplaints();
  }
  
onFilterClick(): void {
  this.currentPage = 1; // Reset to first page when filters change
  this.loadComplaints();
}
  
  // Check if any filter is active
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
  this.loadComplaints(); // Refresh the list to ensure data consistency
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
  
  // Log the error for debugging
  if (error.error?.code) {
    console.warn('Error code from server:', error.error.code);
  }
}
  // Status management
updateStatus(complaint: Complaint, newStatus: string): void {
  if (!confirm(`¿Está seguro de cambiar el estado a "${this.statusLabels[newStatus] || newStatus}"?`)) {
    return;
  }

  this.isLoading = true;
  
  // Show loading message
  this.showToast = true;
  this.toastType = 'info';
  this.toastMessage = 'Actualizando estado...';

  // First, check if we need to go through an intermediate state
  const currentStatus = complaint.status;
  let targetStatus = newStatus;

  // If trying to go from RECEIVED to ACTION_TAKEN, first go to IN_REVIEW
  if (currentStatus === 'RECEIVED' && newStatus === 'ACTION_TAKEN') {
    targetStatus = 'IN_REVIEW';
  }

  const updateStatus = () => {
    this.complaintService.updateComplaintStatus(complaint.id!, targetStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedComplaint) => {
          // If we just moved to IN_REVIEW and need to go to ACTION_TAKEN next
          if (updatedComplaint.status === 'IN_REVIEW' && newStatus === 'ACTION_TAKEN') {
            // Update the local complaint status
            const index = this.complaints.findIndex(c => c.id === updatedComplaint.id);
            if (index !== -1) {
              this.complaints[index] = { ...updatedComplaint, isExpanded: this.complaints[index].isExpanded };
            }
            
            // Now update to ACTION_TAKEN
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
            // For all other cases (including direct transitions)
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

  
  // Helper to determine if a status button should be hidden based on current status
  shouldHideStatusButton(currentStatus: string, buttonStatus: string): boolean {
    // Hide all buttons if status is CLOSED
    if (currentStatus === 'CLOSED') {
      return true;
    }
    
    // Get the index of current status and button status in statusOptions
    const currentStatusIndex = this.statusOptions.findIndex(opt => opt.value === currentStatus);
    const buttonStatusIndex = this.statusOptions.findIndex(opt => opt.value === buttonStatus);
    
    // If either status is not found, show the button
    if (currentStatusIndex === -1 || buttonStatusIndex === -1) {
      return false;
    }
    
    // Hide the button if its status is the same as current status
    if (buttonStatus === currentStatus) {
      return true;
    }
    
    // Hide the button if its status is before the current status in the workflow
    if (buttonStatusIndex < currentStatusIndex) {
      return true;
    }
    
    // For other cases, show the button
    return false;
  }

  // Helper to get violence type label
  getViolenceTypeLabel(type: string): string {
    const found = this.violenceTypes.find(t => t.value === type);
    return found ? found.label : type || 'No especificado';
  }

  // UI Helpers
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
    const maxPagesToShow = 5; // Maximum number of page buttons to show
    
    let startPage = 1;
    let endPage = totalPages;
    
    if (totalPages > maxPagesToShow) {
      // Calculate start and end pages to show
      const halfMaxPages = Math.floor(maxPagesToShow / 2);
      
      if (this.currentPage <= halfMaxPages) {
        // Near the beginning
        endPage = maxPagesToShow;
      } else if (this.currentPage >= totalPages - halfMaxPages) {
        // Near the end
        startPage = totalPages - maxPagesToShow + 1;
      } else {
        // In the middle
        startPage = this.currentPage - halfMaxPages;
        endPage = this.currentPage + halfMaxPages;
      }
    }
    
    // Generate the array of page numbers
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
  
  // For template to track items in ngFor
  trackById(index: number, item: Complaint): number | undefined {
    return item.id;
  }

  getRelationshipLabel(relation: string | undefined): string {
    return relation ? RELATIONSHIP_LABELS[relation] || relation : 'No especificado';
  }
}
