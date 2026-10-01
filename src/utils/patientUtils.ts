import { Patient, calculateAge } from '../types/patient';

export interface ActivePatientInfo {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  medicalAlerts: {
    hypertension: boolean;
    diabetes: boolean;
    anticoagulant: boolean;
    allergies: string[];
  };
}

export function buildActivePatientFromRecord(patient: Patient): ActivePatientInfo {
  const age = calculateAge(patient.birthDate);
  const formattedDate = `${patient.birthDate ? patient.birthDate.split('-').reverse().join('/') : ''} (${age !== null ? `${age} anos` : 'Idade não informada'})`;

  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    phone: patient.phone,
    birthDate: formattedDate,
    medicalAlerts: {
      hypertension: patient.medicalAlerts?.hypertension ?? false,
      diabetes: patient.medicalAlerts?.diabetes ?? false,
      anticoagulant: patient.medicalAlerts?.anticoagulant ?? false,
      allergies: patient.medicalAlerts?.allergies || []
    }
  };
}

