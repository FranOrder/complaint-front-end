import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { ComplaintService } from '../../../services/complaint.service';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/user.model';
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

fullName: '',
email: '',
phone: '',
role: 'VICTIM' as const,
};

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
      this.user = {
        fullName: profile.fullName || '',
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
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
  complaint.isExpanded = !complaint.isExpanded;

  if (complaint.isExpanded && complaint.id) {
    this.complaintService.getComplaintById(complaint.id).subscribe({
      next: (details) => {
        complaint.description = details.description;
        complaint.status = details.status;
        complaint.violenceType = details.violenceType;
        complaint.incidentDate = details.incidentDate;
        complaint.createdAt = details.createdAt;
        complaint.incidentLocation = details.incidentLocation;
        complaint.aggressor = details.aggressor;
        complaint.evidences = details.evidences || [];
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

 const [firstName, ...rest] = (this.user.fullName || '').split(' ');
  const lastName = rest.join(' ') || 'Desconocido';

  const updateData = {
    firstName,
    lastName,
    phone: this.phoneForm.value.phone
  };

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
}
