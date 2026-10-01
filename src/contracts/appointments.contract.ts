/**
 * CONTRATOS DE API & DTOs: AGENDAMENTO DO CONSULTÓRIO
 * Consultório de Dentista Autônomo + Recepcionista
 */

import { AppointmentStatus, ALLOWED_STATUS_TRANSITIONS } from '../types/appointment';

export interface CreateAppointmentDTO {
  patientId: string;
  startTime: string; // ISO 8601 UTC
  estimatedDurationMin: number; // Ex: 15, 30, 45, 60 minutos
  proceduresSummary?: string;
  notes?: string;
  triggerWhatsappConfirmation?: boolean;
}

export interface UpdateAppointmentStatusDTO {
  newStatus: AppointmentStatus;
  cancellationReason?: string;
  notes?: string;
}

export interface AppointmentConflictErrorResponse {
  statusCode: 409;
  error: 'Conflict';
  message: string;
  conflictDetails: {
    conflictingTimeRange: {
      start: string;
      end: string;
    };
    conflictingAppointmentId: string;
    patientName?: string;
  };
}

export interface AppointmentListQueryDTO {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status?: AppointmentStatus;
}

/**
 * Validador de Transição da Máquina de Estados da Agenda
 */
export function validateAppointmentStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): { isValid: boolean; error?: string } {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus)) {
    return {
      isValid: false,
      error: `Transição inválida de status: de '${currentStatus}' para '${nextStatus}'. Transições permitidas: ${allowed.join(', ') || 'Nenhuma (estado terminal)'}.`
    };
  }

  return { isValid: true };
}
