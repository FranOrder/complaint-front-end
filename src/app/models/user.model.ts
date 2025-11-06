
export type UserRole = 'ADMIN' | 'VICTIM';


export interface UserProfile {
  id: number;           // 🔥 Asegúrate de tener esto
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}


