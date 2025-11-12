import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SupportCenter, DISTRICT_ZONES, SupportCenterResponse } from '../../../models/support-center.model';

@Component({
  selector: 'app-victim-map',
  standalone: true,
  imports: [CommonModule, FormsModule, ],
  templateUrl: './victim-map.html',
  styleUrls: ['./victim-map.css']
})
export class VictimMapComponent implements OnInit {
  supportCenters: SupportCenter[] = [];
  filteredCenters: SupportCenter[] = [];
  selectedCenter: SupportCenter | null = null;
   isLoading = false;
  
  
  // Filtros
  zones: string[] = ['Todas las zonas', 'Lima Centro', 'Lima Norte', 'Lima Este', 'Lima Sur', 'Lima Moderna', 'Callao'];
  districts: string[] = [];
  
  selectedZone: string = 'Todas las zonas';
  selectedDistrict: string = '';
  
  mapUrl: SafeUrl = '';
  
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}
  
  ngOnInit(): void {
    this.loadSupportCenters();
  }
    private mapToSupportCenter(response: SupportCenterResponse): SupportCenter {
    return {
      id: response.id,
      name: response.name,
      street: response.street,
      district: response.district,
      phone: response.phone,
      email: response.email,
      schedule: response.schedule,
      isActive: response.active || response.isActive || false,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    };
  }
  loadSupportCenters(): void {
    this.isLoading = true;
    
    this.http.get<SupportCenterResponse[]>(`${environment.apiUrl}/support-centers`).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', JSON.stringify(data, null, 2));
        
        // Mapear de SupportCenterResponse a SupportCenter
        this.supportCenters = data
          .filter(center => center.active === true || center.isActive === true)
          .map(center => this.mapToSupportCenter(center));
        
        console.log('Centros activos mapeados:', JSON.stringify(this.supportCenters, null, 2));
        
        this.filteredCenters = [...this.supportCenters];
        this.updateFilters();
        
        // Seleccionar el primer centro activo si está disponible
        if (this.filteredCenters.length > 0) {
          this.selectCenter(this.filteredCenters[0]);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar los centros de apoyo:', error);
        if (error.status === 403) {
          console.error('Acceso denegado. Por favor, verifica tu autenticación.');
        }
        this.isLoading = false;
      }
    });
  }
  updateFilters(): void {
    // Actualizamos los distritos basados en la zona seleccionada
    if (this.selectedZone === 'Todas las zonas') {
      this.districts = [
        ...new Set(
          this.supportCenters.map(center => center.district)
        )
      ].filter(Boolean) as string[];
    } else {
      this.districts = [
        ...new Set(
          this.supportCenters
            .filter(center => DISTRICT_ZONES[center.district] === this.selectedZone)
            .map(center => center.district)
        )
      ].filter(Boolean) as string[];
    }
    
    // Si el distrito seleccionado ya no está en la lista, lo limpiamos
    if (this.selectedDistrict && !this.districts.includes(this.selectedDistrict)) {
      this.selectedDistrict = '';
    }
    
    this.applyFilters();
  }

  applyFilters() {
    this.filteredCenters = this.supportCenters.filter(center => {
      const matchesZone = this.selectedZone === 'Todas las zonas' || 
                         DISTRICT_ZONES[center.district] === this.selectedZone;
      const matchesDistrict = !this.selectedDistrict || center.district === this.selectedDistrict;
      
      return matchesZone && matchesDistrict;
    });
    
    // Actualizar el mapa con el primer centro filtrado si está disponible
    if (this.filteredCenters.length > 0 && !this.selectedCenter) {
      this.selectCenter(this.filteredCenters[0]);
    } else if (this.selectedCenter && !this.filteredCenters.some(c => c.id === this.selectedCenter?.id)) {
      this.selectedCenter = null;
      this.updateMapUrl();
    }
  }
  
  selectCenter(center: SupportCenter): void {
    this.selectedCenter = center;
    this.updateMapUrl();
  }
  
  getGoogleMapsLink(center: SupportCenter): string {
    const address = [center.street, center.district, 'Lima', 'Perú']
      .filter(Boolean)
      .join(', ');
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
  }

  updateMapUrl(): void {
    if (!this.selectedCenter) {
      this.mapUrl = '';
      return;
    }
    
    const { street, district } = this.selectedCenter;
    
    // Construir la dirección completa con calle y distrito
    const fullAddress = [street, district, 'Lima', 'Peru']
      .filter(Boolean) // Elimina valores nulos o vacíos
      .join(', ');
    
    // Codificar la dirección para la URL
    const encodedAddress = encodeURIComponent(fullAddress);
    const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);
  }
  
  clearFilters(): void {
    this.selectedZone = 'Todas las zonas';
    this.selectedDistrict = '';
    this.updateFilters();
  }

  // Método para formatear el nombre del distrito reemplazando guiones bajos por espacios
  formatDistrictName(district: string): string {
    return district ? district.replace(/_/g, ' ') : '';
  }
}
