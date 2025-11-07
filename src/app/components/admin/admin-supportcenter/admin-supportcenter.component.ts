import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';

interface SupportCenter {
  id: number;
  name: string;
  address: string;
  district: string;
  phone: string;
  email: string;
  description: string;
  // Add other fields as needed
}

@Component({
  selector: 'app-admin-supportcenter',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './admin-supportcenter.component.html',
  styleUrls: ['./admin-supportcenter.component.css']
})
export class AdminSupportCenterComponent implements OnInit {
  supportCenters: SupportCenter[] = [];
  selectedSupportCenter: SupportCenter | null = null;
  isEditing = false;
  newSupportCenter: Partial<SupportCenter> = {};
  districts: string[] = ['Lima', 'Ate', 'Barranco', 'Breña', 'Comas', 'La Molina', 'La Victoria', 'Lince', 'Magdalena', 'Miraflores', 'Pueblo Libre', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Miguel', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSupportCenters();
  }

  loadSupportCenters(): void {
    this.http.get<SupportCenter[]>(`${environment.apiUrl}/support-centers`)
      .subscribe({
        next: (data) => this.supportCenters = data,
        error: (error) => console.error('Error loading support centers:', error)
      });
  }

  createSupportCenter(): void {
    this.http.post<SupportCenter>(`${environment.apiUrl}/support-centers/create`, this.newSupportCenter)
      .subscribe({
        next: () => {
          this.loadSupportCenters();
          this.newSupportCenter = {};
        },
        error: (error) => console.error('Error creating support center:', error)
      });
  }

  editSupportCenter(supportCenter: SupportCenter): void {
    this.selectedSupportCenter = { ...supportCenter };
    this.isEditing = true;
  }

  updateSupportCenter(): void {
    if (!this.selectedSupportCenter) return;
    
    this.http.put<SupportCenter>(`${environment.apiUrl}/support-centers/${this.selectedSupportCenter.id}/edit`, this.selectedSupportCenter)
      .subscribe({
        next: () => {
          this.loadSupportCenters();
          this.cancelEdit();
        },
        error: (error) => console.error('Error updating support center:', error)
      });
  }

  deleteSupportCenter(id: number): void {
    if (confirm('¿Estás seguro de eliminar este centro de ayuda?')) {
      this.http.delete(`${environment.apiUrl}/support-centers/${id}/delete`)
        .subscribe({
          next: () => this.loadSupportCenters(),
          error: (error) => console.error('Error deleting support center:', error)
        });
    }
  }

  cancelEdit(): void {
    this.selectedSupportCenter = null;
    this.isEditing = false;
  }
}
