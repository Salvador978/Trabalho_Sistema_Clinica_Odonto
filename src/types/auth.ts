export interface ClinicAccount {
  id: string;
  name: string;
  login: string;
  password: string;
  dentistName: string;
  dentistCro: string;
  receptionistName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  plan: 'ESSENTIAL' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  createdAt: string;
}

export type UserRole = 'DENTIST' | 'RECEPTIONIST';

export interface ClinicSession {
  clinicId: string;
  clinicName: string;
  dentistName: string;
  dentistCro: string;
  login: string;
  loggedAt: string;
  role: UserRole;
}

export interface NewClinicPayload {
  name: string;
  dentistName: string;
  dentistCro: string;
  login: string;
  password: string;
  phone?: string;
  city?: string;
  state?: string;
}
