import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Models
import { SupportCenter, SupportCenterResponse, DISTRICTS } from '../../../models/support-center.model';

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
  isFormVisible = false;
  
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
 readonly DISTRICTS = DISTRICTS;

private districtMap = new Map<string, string>();

constructor(private supportCenterService: SupportCenterService) {
  // Mapea valores del API ↔ nombres legibles
  this.DISTRICTS.forEach(district => {
    // API usa district.value (ej. "SAN_JUAN_DE_LURIGANCHO")
    // Interfaz muestra district.label (ej. "San Juan de Lurigancho")
    this.districtMap.set(district.value, district.label);
    this.districtMap.set(district.label, district.value); // bidireccional, opcional
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
private mapSupportCenter(center: any): SupportCenterResponse {
  return {
    ...center,
    isActive: center.active ?? center.isActive ?? true
  };
}

getDistrictValue(displayName: string): string {
  // Convert display name to API format (e.g., "San Juan de Lurigancho" -> "SAN_JUAN_DE_LURIGANCHO")
  return displayName.toUpperCase().replace(/ /g, '_');
}

// When saving/updating a support center
private prepareSupportCenterData(supportCenter: Partial<SupportCenter>): any {
  const data = {
    ...supportCenter,
    district: this.getDistrictValue(supportCenter.district || ''),
    active: supportCenter.isActive ?? true // 👈 Aquí el cambio importante
  };

  // Quitamos isActive para no duplicar
  delete (data as any).isActive;

  // Removemos undefined
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
}

onActiveStatusChange(event: Event): void {
  const isChecked = (event.target as HTMLInputElement).checked;
  if (this.isEditing && this.selectedSupportCenter) {
    // Create a new object to trigger change detection
    this.selectedSupportCenter = {
      ...this.selectedSupportCenter,
      isActive: isChecked
    };
  } else {
    this.newSupportCenter = {
      ...this.newSupportCenter,
      isActive: isChecked
    };
  }
}
  // Data loading
private loadSupportCenters(): void {
  this.isLoading = true;
  this.errorMessage = '';

  this.supportCenterService.getAllSupportCenters()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.supportCenters = data.map(center => this.mapSupportCenter(center));
        this.filteredSupportCenters = [...this.supportCenters];
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError(error, 'Error al cargar los centros de ayuda');
        this.isLoading = false;
      }
    });
}
onAddNew(): void {
  this.isFormVisible = true;
  this.isEditing = false;
  this.selectedSupportCenter = null;
  this.selectedSupportCenterId = null;
  this.newSupportCenter = this.getDefaultSupportCenter();
}

selectSupportCenter(center: SupportCenter): void {
  this.selectedSupportCenter = center;
  this.selectedSupportCenterId = center.id || null;
}

isSelected(id?: number): boolean {
  return id !== undefined && this.selectedSupportCenterId === id;
}

  // CRUD Operations
 private createSupportCenter(): void {
  const supportCenterData = {
    ...this.prepareSupportCenterData(this.newSupportCenter),
    isActive: this.newSupportCenter.isActive ?? true
  };
  
  this.supportCenterService.createSupportCenter(supportCenterData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => this.handleSaveSuccess('Centro de ayuda creado correctamente'),
      error: (error) => this.handleError(error, 'Error al crear el centro de ayuda')
    });
}
saveSupportCenter(): void {
  // 🔹 Determinar qué centro se está editando o creando
  const center: Partial<SupportCenter> =
    this.isEditing && this.selectedSupportCenter
      ? this.selectedSupportCenter
      : this.newSupportCenter;

  // 🔹 Validar antes de enviar
  if (!this.validateForm(center)) {
    this.showError(this.errorMessage); // Muestra el mensaje temporalmente
    return;
  }

  // 🔹 Crear o actualizar según corresponda
  if (this.isEditing && this.selectedSupportCenter) {
    this.updateSupportCenter();
  } else {
    this.createSupportCenter();
  }
}

  private updateSupportCenter(): void {
  if (!this.selectedSupportCenter?.id) return;
  
  const supportCenterData = {
    ...this.prepareSupportCenterData(this.selectedSupportCenter),
    isActive: this.selectedSupportCenter.isActive ?? true
  };
  
  this.supportCenterService.updateSupportCenter(this.selectedSupportCenter.id, supportCenterData)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => this.handleSaveSuccess('Centro de ayuda actualizado correctamente'),
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
  this.isFormVisible = true;
  this.isEditing = true;
  this.selectedSupportCenter = { ...center };
  this.selectedSupportCenterId = center.id || null;
}
  
cancelEdit(): void {
  this.isFormVisible = false;
  this.resetForm();
}

  // Form Helpers
private handleSaveSuccess(message: string): void {
  this.showSuccess(message);
  this.isFormVisible = false;
  this.loadSupportCenters();
  this.resetForm();
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

  this.filteredSupportCenters = this.supportCenters.filter((center) => {
    // 🔎 Búsqueda por nombre o email (insensible a mayúsculas)
    const searchTerm = this.searchTerm?.toLowerCase() || '';
    const matchesSearch =
      !this.searchTerm ||
      center.name?.toLowerCase().includes(searchTerm) ||
      center.email?.toLowerCase().includes(searchTerm);

    // 🏙️ Filtro de distrito
    const displayDistrict = this.districtMap.get(center.district) || center.district;
    const matchesDistrict =
      !this.selectedDistrictFilter || displayDistrict === this.selectedDistrictFilter;

    // ✅ Filtro de estado (usa 'active' o 'isActive' según exista)
    const isActive = center.active ?? center.isActive;
    const matchesStatus =
      this.activeStatusFilter === '' || isActive === this.activeStatusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });
}

  
onFilterClick(): void {
  this.applyFilters();
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

private showError(message: string): void {
  this.errorMessage = message;
  setTimeout(() => this.errorMessage = '', 5000);
}

 getDistricts(): readonly { label: string; value: string }[] {
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

toggleActive(): void {
  if (this.isEditing && this.selectedSupportCenter) {
    this.selectedSupportCenter.isActive = !this.selectedSupportCenter.isActive;
  } else {
    this.newSupportCenter.isActive = !this.newSupportCenter.isActive;
  }
}

}
