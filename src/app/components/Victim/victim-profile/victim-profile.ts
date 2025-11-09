import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

// Services
import { AuthService } from '../../../services/auth.service';
import { ComplaintService } from '../../../services/complaint.service';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/user.model';

// Models
import { Complaint, STATUS_LABELS, VIOLENCE_TYPE_LABELS, RELATIONSHIP_LABELS } from '../../../models/complaint.model';

@Component({
  selector: 'app-victim-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgbAlertModule],
  templateUrl: './victim-profile.html',
  styleUrls: ['./victim-profile.css']
})

export class VictimProfileComponent implements OnInit {
  
  complaints: Complaint[] = [];
  isLoading = false;
  isEditingPhone = false;
  error: string | null = null;
  success: string | null = null;
  
user: UserProfile = {
  id: 0,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'VICTIM' as const,
  isActive: true,
  createdAt: '',
  updatedAt: ''
};

  get fullName(): string {
    return this.user ? `${this.user.firstName} ${this.user.lastName}`.trim() : '';
  }
  phoneForm!: FormGroup;

  constructor(
    private userService: UserService,
    private complaintService: ComplaintService,
    private fb: FormBuilder,
  ) { }

  ngOnInit(): void {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9,15}$')]]
    });

    this.loadUserProfile();
    this.loadUserComplaints();
  }


private loadUserProfile(): void {
  this.isLoading = true;
  this.userService.getProfile().subscribe({
    next: (profile: any) => {
      console.log('Respuesta del perfil:', profile);

      // 👇 Descomponer el fullName en firstName y lastName
      const [firstName, ...rest] = (profile.fullName || '').split(' ');
      const lastName = rest.join(' ');

      // 👇 Reasignar correctamente al modelo UserProfile
      this.user = {
        id: profile.id || 0,
        firstName: firstName || '',
        lastName: lastName || '',
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        isActive: profile.isActive !== undefined ? profile.isActive : true,
        createdAt: profile.createdAt || '',
        updatedAt: profile.updatedAt || ''
      };

      this.phoneForm.patchValue({ phone: this.user.phone });
      this.isLoading = false;
    },
    error: () => {
      this.error = 'Error al cargar el perfil del usuario';
      this.isLoading = false;
    }
  });
}


 private loadUserComplaints(): void {
  this.isLoading = true;
  this.complaintService.getComplaints().subscribe({
    next: (complaints) => {
      this.complaints = complaints.map(c => ({
        ...c,
        isExpanded: false
      }));
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading complaints:', error);
      this.error = 'Error al cargar las denuncias';
      this.isLoading = false;
    }
  });
}

 toggleComplaintDetails(complaint: Complaint): void {
  // Alternar el estado expandido
  complaint.isExpanded = !complaint.isExpanded;

  // Si lo acaba de expandir, cargamos los detalles desde el backend
  if (complaint.isExpanded && complaint.id) {
    this.complaintService.getComplaintById(complaint.id).subscribe({
      next: (details) => {
        // Mezclamos los datos existentes con los del backend (detallados)
        complaint.description = details.description;
        complaint.status = details.status;
        complaint.violenceType = details.violenceType;
        complaint.incidentDate = details.incidentDate;
        complaint.createdAt = details.createdAt;
        complaint.incidentLocation = details.incidentLocation;

        // 👇 Si tu backend devuelve agresor o evidencias, las asignamos también
        complaint.aggressor = details.aggressor;
        complaint.evidences = details.evidences || [];

        console.log('Detalles cargados para denuncia', complaint.id, details);
      },
      error: (error) => {
        console.error('Error al cargar detalles de la denuncia:', error);
      }
    });
  }
}

  toggleEditPhone(): void {
    if (!this.user) {
      this.error = 'Los datos del usuario no están disponibles. Por favor, recargue la página.';
      return;
    }
    
    this.isEditingPhone = !this.isEditingPhone;
    if (this.isEditingPhone) {
      this.phoneForm.patchValue({
        phone: this.user.phone || ''
      });
    }
  }

onUpdatePhone(): void {
  if (this.phoneForm.invalid || !this.user) return;

  const userId = this.userService.getCurrentUserId();
  if (!userId) {
    this.error = 'No se pudo obtener el ID del usuario';
    return;
  }

  this.isLoading = true;
  this.error = null;
  this.success = null;

  // Use the existing user's first and last name, or 'Desconocido' if they're not set
  const firstName = this.user.firstName?.trim() || 'Desconocido';
  const lastName = this.user.lastName?.trim() || 'Desconocido';

  const updateData = {
    firstName,
    lastName,
    phone: this.phoneForm.value.phone
  };

  console.log('Payload que se enviará:', updateData);

  this.userService.updateProfile(userId, updateData).subscribe({
    next: (updatedUser) => {
      this.user = updatedUser;
      this.isEditingPhone = false;
      this.success = 'Teléfono actualizado correctamente';
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error updating profile:', error);
      this.error = 'Error al actualizar el teléfono';
      this.isLoading = false;
    }
  });
}




  get phone() { return this.phoneForm.get('phone'); }

  getStatusLabel(status: string | undefined): string {
    return status ? STATUS_LABELS[status] || status : 'Desconocido';
  }

  getViolenceTypeLabel(type: string | undefined): string {
    return type ? VIOLENCE_TYPE_LABELS[type] || type : 'No especificado';
  }

  getRelationshipLabel(relation: string | undefined): string {
    return relation ? RELATIONSHIP_LABELS[relation] || relation : 'No especificado';
  }
  //#endregion
}
