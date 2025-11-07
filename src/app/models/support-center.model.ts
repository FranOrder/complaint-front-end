export interface SupportCenter {
  id?: number;
  name: string;
  street: string;
  district: string;
  phone: string;
  email: string;
  schedule: string;
  isActive?: boolean;  // Keep this for form handling
  active?: boolean;    // Add this to match the API response
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportCenterResponse {
  id: number;
  name: string;
  street: string;
  district: string;
  phone: string;
  email: string;
  schedule: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
