export type UserRole = 'ADMIN' | 'VICTIM';

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse extends UserProfile {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  isActive?: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  searchTerm?: string;
  role?: UserRole | '';
  isActive?: boolean | '';
}
