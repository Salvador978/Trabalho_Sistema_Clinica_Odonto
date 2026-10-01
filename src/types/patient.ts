/**
 * MODELO DE DOMÍNIO DE PACIENTES & CONFORMIDADE REGULATÓRIA
 * Em conformidade com CFO, LGPD, ANVISA e Receita Federal (DMED / Carnê-Leão).
 */

export type ClinicalStatus = 'IN_TREATMENT' | 'CLINICAL_DISCHARGE' | 'RECALL_DUE';

export interface MedicalAlerts {
  hypertension: boolean;
  diabetes: boolean;
  anticoagulant: boolean;
  allergicPenicillin: boolean;
  allergicAnesthetics: boolean;
  allergicDipyroneNSAIDs: boolean;
  pregnantOrLactating: boolean;
  otherConditions?: string;
  allergies?: string[];
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  rg?: string;
  rgIssuer?: string;
  birthDate: string; // ISO formato YYYY-MM-DD
  gender?: 'FEMALE' | 'MALE' | 'OTHER';
  profession?: string;

  // Contato
  phone: string; // WhatsApp / Celular principal no formato (00) 00000-0000
  secondaryPhone?: string; // Telefone do contato de emergência no formato (00) 00000-0000
  emergencyContactName?: string; // Nome e parentesco do contato de emergência (ex: Esposa, Mãe)
  email?: string;

  // Endereço (com integração ViaCEP)
  cep?: string;
  address?: string; // Logradouro (Rua, Av, etc)
  number?: string;
  complement?: string;
  neighborhood?: string; // Bairro
  city?: string;
  state?: string; // UF

  // Responsável Financeiro (DMED / Receita Federal para Dependentes e Menores)
  hasFinancialResponsible?: boolean;
  financialResponsibleName?: string;
  financialResponsibleCpf?: string;
  financialResponsibleRelationship?: string; // Pai, Mãe, Cônjuge, Responsável Legal

  // Alertas Médicos Críticos Iniciais
  medicalAlerts: MedicalAlerts;

  // Acompanhamento Clínico & Plano de Tratamento Orçado
  status: ClinicalStatus;
  lastAppointmentDate?: string;
  notes?: string;

  // Itens de tratamento planejados / executados pelo dentista com valores
  treatmentItems?: PatientTreatmentItem[];
  pendingBudgetAmount?: number;
  version?: number;

  createdAt: string;
  updatedAt: string;
}

export interface PatientTreatmentItem {
  id: string;
  procedureId?: string;
  procedureName: string;
  name?: string; // Alias para procedureName
  toothNumber?: number;
  surface?: string;
  price: number;
  layer: 'TREATMENT_PLAN' | 'COMPLETED';
  status: 'PENDING' | 'EXECUTED' | 'PAID';
  dentistName?: string;
  createdAt: string;
}


/**
 * Calcula a idade com precisão considerando ano, mês e dia
 */
export const calculateAge = (birthDateStr?: string): number | null => {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
};

/**
 * Máscara formatadora de CPF: 000.000.000-00
 */
export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

/**
 * Validação algorítmica dos dígitos verificadores do CPF
 */
export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // Bloqueia 000.000.000-00, 111.111.111-11, etc.

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(digits.charAt(10), 10);
};

/**
 * Máscara formatadora de Telefone/WhatsApp: (00) 00000-0000 ou (00) 0000-0000
 */
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

/**
 * Máscara formatadora de CEP: 00000-000
 */
export const formatCEP = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};
