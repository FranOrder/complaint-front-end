export interface SupportCenter {
  id?: number;
  name: string;
  street: string;
  district: string;
  phone: string;
  email: string;
  schedule: string;
  isActive: boolean;  // Standardized to isActive
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

  // 🔹 Acepta ambos nombres posibles (para compatibilidad)
  active?: boolean;
  isActive?: boolean;

  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const DISTRICTS = [
  // Lima Centro
  { label: 'Lima Cercado', value: 'LIMA' },
  { label: 'Breña', value: 'BREÑA' },
  { label: 'La Victoria', value: 'LA_VICTORIA' },
  { label: 'Rímac', value: 'RIMAC' },

  // Lima Norte
  { label: 'Carabayllo', value: 'CARABAYLLO' },
  { label: 'Comas', value: 'COMAS' },
  { label: 'Independencia', value: 'INDEPENDENCIA' },
  { label: 'Los Olivos', value: 'LOS_OLIVOS' },
  { label: 'Puente Piedra', value: 'PUENTE_PIEDRA' },
  { label: 'San Martín de Porres', value: 'SAN_MARTIN_DE_PORRES' },

  // Lima Este
  { label: 'Ate', value: 'ATE' },
  { label: 'Cieneguilla', value: 'CIENEGUILLA' },
  { label: 'El Agustino', value: 'EL_AGUSTINO' },
  { label: 'San Juan de Lurigancho', value: 'SAN_JUAN_DE_LURIGANCHO' },
  { label: 'San Luis', value: 'SAN_LUIS' },
  { label: 'Santa Anita', value: 'SANTA_ANITA' },

  // Lima Sur
  { label: 'Barranco', value: 'BARRANCO' },
  { label: 'Chorrillos', value: 'CHORRILLOS' },
  { label: 'Pachacámac', value: 'PACHACAMAC' },
  { label: 'Punta Hermosa', value: 'PUNTA_HERMOSA' },
  { label: 'Punta Negra', value: 'PUNTA_NEGRA' },
  { label: 'San Juan de Miraflores', value: 'SAN_JUAN_DE_MIRAFLORES' },
  { label: 'Villa El Salvador', value: 'VILLA_EL_SALVADOR' },
  { label: 'Villa María del Triunfo', value: 'VILLA_MARIA_DEL_TRIUNFO' },

  // Lima Moderna
  { label: 'Jesús María', value: 'JESUS_MARIA' },
  { label: 'Lince', value: 'LINCE' },
  { label: 'Magdalena del Mar', value: 'MAGDALENA_DEL_MAR' },
  { label: 'Miraflores', value: 'MIRAFLORES' },
  { label: 'Pueblo Libre', value: 'PUEBLO_LIBRE' },
  { label: 'San Borja', value: 'SAN_BORJA' },
  { label: 'San Isidro', value: 'SAN_ISIDRO' },
  { label: 'San Miguel', value: 'SAN_MIGUEL' },
  { label: 'Santiago de Surco', value: 'SANTIAGO_DE_SURCO' },
  { label: 'Surquillo', value: 'SURQUILLO' },

  // Callao
  { label: 'Callao', value: 'CALLAO' }
] as const;


export const DISTRICT_ZONES: { [key: string]: string } = {
  'LIMA': 'Lima Centro',
  'BREÑA': 'Lima Centro',
  'LA_VICTORIA': 'Lima Centro',
  'RIMAC': 'Lima Centro',
  'CARABAYLLO': 'Lima Norte',
  'COMAS': 'Lima Norte',
  'INDEPENDENCIA': 'Lima Norte',
  'LOS_OLIVOS': 'Lima Norte',
  'PUENTE_PIEDRA': 'Lima Norte',
  'SAN_MARTIN_DE_PORRES': 'Lima Norte',
  'ATE': 'Lima Este',
  'CIENEGUILLA': 'Lima Este',
  'EL_AGUSTINO': 'Lima Este',
  'SAN_JUAN_DE_LURIGANCHO': 'Lima Este',
  'SAN_LUIS': 'Lima Este',
  'SANTA_ANITA': 'Lima Este',
  'BARRANCO': 'Lima Sur',
  'CHORRILLOS': 'Lima Sur',
  'PACHACAMAC': 'Lima Sur',
  'PUNTA_HERMOSA': 'Lima Sur',
  'PUNTA_NEGRA': 'Lima Sur',
  'SAN_JUAN_DE_MIRAFLORES': 'Lima Sur',
  'VILLA_EL_SALVADOR': 'Lima Sur',
  'VILLA_MARIA_DEL_TRIUNFO': 'Lima Sur',
  'JESUS_MARIA': 'Lima Moderna',
  'LINCE': 'Lima Moderna',
  'MAGDALENA_DEL_MAR': 'Lima Moderna',
  'MIRAFLORES': 'Lima Moderna',
  'PUEBLO_LIBRE': 'Lima Moderna',
  'SAN_BORJA': 'Lima Moderna',
  'SAN_ISIDRO': 'Lima Moderna',
  'SAN_MIGUEL': 'Lima Moderna',
  'SANTIAGO_DE_SURCO': 'Lima Moderna',
  'SURQUILLO': 'Lima Moderna',
  'CALLAO': 'Callao'
};

export type District = typeof DISTRICTS[number]['value'];