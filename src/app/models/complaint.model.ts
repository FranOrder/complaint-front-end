export interface Aggressor {
  fullName: string;
  relationship?: string | null;
  additionalDetails?: string | null;
}

export interface Evidence {
  id: number;
  url: string;
  type: string;
  filename?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface Complaint {
  id?: number;
  description: string;
  status: string;
  violenceType: string;
  incidentDate: string | null;
  incidentLocation?: string | null;
  aggressorFullName: string;
  aggressorRelationship?: string | null;
  aggressorAdditionalDetails?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isExpanded?: boolean;
  aggressor?: Aggressor;
  evidences?: Evidence[];
  
  // Propiedades para la vista
  victimName?: string;
  victimEmail?: string;
  victimPhone?: string;
  victim?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
}

export const STATUS_LABELS: {[key: string]: string} = {

        'RECEIVED': 'Recibido',
        'IN_REVIEW': 'En revisión',
        'ACTION_TAKEN': 'En proceso',
        'CLOSED': 'Cerrado',
   
};

export const VIOLENCE_TYPE_LABELS: {[key: string]: string} = {
  'PHYSICAL': 'Física',
  'PSYCHOLOGICAL': 'Psicológica',
  'EMOTIONAL': 'Emocional',
  'SEXUAL': 'Sexual',
  'ECONOMIC': 'Económica',
  'DIGITAL': 'Digital',
  'OTHER': 'Otra'
};
export const RELATIONSHIP_LABELS: {[key: string]: string} = {
    
        'FRIEND': 'Amigo',
        'FAMILY': 'Familiar',
        'NEIGHBOUR': 'Vecino',
        'EX_PARTNER': 'Ex pareja',
        'PARTNER': 'Pareja actual',
        'STRANGE': 'Desconocido',
        'OTHER': 'Otro'
    }

