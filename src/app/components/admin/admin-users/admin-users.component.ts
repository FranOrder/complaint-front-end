import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { UserResponse, UserRole, UserFilters, CreateUserRequest, UpdateProfileRequest } from '../../../models/user.model';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, ReactiveFormsModule],
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  // Data
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  selectedUser: UserResponse | null = null;
  newAdmin: Omit<CreateUserRequest, 'role'> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  };
  isCreatingAdmin = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // UI State
  isLoading = false;
  isFormVisible = false;
  isEditing = false;
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'warning' | 'info' = 'info';
  
  // Search and Filters
  searchForm: FormGroup;
  filters: UserFilters = {};

  // Constants
  readonly ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'VICTIM', label: 'Víctima' }
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      searchTerm: [''],
      role: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading = true;
    const formValue = this.searchForm.value;
    
    this.userService.getAllUsers(formValue.role)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilters();
        },
        error: () => this.showError('Error al cargar los usuarios')
      });
  }

  private filterBySearchTerm(users: UserResponse[], term: string): UserResponse[] {
    if (!term) return users;
    
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }


  formatDate(dateString: string | null): string {
    if (!dateString) return 'No especificada';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }


  onFilterClick(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    let filtered = [...this.users];
    
    if (formValue.role) {
      filtered = filtered.filter(u => u.role === formValue.role);
    }
    
    if (formValue.searchTerm) {
      const term = formValue.searchTerm.toLowerCase().trim();
      filtered = this.filterBySearchTerm(filtered, term);
    }
    
    this.filteredUsers = filtered;
    this.totalItems = filtered.length;
  }


  clearFilters(): void {
    this.searchForm.reset({
      searchTerm: '',
      role: ''
    });
    this.currentPage = 1;
    this.loadUsers();
  }


  getPageNumbers(): number[] {
    const pageCount = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  get startItemNumber(): number {
    return ((this.currentPage - 1) * this.itemsPerPage) + 1;
  }

  get endItemNumber(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  selectUser(user: UserResponse): void {
    this.selectedUser = this.selectedUser?.id === user.id ? null : user;
  }

  isSelected(userId: number): boolean {
    return this.selectedUser?.id === userId;
  }

  onAddNew(): void {
    this.isCreatingAdmin = true;
    this.newAdmin = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: ''
    };
  }

  onEditUser(user: UserResponse): void {
    this.selectedUser = { ...user };
    this.isFormVisible = true;
  }

  onUpdateProfile(): void {
    if (!this.selectedUser) return;

    const updateData: UpdateProfileRequest = {
      firstName: this.selectedUser.firstName,
      lastName: this.selectedUser.lastName,
      phone: this.selectedUser.phone
    };

    this.isLoading = true;
    this.userService.updateUserProfile(this.selectedUser.id, updateData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          const index = this.users.findIndex(u => u.id === this.selectedUser?.id);
          if (index !== -1 && this.selectedUser) {
            this.users[index] = { 
              ...this.users[index],
              firstName: updateData.firstName,
              lastName: updateData.lastName,
              phone: updateData.phone,
              updatedAt: new Date().toISOString() 
            };
            this.filteredUsers = [...this.users];
          }
          this.showSuccess('Perfil actualizado exitosamente');
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.showError('Error al actualizar el perfil');
        }
      });
  }

  onCreateAdmin(): void {
    if (!this.newAdmin.firstName || !this.newAdmin.lastName || !this.newAdmin.email || !this.newAdmin.password) {
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;
    this.userService.createAdmin(this.newAdmin).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showSuccess('Administrador creado exitosamente');
        this.isCreatingAdmin = false;
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error creating admin:', error);
        this.showError('Error al crear el administrador');
      }
    });
  }

  cancelCreateAdmin(): void {
    this.isCreatingAdmin = false;
  }

  onEdit(): void {
    if (!this.selectedUser) return;
    this.isEditing = true;
    this.isFormVisible = true;
  }

  cancelEdit(): void {
    this.isFormVisible = false;
    this.isEditing = false;
    this.selectedUser = null;
  }

  private showToastMessage(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  showSuccess(message: string): void {
    this.showToastMessage(message, 'success');
  }

  showError(message: string): void {
    this.showToastMessage(message, 'danger');
  }

  trackById(index: number, item: UserResponse): number {
    return item.id;
  }
  getFullName(user: UserResponse): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getRoleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Víctima';
  }
}