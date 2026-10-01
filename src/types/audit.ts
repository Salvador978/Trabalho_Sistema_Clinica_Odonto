/**
 * DOMÍNIO DE AUDITORIA & CONFORMIDADE LGPD / CFM / CFO (CLÍNICA ÚNICA)
 * Gerencia Odonto
 */

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SIGN';

export interface AuditContext {
  userId: string;
  patientId?: string;
  ipAddress: string;
  userAgent: string;
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  patientId?: string;
  action: AuditAction;
  resourceType: 'PATIENT' | 'CLINICAL_RECORD' | 'ODONTOGRAM' | 'APPOINTMENT' | 'FINANCIAL' | 'PRESCRIPTION';
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  oldState?: Record<string, any>;
  newState?: Record<string, any>;
  createdAt: string;
}

export interface SignedRecordAddendum {
  id: string;
  clinicalRecordId: string;
  authorDentistId: string;
  authorName: string;
  authorCro: string;
  justification: string;
  addendumText: string;
  signedAt: string;
  signatureHashSha256: string;
}
