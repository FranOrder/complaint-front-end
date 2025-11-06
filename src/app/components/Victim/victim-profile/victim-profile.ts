import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

// Services
import { AuthService } from '../../../services/auth.service';
import { ComplaintService } from '../../../services/complaint.service';

interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string;
  fullName?: string;
}

interface Complaint {
  id?: number;
  description: string;
  status: string;
  violenceType: string;
  incidentDate: string | null;
  incidentLocation?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isExpanded?: boolean;
  aggressor?: {
    fullName: string;
    relationship?: string | null;
    additionalDetails?: string | null;
  };
  aggressorFullName?: string;
  aggressorRelationship?: string | null;
  aggressorAdditionalDetails?: string | null;
  evidences?: Array<{
    id: number;
    url: string;
    type: string;
  }>;
}

@Component({
  selector: 'app-victim-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgbAlertModule],
  templateUrl: './victim-profile.html',
  styleUrls: ['./victim-profile.css']
})
export class VictimProfileComponent implements OnInit {
  user: User | null = null;
  complaints: Complaint[] = [];
  loading = false;
  error = '';
  success = '';
  isEditingPhone = false;
  
  profileForm: FormGroup;
  phoneForm: FormGroup;

  constructor(
    private authService: AuthService,
    private complaintService: ComplaintService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]]
    });
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadComplaints();
  }

  private loadUserData(): void {
    this.loading = true;
    const userData = this.authService.getUserInfo();
    
    if (userData) {
      this.user = {
        id: userData.id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || null,
        role: userData.role || 'VICTIM',
        fullName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
      };
      
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone || ''
      });
      
      this.phoneForm.patchValue({
        phone: this.user.phone || ''
      });
    }
    
    this.loading = false;
  }

loadComplaints(): void {
  this.loading = true;
  this.complaintService.getComplaints().subscribe({
    next: (complaints) => {
      this.complaints = complaints.map(c => {
        if (c.id === undefined) {
          throw new Error('Received complaint without an ID');
        }
        return {
          ...c,
          status: c.status || 'pending', // Add default status if undefined
          incidentLocation: c.incidentLocation || undefined,
          isExpanded: false
        };
      });
      this.loading = false;
    },
    error: (error) => {
      console.error('Error loading complaints:', error);
      this.error = 'Error al cargar las denuncias';
      this.loading = false;
    }
  });
}

  toggleComplaintDetails(complaint: Complaint): void {
    complaint.isExpanded = !complaint.isExpanded;
  }

  toggleEditPhone(): void {
    this.isEditingPhone = !this.isEditingPhone;
    if (this.isEditingPhone) {
      this.phoneForm.patchValue({ phone: this.user?.phone || '' });
    }
  }

  onUpdatePhone(): void {
    if (this.phoneForm.invalid || !this.user) return;

    this.loading = true;
    const newPhone = this.phoneForm.value.phone;
    
    // Here you would typically call a service to update the phone
    // For now, we'll just update the local state
    if (this.user) {
      this.user.phone = newPhone;
      this.profileForm.patchValue({ phone: newPhone });
      this.isEditingPhone = false;
      this.success = 'Teléfono actualizado correctamente';
    }
    
    this.loading = false;
  }

  onSubmitProfile(): void {
    if (this.profileForm.invalid || !this.user) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    // In a real app, you would call a service to update the profile
    // For now, we'll just update the local state
    if (this.user) {
      this.user = {
        ...this.user,
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        email: this.profileForm.value.email,
        phone: this.profileForm.value.phone || null,
        fullName: `${this.profileForm.value.firstName} ${this.profileForm.value.lastName}`.trim()
      };
      
      this.success = 'Perfil actualizado correctamente';
    }
    
    this.loading = false;
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Desconocido';
    const statusMap: {[key: string]: string} = {
      'PENDING': 'Pendiente',
      'UNDER_REVIEW': 'En revisión',
      'ACTION_TAKEN': 'En proceso',
      'CLOSED': 'Cerrado',
      'REJECTED': 'Rechazado'
    };
    return statusMap[status] || status;
  }

  getViolenceTypeLabel(type: string | undefined): string {
    if (!type) return 'No especificado';
    const typeMap: {[key: string]: string} = {
      'PHYSICAL': 'Física',
      'PSYCHOLOGICAL': 'Psicológica',
      'EMOTIONAL': 'Emocional',
      'SEXUAL': 'Sexual',
      'ECONOMIC': 'Económica',
      'DIGITAL': 'Digital',
      'OTHER': 'Otra'
    };
    return typeMap[type] || type;
  }

  // Helper getters for template
  get profileFormControls() {
    return this.profileForm.controls;
  }

  get phoneFormControls() {
    return this.phoneForm.controls;
  }
}
