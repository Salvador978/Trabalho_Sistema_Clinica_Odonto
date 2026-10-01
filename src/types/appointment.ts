/**
 * DOMÍNIO DA AGENDA & MÁQUINA DE ESTADOS CLÍNICA
 * Consultório de Dentista Autônomo + Recepcionista
 */

export type AppointmentStatus =
  | 'SCHEDULED'   // Agendado (pela recepção ou online)
  | 'CONFIRMED'   // Confirmado pelo paciente (WhatsApp)
  | 'WAITING_ROOM'// Paciente chegou na sala de espera
  | 'IN_PROGRESS' // Paciente na cadeira com o dentista
  | 'COMPLETED'   // Procedimento finalizado (liberado para acerto/cobrança)
  | 'CANCELLED'   // Cancelamento formal justificado
  | 'NO_SHOW';    // Falta

/**
 * Matriz de Transições Válidas da Máquina de Estados de Agendamento
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ['CONFIRMED', 'WAITING_ROOM', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['WAITING_ROOM', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  WAITING_ROOM: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Finalizado
  CANCELLED: [], // Cancelado
  NO_SHOW: ['SCHEDULED'] // Reagendamento
};

export interface AppointmentSlotCheckRequest {
  startTime: string; // ISO 8601 UTC
  endTime: string;   // ISO 8601 UTC
  excludeAppointmentId?: string;
}

export interface AppointmentSlotCheckResult {
  hasConflict: boolean;
  conflictingAppointment?: {
    id: string;
    patientName: string;
    startTime: string;
    endTime: string;
  };
  message?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  startTime: string;
  endTime: string;
  estimatedDurationMin: number;
  status: AppointmentStatus;
  proceduresSummary?: string;
  notes?: string;
  cancellationReason?: string;
  whatsappConfirmationStatus?: 'NOT_SENT' | 'SENT' | 'DELIVERED' | 'CONFIRMED' | 'DECLINED';
  createdAt: string;
  updatedAt: string;
}
