import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Models
import { SupportCenter, SupportCenterResponse } from '../../../models/support-center.model';

// Services
import { SupportCenterService } from '../../../services/support-center.service';

@Component({
  selector: 'app-admin-supportcenter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-supportcenter.component.html',
  styleUrls: ['./admin-supportcenter.component.css']
})
export class AdminSupportCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  supportCenters: SupportCenterResponse[] = [];
  filteredSupportCenters: SupportCenterResponse[] = [];
  selectedSupportCenter: SupportCenter | null = null;
  isEditing = false;
  isLoading = false;
  
selectedSupportCenterId: number | null = null;
  
  // Form state
  newSupportCenter: Partial<SupportCenter> = this.getDefaultSupportCenter();
  
  // Filter state
  searchTerm = '';
  selectedDistrictFilter = '';
  activeStatusFilter: boolean | '' = '';
  
  // UI state
  errorMessage = '';
  successMessage = '';

  // Constants
readonly DISTRICTS = [
  'Lima', 'Ate', 'Barranco', 'Breña', 'Comas', 
  'La Molina', 'La Victoria', 'Lince', 'Magdalena',
  'Miraflores', 'Pueblo Libre', 'San Borja', 'San Isidro',
  'San Juan de Lurigancho', 'San Miguel', 'Santiago de Surco',
  'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
] as const;

private districtMap = new Map<string, string>();
  constructor(private supportCenterService: SupportCenterService) {
  // Map display names to API values and vice versa
  this.DISTRICTS.forEach(district => {
    const apiValue = district.toUpperCase().replace(/ /g, '_');
    this.districtMap.set(apiValue, district);
  });
}

  // Lifecycle hooks
  ngOnInit(): void {
    this.loadSupportCenters();
    this.clearFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  getDistrictDisplayName(apiValue: string): string {
  return this.districtMap.get(apiValue) || apiValue;
}

  // Data loading
 private loadSupportCenters(): void {
  this.isLoading = true;
  this.errorMessage = '';
  
  this.supportCenterService.getAllSupportCenters()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        console.log('Loaded support centers:', data); // Debug log
        this.supportCenters = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading support centers:', error);
        this.handleError(error, 'Error al cargar los centros de ayuda');
        this.isLoading = false;
      }
    });
}
onAddNew(): void {
  this.selectedSupportCenter = null;
  this.selectedSupportCenterId = null;
  this.isEditing = false;
  this.newSupportCenter = this.getDefaultSupportCenter();
  this.openModal('supportCenterModal');
}

selectSupportCenter(center: SupportCenter): void {
  this.selectedSupportCenter = center;
  this.selectedSupportCenterId = center.id || null;
}

isSelected(id?: number): boolean {
  return id !== undefined && this.selectedSupportCenterId === id;
}

  // CRUD Operations
  createSupportCenter(): void {
    if (!this.validateForm(this.newSupportCenter)) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const supportCenterData = {
      ...this.newSupportCenter,
      isActive: this.newSupportCenter.isActive ?? true
    };

    this.supportCenterService.createSupportCenter(supportCenterData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadSupportCenters();
          this.showSuccess('Centro de ayuda creado correctamente');
          this.closeModal('supportCenterModal');
          this.resetForm();
        },
        error: (error) => this.handleError(error, 'Error al crear el centro de ayuda')
      });
  }

  updateSupportCenter(): void {
    if (!this.selectedSupportCenter?.id || !this.validateForm(this.selectedSupportCenter)) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.supportCenterService.updateSupportCenter(
      this.selectedSupportCenter.id,
      this.selectedSupportCenter
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadSupportCenters();
        this.showSuccess('Centro de ayuda actualizado correctamente');
        this.closeModal('supportCenterModal');
        this.resetForm();
      },
      error: (error) => this.handleError(error, 'Error al actualizar el centro de ayuda')
    });
  }

  deleteSupportCenter(id: number): void {
  if (!confirm('¿Está seguro de eliminar este centro de ayuda? Esta acción no se puede deshacer.')) {
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.supportCenterService.deleteSupportCenter(id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.loadSupportCenters();
        this.showSuccess('Centro de ayuda eliminado correctamente');
        this.selectedSupportCenter = null;
        this.selectedSupportCenterId = null;
      },
      error: (error) => this.handleError(error, 'Error al eliminar el centro de ayuda')
    });
}

  // UI Helpers
