// admin-users.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserResponse, UserRole, CreateUserRequest, UpdateProfileRequest } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';


const ROLES = [
  { label: 'Administrador', value: 'ADMIN' as UserRole },
  { label: 'Víctima', value: 'VICTIM' as UserRole }
];

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Component state
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  isEditing = false;
  isLoading = false;
  isFormVisible = false;
  
  // Form state
  newUser: Partial<CreateUserRequest> = this.getDefaultUser();
  searchTerm = '';
  selectedRoleFilter: UserRole | '' = '';
  activeStatusFilter: boolean | '' = '';
  
  // UI state
  errorMessage = '';
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  
  // Constants
  readonly ROLES = ROLES;

  constructor(
    private userService: UserService,

  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Data loading
loadUsers(): void {
  this.isLoading = true;
  this.userService.getAllUsers().pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (response: any) => {
      // Handle case where response might be an object with a users property
      this.users = Array.isArray(response) ? response : (response.users || []);
      this.applyFilters();
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error loading users:', error);
      this.showError('Error al cargar los usuarios');
      this.isLoading = false;
    }
  });
}

  // Form handling
  onAddNew(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.newUser = this.getDefaultUser();
    this.isFormVisible = true;
  }

  editUser(user: UserResponse): void {
    this.isEditing = true;
    this.selectedUser = { ...user };
    this.isFormVisible = true;
  }

  cancelEdit(): void {
    this.isFormVisible = false;
    this.selectedUser = null;
    this.errorMessage = '';
  }

  saveUser(): void {
    if (!this.validateForm(this.isEditing ? this.selectedUser! : this.newUser as CreateUserRequest)) {
      return;
    }

    this.isLoading = true;
    
    if (this.isEditing && this.selectedUser) {
      const updateData: UpdateProfileRequest = {
        firstName: this.selectedUser.firstName,
        lastName: this.selectedUser.lastName,
        phone: this.selectedUser.phone
      };

      this.userService.updateProfile(this.selectedUser.id, updateData).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelEdit();
          this.showSuccess('Usuario actualizado correctamente');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.showError('Error al actualizar el usuario');
          this.isLoading = false;
        }
      });
    } else {
      const newUser = this.newUser as CreateUserRequest;
      this.userService.createUser(newUser).subscribe({
        next: () => {
          this.loadUsers();
          this.cancelEdit();
          this.showSuccess('Usuario creado correctamente');
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.showError('Error al crear el usuario');
          this.isLoading = false;
        }
      });
    }
  }

  deleteUser(id: number): void {
    if (!confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    this.isLoading = true;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.loadUsers();
        this.showSuccess('Usuario eliminado correctamente');
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showError('Error al eliminar el usuario');
        this.isLoading = false;
      }
    });
  }



  // Validation
  validateForm(user: Partial<CreateUserRequest>): boolean {
    this.errorMessage = '';

    if (!user.firstName?.trim()) {
      this.errorMessage = 'El nombre es requerido';
      return false;
    }
    if (!user.lastName?.trim()) {
      this.errorMessage = 'El apellido es requerido';
      return false;
    }
    if (!user.email?.trim()) {
      this.errorMessage = 'El correo electrónico es requerido';
      return false;
    }
    if (!this.isEditing && !(user as CreateUserRequest).password) {
      this.errorMessage = 'La contraseña es requerida';
      return false;
    }
    if (!user.phone?.trim()) {
      this.errorMessage = 'El teléfono es requerido';
      return false;
    }
    if (!user.role) {
      this.errorMessage = 'El rol es requerido';
      return false;
    }
    return true;
  }

  // Filtering
applyFilters(): void {
  if (!this.users) return;
  
  this.filteredUsers = this.users.filter(user => {
    const matchesSearch = !this.searchTerm || 
      user.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(this.searchTerm.toLowerCase());


  });
}

  onFilterClick(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRoleFilter = '';
    this.activeStatusFilter = '';
    this.applyFilters();
  }

  // Helpers
  getDefaultUser(): Partial<CreateUserRequest> {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'VICTIM',

    };
  }

  // UI Helpers
  showSuccess(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  showError(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  // For template to track items in ngFor
  trackById(index: number, item: UserResponse): number {
    return item.id;
  }
}