import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// Mapeo de distritos a sus zonas
export const DISTRICT_ZONES: {[key: string]: string} = {
  'LIMA': 'Lima Centro',
  'BREÑA': 'Lima Centro',
  'LA_VICTORIA': 'Lima Centro',
  'RIMAC': 'Lima Centro',
  'CARABAYLLO': 'Lima Norte',
  'COMAS': 'Lima Norte',
  'INDEPENDENCIA': 'Lima Norte',
  'LOS_OLIVOS': 'Lima Norte',
  'PUENTE_PIEDRA': 'Lima Norte',
  'SAN_MARTIN_DE_PORRES': 'Lima Norte',
  'ATE': 'Lima Este',
  'CIENEGUILLA': 'Lima Este',
  'EL_AGUSTINO': 'Lima Este',
  'SAN_JUAN_DE_LURIGANCHO': 'Lima Este',
  'SAN_LUIS': 'Lima Este',
  'SANTA_ANITA': 'Lima Este',
  'BARRANCO': 'Lima Sur',
  'CHORRILLOS': 'Lima Sur',
  'PACHACAMAC': 'Lima Sur',
  'PUNTA_HERMOSA': 'Lima Sur',
  'PUNTA_NEGRA': 'Lima Sur',
  'SAN_JUAN_DE_MIRAFLORES': 'Lima Sur',
  'VILLA_EL_SALVADOR': 'Lima Sur',
  'VILLA_MARIA_DEL_TRIUNFO': 'Lima Sur',
  'JESUS_MARIA': 'Lima Moderna',
  'LINCE': 'Lima Moderna',
  'MAGDALENA_DEL_MAR': 'Lima Moderna',
  'MIRAFLORES': 'Lima Moderna',
  'PUEBLO_LIBRE': 'Lima Moderna',
  'SAN_BORJA': 'Lima Moderna',
  'SAN_ISIDRO': 'Lima Moderna',
  'SAN_MIGUEL': 'Lima Moderna',
  'SANTIAGO_DE_SURCO': 'Lima Moderna',
  'SURQUILLO': 'Lima Moderna',
  'CALLAO': 'Callao'
};

type District = keyof typeof DISTRICT_ZONES;

interface SupportCenter {
  id: number;
  name: string;
  street: string;
  district: District;
  phone: string;
  email: string;
  schedule: string;
  is_active: boolean;
  description?: string; // Agregando la propiedad description opcional
  zone?: string; // Agregamos la propiedad zone opcional
}

@Component({
  selector: 'app-victim-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './victim-map.html',
  styleUrls: ['./victim-map.css']
})
export class VictimMapComponent implements OnInit {
  supportCenters: SupportCenter[] = [];
  filteredCenters: SupportCenter[] = [];
  selectedCenter: SupportCenter | null = null;
  
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
  
  loadSupportCenters() {
    this.http.get<SupportCenter[]>(`${environment.apiUrl}/api/v1/support-centers`).subscribe({
      next: (data) => {
        console.log('Datos recibidos del backend:', JSON.stringify(data, null, 2));
        this.supportCenters = data;
        this.filteredCenters = [...this.supportCenters];
        this.updateFilters();
        
        // Select first center by default if available
        if (this.filteredCenters.length > 0) {
          console.log('Primer centro:', JSON.stringify(this.filteredCenters[0], null, 2));
          this.selectCenter(this.filteredCenters[0]);
        }
      },
      error: (error) => {
        console.error('Error loading support centers:', error);
        if (error.status === 403) {
          console.error('Access forbidden. Please check your authentication.');
        }
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
