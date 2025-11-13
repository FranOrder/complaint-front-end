import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SupportCenter, SupportCenterResponse, DISTRICTS } from '../../../models/support-center.model';
import { SupportCenterService } from '../../../services/support-center.service';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-admin-supportcenter',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ToastComponent
  ],
  templateUrl: './admin-supportcenter.component.html',
  styleUrls: ['./admin-supportcenter.component.css']
})
export class AdminSupportCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component
  supportCenters: SupportCenterResponse[] = [];
  filteredSupportCenters: SupportCenterResponse[] = [];
  selectedSupportCenter: SupportCenter | null = null;
  isEditing = false;
  isLoading = false;
  isFormVisible = false;
  
selectedSupportCenterId: number | null = null;
  
  // Form
  newSupportCenter: Partial<SupportCenter> = this.getDefaultSupportCenter();
  
  // Filter
  searchTerm = '';
  selectedDistrictFilter = '';
  activeStatusFilter: boolean | '' = '';
  
  // Toast
  isToastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

 readonly DISTRICTS = DISTRICTS;

private districtMap = new Map<string, string>();

constructor(private supportCenterService: SupportCenterService) {
  this.DISTRICTS.forEach(district => {
    this.districtMap.set(district.value, district.label);
    this.districtMap.set(district.label, district.value);
  });
}

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
  return displayName.toUpperCase().replace(/ /g, '_');
}

private prepareSupportCenterData(supportCenter: Partial<SupportCenter>): any {
  const data = {
    ...supportCenter,
    district: this.getDistrictValue(supportCenter.district || ''),
    active: supportCenter.isActive ?? true
  };
  delete (data as any).isActive;
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
}

onActiveStatusChange(event: Event): void {
  const isChecked = (event.target as HTMLInputElement).checked;
  if (this.isEditing && this.selectedSupportCenter) {
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
private loadSupportCenters(): void {
    this.isLoading = true;
    
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
  const center: Partial<SupportCenter> =
    this.isEditing && this.selectedSupportCenter
      ? this.selectedSupportCenter
      : this.newSupportCenter;
  if (!this.validateForm(center)) {
    return;
  }

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

    this.supportCenterService.deleteSupportCenter(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadSupportCenters();
          this.showToast('Centro de ayuda eliminado correctamente', 'success');
          this.selectedSupportCenter = null;
          this.selectedSupportCenterId = null;
        },
        error: (error) => this.handleError(error, 'Error al eliminar el centro de ayuda')
      });
  }

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

private handleSaveSuccess(message: string): void {
  this.showToast(message, 'success');
  this.isFormVisible = false;
  this.loadSupportCenters();
  this.resetForm();
}
  
  private resetForm(): void {
    this.newSupportCenter = this.getDefaultSupportCenter();
    this.selectedSupportCenter = null;
    this.isEditing = false;
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
      this.showToast(failedValidation.message, 'error');
      return false;
    }
    
    return true;
  }
  
applyFilters(): void {
  if (!this.supportCenters) return;

  this.filteredSupportCenters = this.supportCenters.filter((center) => {
    const searchTerm = this.searchTerm?.toLowerCase() || '';
    const matchesSearch =
      !this.searchTerm ||
      center.name?.toLowerCase().includes(searchTerm) ||
      center.email?.toLowerCase().includes(searchTerm);

    const displayDistrict = this.districtMap.get(center.district) || center.district;
    const matchesDistrict =
      !this.selectedDistrictFilter || displayDistrict === this.selectedDistrictFilter;
    const isActive = center.active ?? center.isActive;
    const matchesStatus =
      this.activeStatusFilter === '' || isActive === this.activeStatusFilter;

    return matchesSearch && matchesDistrict && matchesStatus;
  });
}

  
onFilterClick(): void {
  this.applyFilters();
}

  private handleError(error: any, defaultMessage: string): void {
    console.error(error);
    
    if (error.status === 401 || error.status === 403) {
      this.showToast('Sesión expirada. Por favor, inicie sesión nuevamente.', 'error');
    } else {
      this.showToast(error.error?.message || defaultMessage, 'error');
    }
    
    this.isLoading = false;
  }
  

  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.isToastVisible = true;
  }

  onToastClosed(): void {
    this.isToastVisible = false;
  }

 getDistricts(): readonly { label: string; value: string }[] {
  return this.DISTRICTS;
}

  trackById(index: number, item: SupportCenterResponse): number | undefined {
    return item.id;
  }
  
clearFilters(): void {
  this.searchTerm = '';
  this.selectedDistrictFilter = '';
  this.activeStatusFilter = '';
  this.filteredSupportCenters = [...this.supportCenters];
}

toggleActive(): void {
  if (this.isEditing && this.selectedSupportCenter) {
    this.selectedSupportCenter.isActive = !this.selectedSupportCenter.isActive;
  } else {
    this.newSupportCenter.isActive = !this.newSupportCenter.isActive;
  }
}

}
