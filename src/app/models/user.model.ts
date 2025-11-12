export type UserRole = 'ADMIN' | 'VICTIM';

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
 
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
 
}

export interface UserFilters {
  searchTerm?: string;
  role?: UserRole | '';
}