editSupportCenter(center: SupportCenter): void {
  this.selectedSupportCenter = { ...center };
  this.isEditing = true;
  this.openModal('supportCenterModal');
}
  
  cancelEdit(): void {
    this.resetForm();
    this.errorMessage = '';
  }

  // Form Helpers
  private openModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }
  
  private closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) modal.hide();
    }
  }
  
  private resetForm(): void {
    this.newSupportCenter = this.getDefaultSupportCenter();
    this.selectedSupportCenter = null;
    this.isEditing = false;
    this.errorMessage = '';
  }
  
  private getDefaultSupportCenter(): Partial<SupportCenter> {
    return {
      name: '',
      street: '',
      district: '',
      phone: '',
      email: '',
      schedule: '',
      isActive: true
    };
  }

  // Validation
  private validateForm(center: Partial<SupportCenter>): boolean {
    const validations = [
      { condition: !center.name?.trim(), message: 'El nombre es requerido' },
      { condition: !center.district, message: 'El distrito es requerido' },
      { condition: !center.street?.trim(), message: 'La calle es requerida' },
      { 
        condition: !center.phone?.trim(), 
        message: 'El teléfono es requerido' 
      },
      { 
        condition: center.phone?.trim() && (center.phone.trim().length < 9 || center.phone.trim().length > 15), 
        message: 'El teléfono debe tener entre 9 y 15 caracteres' 
      },
      { 
        condition: !center.email?.trim(), 
        message: 'El correo electrónico es requerido' 
      },
      { 
        condition: center.email?.trim() && !/\S+@\S+\.\S+/.test(center.email), 
        message: 'El correo electrónico no es válido' 
      },
      { 
        condition: center.email && center.email.length > 150, 
        message: 'El correo no puede exceder los 150 caracteres' 
      },
      { 
        condition: !center.schedule?.trim(), 
        message: 'El horario es requerido' 
      },
      { 
        condition: center.schedule && center.schedule.length > 200, 
        message: 'El horario no puede exceder los 200 caracteres' 
      }
    ];

    const failedValidation = validations.find(v => v.condition);
    if (failedValidation) {
      this.errorMessage = failedValidation.message;
      return false;
    }
    
    return true;
  }
  
  // Filtering
applyFilters(): void {
  if (!this.supportCenters) return;

  this.filteredSupportCenters = this.supportCenters.filter((center: SupportCenter & { active?: boolean }) => {
    // Search by name or email (case insensitive)
    const searchTerm = this.searchTerm?.toLowerCase() || '';
    const matchesSearch = !this.searchTerm || 
      (center.name?.toLowerCase().includes(searchTerm) || 
       center.email?.toLowerCase().includes(searchTerm));

    // District filter
    const displayDistrict = this.districtMap.get(center.district) || center.district;
    const matchesDistrict = !this.selectedDistrictFilter || 
      displayDistrict === this.selectedDistrictFilter;

    // Status filter - check both 'active' and 'isActive' properties
    const isActive = 'active' in center ? center.active : center.isActive;
    const matchesStatus = this.activeStatusFilter === '' || 
      isActive === this.activeStatusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });
}
  
onFilterClick(): void {
  this.applyFilters();
}

  private matchesSearch(center: SupportCenter): boolean {
    if (!this.searchTerm) return true;
    const search = this.searchTerm.toLowerCase();
    return (
      center.name.toLowerCase().includes(search) ||
      (center.email?.toLowerCase().includes(search) ?? false)
    );
  }
  
  private matchesDistrict(center: any): boolean {
  if (!this.selectedDistrictFilter) return true;
  
  // Convert both to the same format for comparison
  const displayDistrict = this.districtMap.get(center.district) || center.district;
  return displayDistrict === this.selectedDistrictFilter;
}
  
private matchesStatus(center: any): boolean {
  if (this.activeStatusFilter === '') return true;
  // Check both 'active' and 'isActive' properties
  const isActive = center.active !== undefined ? center.active : center.isActive;
  return isActive === this.activeStatusFilter;
}
  // Error handling
  private handleError(error: any, defaultMessage: string): void {
    console.error(error);
    
    if (error.status === 401 || error.status === 403) {
      this.errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente.';
    } else {
      this.errorMessage = error.error?.message || defaultMessage;
    }
    
    this.isLoading = false;
  }
  
  // UI Helpers
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000);
  }
  
  getDistricts(): readonly string[] {
    return this.DISTRICTS;
  }
  
  // For template to track items in ngFor
  trackById(index: number, item: SupportCenterResponse): number | undefined {
    return item.id;
  }
  
  // Clear filters
clearFilters(): void {
  this.searchTerm = '';
  this.selectedDistrictFilter = '';
  this.activeStatusFilter = '';
  this.filteredSupportCenters = [...this.supportCenters]; // Reset to show all
}

}
