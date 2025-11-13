import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { UserResponse, UserRole, UserFilters } from '../../../models/user.model';
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

  // Data Loading
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
    this.currentPage = 1; // Reset to first page when filters change
    this.loadUsers();
  }

  // Filtering
  applyFilters(): void {
    const formValue = this.searchForm.value;
    let filtered = [...this.users];
    
    // Filter by role if selected
    if (formValue.role) {
      filtered = filtered.filter(u => u.role === formValue.role);
    }
    
    // Filter by search term if provided
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

  // User Selection
  selectUser(user: UserResponse): void {
    this.selectedUser = this.selectedUser?.id === user.id ? null : user;
  }

  isSelected(userId: number): boolean {
    return this.selectedUser?.id === userId;
  }

  // Form Actions
  onAddNew(): void {
    this.selectedUser = null;
    this.isEditing = false;
    this.isFormVisible = true;
  }

  onEdit(): void {
    if (!this.selectedUser) return;
    this.isEditing = true;
    this.isFormVisible = true;
  }

  // User Management
  createUser(userData: any): void {
    this.isLoading = true;
    this.userService.createUser({
      ...userData,
      role: 'ADMIN' // Force ADMIN role as per business rule
    } as any)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: () => {
        this.showSuccess('Usuario administrador creado correctamente');
        this.loadUsers();
        this.cancelEdit();
      },
      error: (error) => this.showError('Error al crear el usuario administrador')
    });
  }



  cancelEdit(): void {
    this.isFormVisible = false;
    this.isEditing = false;
    this.selectedUser = null;
  }

  // UI Helpers
  private showSuccess(message: string): void {
    this.showToastMessage(message, 'success');
  }

  private showError(message: string): void {
    this.showToastMessage(message, 'danger');
  }

  private showToastMessage(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  // Track by function for ngFor
  trackById(index: number, item: UserResponse): number {
    return item.id;
  }

  // Get user full name
  getFullName(user: UserResponse): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  // Get role label
  getRoleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Víctima';
  }
}