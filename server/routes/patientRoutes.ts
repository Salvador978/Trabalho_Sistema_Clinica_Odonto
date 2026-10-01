import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest, logAudit } from '../auth.js';
import { Patient, MedicalAlerts } from '../../src/types/patient.js';
import { validateBody, PatientSchema } from '../validation/schemas.js';

export const patientRouter = Router();

patientRouter.use(authMiddleware);

// Máscara segura de CPF para proteção LGPD na recepção
function maskCpf(cpf?: string): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.${clean.substring(3, 6)}.***-**`;
  }
  return '***.***.***-**';
}

function sanitizePatientForReception(p: any): Patient {
  let hasAnyAlert = false;
  try {
    const rawAlerts = JSON.parse(p.medical_alerts_json || '{}');
    hasAnyAlert = Boolean(
      rawAlerts.hypertension ||
      rawAlerts.diabetes ||
      rawAlerts.anticoagulant ||
      rawAlerts.allergicPenicillin ||
      rawAlerts.allergicAnesthetics ||
      rawAlerts.allergicDipyroneNSAIDs ||
      rawAlerts.pregnantOrLactating ||
      (rawAlerts.allergies && rawAlerts.allergies.length > 0) ||
      rawAlerts.otherConditions
    );
  } catch {}

  // Contrato MedicalAlerts preservado, porém sem dados sensíveis de saúde transmitidos
  const neutralizedAlerts: MedicalAlerts = {
    hypertension: false,
    diabetes: false,
    anticoagulant: false,
    allergicPenicillin: false,
    allergicAnesthetics: false,
    allergicDipyroneNSAIDs: false,
    pregnantOrLactating: false,
    otherConditions: hasAnyAlert ? 'Paciente possui alerta de saúde cadastrado (Acesso restrito ao Dentista).' : undefined,
    allergies: []
  };

  let treatmentItems = [];
  try {
    treatmentItems = JSON.parse(p.treatment_items_json || '[]');
  } catch {}

  return {
    id: p.id,
    name: p.name,
    cpf: maskCpf(p.cpf),
    rg: p.rg ? 'Confidencial' : undefined,
    rgIssuer: p.rg_issuer,
    birthDate: p.birth_date,
    gender: p.gender,
    profession: p.profession,
    phone: p.phone,
    secondaryPhone: p.secondary_phone,
    emergencyContactName: p.emergency_contact_name,
    email: p.email,
    cep: p.cep,
    address: p.address,
    number: p.number,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    hasFinancialResponsible: Boolean(p.has_financial_responsible),
    financialResponsibleName: p.financial_responsible_name,
    financialResponsibleCpf: maskCpf(p.financial_responsible_cpf),
    financialResponsibleRelationship: p.financial_responsible_relationship,
    medicalAlerts: neutralizedAlerts,
    status: p.status,
    lastAppointmentDate: p.last_appointment_date,
    notes: p.notes ? 'Dados clínicos confidenciais (Art. 5° CFO-118/2012 / LGPD)' : undefined,
    treatmentItems,
    pendingBudgetAmount: Number(p.pending_budget_amount || 0),
    version: p.version || 1,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

function parsePatientFull(p: any): Patient {
  let medicalAlerts: MedicalAlerts = {
    hypertension: false,
    diabetes: false,
    anticoagulant: false,
    allergicPenicillin: false,
    allergicAnesthetics: false,
    allergicDipyroneNSAIDs: false,
    pregnantOrLactating: false,
    allergies: []
  };
  try {
    medicalAlerts = { ...medicalAlerts, ...JSON.parse(p.medical_alerts_json || '{}') };
  } catch {}

  let treatmentItems = [];
  try {
    treatmentItems = JSON.parse(p.treatment_items_json || '[]');
  } catch {}

  return {
    id: p.id,
    name: p.name,
    cpf: p.cpf || '',
    rg: p.rg,
    rgIssuer: p.rg_issuer,
    birthDate: p.birth_date,
    gender: p.gender,
    profession: p.profession,
    phone: p.phone,
    secondaryPhone: p.secondary_phone,
    emergencyContactName: p.emergency_contact_name,
    email: p.email,
    cep: p.cep,
    address: p.address,
    number: p.number,
    complement: p.complement,
    neighborhood: p.neighborhood,
    city: p.city,
    state: p.state,
    hasFinancialResponsible: Boolean(p.has_financial_responsible),
    financialResponsibleName: p.financial_responsible_name,
    financialResponsibleCpf: p.financial_responsible_cpf,
    financialResponsibleRelationship: p.financial_responsible_relationship,
    medicalAlerts,
    status: p.status,
    lastAppointmentDate: p.last_appointment_date,
    notes: p.notes,
    treatmentItems,
    pendingBudgetAmount: Number(p.pending_budget_amount || 0),
    version: p.version || 1,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

// GET /api/patients — Listagem de pacientes com segregação de dados por papel (LGPD Art. 11)
patientRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;

  const rows = db.prepare(`
    SELECT * FROM patients
    WHERE clinic_id = ?
    ORDER BY name COLLATE NOCASE ASC
  `).all(clinicId) as any[];

  if (userRole === 'RECEPTIONIST') {
    // Recepção: dados médicos mascarados no próprio servidor
    const sanitized = rows.map(sanitizePatientForReception);
    return res.json(sanitized);
  }

  // Dentista: acesso integral autorizado
  const fullPatients = rows.map(parsePatientFull);
  res.json(fullPatients);
});

// GET /api/patients/:id — Detalhe do paciente
patientRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const patientId = String(req.params.id);

  const row = db.prepare('SELECT * FROM patients WHERE id = ? AND clinic_id = ?').get(patientId, clinicId) as any;
  if (!row) {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }

  if (userRole === 'RECEPTIONIST') {
    return res.json(sanitizePatientForReception(row));
  }

  res.json(parsePatientFull(row));
});

// POST /api/patients — Criação de paciente (Recepção ou Dentista)
patientRouter.post('/', validateBody(PatientSchema), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body as Partial<Patient>;

  const patientId = data.id || `pat_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO patients (
      id, clinic_id, name, cpf, rg, rg_issuer, birth_date, gender, profession,
      phone, secondary_phone, emergency_contact_name, email,
      cep, address, number, complement, neighborhood, city, state,
      has_financial_responsible, financial_responsible_name, financial_responsible_cpf, financial_responsible_relationship,
      medical_alerts_json, status, last_appointment_date, notes, treatment_items_json, pending_budget_amount,
      version, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      1, ?, ?
    )
  `);

  stmt.run(
    patientId,
    clinicId,
    data.name!.trim(),
    data.cpf || null,
    data.rg || null,
    data.rgIssuer || null,
    data.birthDate || null,
    data.gender || null,
    data.profession || null,
    data.phone!.trim(),
    data.secondaryPhone || null,
    data.emergencyContactName || null,
    data.email || null,
    data.cep || null,
    data.address || null,
    data.number || null,
    data.complement || null,
    data.neighborhood || null,
    data.city || null,
    data.state || null,
    data.hasFinancialResponsible ? 1 : 0,
    data.financialResponsibleName || null,
    data.financialResponsibleCpf || null,
    data.financialResponsibleRelationship || null,
    JSON.stringify(data.medicalAlerts || {}),
    data.status || 'IN_TREATMENT',
    data.lastAppointmentDate || null,
    data.notes || null,
    JSON.stringify(data.treatmentItems || []),
    Number(data.pendingBudgetAmount || 0),
    data.createdAt || now,
    now
  );

  logAudit(clinicId, userRole, 'PATIENT_CREATED', 'PATIENT', patientId, { name: data.name }, req.ip);

  const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  res.status(201).json(parsePatientFull(created));
});

// PUT /api/patients/:id — Atualização de paciente com suporte a concorrência otimista
patientRouter.put('/:id', validateBody(PatientSchema), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const patientId = String(req.params.id);
  const data = req.body as Partial<Patient> & { version?: number };

  const existing = db.prepare('SELECT * FROM patients WHERE id = ? AND clinic_id = ?').get(patientId, clinicId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }

  // Detecção de conflito de concorrência (versão desatualizada)
  if (data.version !== undefined && existing.version !== undefined && data.version < existing.version) {
    return res.status(409).json({
      error: 'Conflito de concorrência: o registro do paciente foi atualizado em outro dispositivo.',
      serverVersion: existing.version,
      clientVersion: data.version
    });
  }

  const nextVersion = (existing.version || 1) + 1;
  const now = new Date().toISOString();

  // Se for recepção, preserva os dados médicos sensíveis já gravados no banco
  let finalMedicalAlerts = data.medicalAlerts;
  if (userRole === 'RECEPTIONIST') {
    try {
      finalMedicalAlerts = JSON.parse(existing.medical_alerts_json || '{}');
    } catch {}
  }

  let finalNotes: string | null = data.notes !== undefined ? (data.notes || null) : (existing.notes ?? null);
  if (userRole === 'RECEPTIONIST') {
    finalNotes = existing.notes ?? null;
  }

  const stmt = db.prepare(`
    UPDATE patients SET
      name = ?, cpf = ?, rg = ?, rg_issuer = ?, birth_date = ?, gender = ?, profession = ?,
      phone = ?, secondary_phone = ?, emergency_contact_name = ?, email = ?,
      cep = ?, address = ?, number = ?, complement = ?, neighborhood = ?, city = ?, state = ?,
      has_financial_responsible = ?, financial_responsible_name = ?, financial_responsible_cpf = ?, financial_responsible_relationship = ?,
      medical_alerts_json = ?, status = ?, last_appointment_date = ?, notes = ?, treatment_items_json = ?, pending_budget_amount = ?,
      version = ?, updated_at = ?
    WHERE id = ? AND clinic_id = ?
  `);

  stmt.run(
    data.name?.trim() || existing.name,
    data.cpf !== undefined ? (data.cpf || null) : (existing.cpf ?? null),
    data.rg !== undefined ? (data.rg || null) : (existing.rg ?? null),
    data.rgIssuer !== undefined ? (data.rgIssuer || null) : (existing.rg_issuer ?? null),
    data.birthDate !== undefined ? (data.birthDate || null) : (existing.birth_date ?? null),
    data.gender !== undefined ? (data.gender || null) : (existing.gender ?? null),
    data.profession !== undefined ? (data.profession || null) : (existing.profession ?? null),
    data.phone?.trim() || existing.phone,
    data.secondaryPhone !== undefined ? (data.secondaryPhone || null) : (existing.secondary_phone ?? null),
    data.emergencyContactName !== undefined ? (data.emergencyContactName || null) : (existing.emergency_contact_name ?? null),
    data.email !== undefined ? (data.email || null) : (existing.email ?? null),
    data.cep !== undefined ? (data.cep || null) : (existing.cep ?? null),
    data.address !== undefined ? (data.address || null) : (existing.address ?? null),
    data.number !== undefined ? (data.number || null) : (existing.number ?? null),
    data.complement !== undefined ? (data.complement || null) : (existing.complement ?? null),
    data.neighborhood !== undefined ? (data.neighborhood || null) : (existing.neighborhood ?? null),
    data.city !== undefined ? (data.city || null) : (existing.city ?? null),
    data.state !== undefined ? (data.state || null) : (existing.state ?? null),
    data.hasFinancialResponsible !== undefined ? (data.hasFinancialResponsible ? 1 : 0) : existing.has_financial_responsible,
    data.financialResponsibleName !== undefined ? (data.financialResponsibleName || null) : (existing.financial_responsible_name ?? null),
    data.financialResponsibleCpf !== undefined ? (data.financialResponsibleCpf || null) : (existing.financial_responsible_cpf ?? null),
    data.financialResponsibleRelationship !== undefined ? (data.financialResponsibleRelationship || null) : (existing.financial_responsible_relationship ?? null),
    JSON.stringify(finalMedicalAlerts || {}),
    data.status || existing.status,
    data.lastAppointmentDate || existing.last_appointment_date,
    finalNotes,
    data.treatmentItems !== undefined ? JSON.stringify(data.treatmentItems) : (existing.treatment_items_json ?? null),
    data.pendingBudgetAmount !== undefined ? Number(data.pendingBudgetAmount) : existing.pending_budget_amount,
    nextVersion,
    now,
    patientId,
    clinicId
  );

  logAudit(clinicId, userRole, 'PATIENT_UPDATED', 'PATIENT', patientId, { name: data.name || existing.name }, req.ip);

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  res.json(userRole === 'RECEPTIONIST' ? sanitizePatientForReception(updated) : parsePatientFull(updated));
});

// DELETE /api/patients/:id — Exclusão de paciente EXIGE PAPEL DENTISTA + AUDITORIA LGPD
patientRouter.delete('/:id', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const patientId = String(req.params.id);

  const existing = db.prepare('SELECT * FROM patients WHERE id = ? AND clinic_id = ?').get(patientId, clinicId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }

  // Registra exclusão antes de apagar (Art. 16 LGPD & Rastreabilidade CFO)
  logAudit(clinicId, userRole, 'PATIENT_DELETED', 'PATIENT', patientId, {
    patientName: existing.name,
    cpf: maskCpf(existing.cpf),
    deletedAt: new Date().toISOString()
  }, req.ip);

  db.prepare('DELETE FROM patients WHERE id = ? AND clinic_id = ?').run(patientId, clinicId);

  res.json({ success: true, message: `Paciente ${existing.name} removido com registro em trilha de auditoria.` });
});

// POST /api/patients/:patientId/anamnesis — Conclusão de anamnese digital no tablet (Recepção ou Dentista)
patientRouter.post('/:patientId/anamnesis', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const patientId = String(req.params.patientId);

  const existingPatient = db.prepare('SELECT * FROM patients WHERE id = ? AND clinic_id = ?').get(patientId, clinicId) as any;
  if (!existingPatient) {
    return res.status(404).json({ error: 'Paciente não encontrado' });
  }

  const { 
    hasHypertension, 
    hasDiabetes, 
    isAnticoagulated, 
    allergies, 
    medicalAlerts, 
    signatureDataUrl, 
    hashSha256 
  } = req.body;

  let currentAlerts: any = {};
  try {
    currentAlerts = JSON.parse(existingPatient.medical_alerts_json || '{}');
  } catch {}

  const updatedAlerts = {
    ...currentAlerts,
    hypertension: Boolean(hasHypertension),
    diabetes: Boolean(hasDiabetes),
    anticoagulant: Boolean(isAnticoagulated),
    allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : currentAlerts.allergies || []),
    otherConditions: medicalAlerts || currentAlerts.otherConditions || ''
  };

  const now = new Date().toISOString();

  // 1. Atualiza as flags imediatas e o JSON de alertas no cadastro do paciente
  const updateStmt = db.prepare(`
    UPDATE patients 
    SET 
      has_hypertension = ?,
      has_diabetes = ?,
      is_anticoagulated = ?,
      allergies = ?,
      medical_alerts = ?,
      medical_alerts_json = ?,
      updated_at = ?
    WHERE id = ? AND clinic_id = ?
  `);

  updateStmt.run(
    hasHypertension ? 1 : 0,
    hasDiabetes ? 1 : 0,
    isAnticoagulated ? 1 : 0,
    allergies ? (Array.isArray(allergies) ? JSON.stringify(allergies) : String(allergies)) : null,
    medicalAlerts || null,
    JSON.stringify(updatedAlerts),
    now,
    patientId,
    clinicId
  );

  // 2. Arquiva o documento assinado no prontuário de documentos
  const docId = `anam_${Date.now()}`;
  const docStmt = db.prepare(`
    INSERT INTO documents (
      id, clinic_id, patient_id, patient_name, type, title, sha256_hash, signature_base64, content_json, content_hash, signature_image, created_at
    ) VALUES (?, ?, ?, ?, 'ANAMNESIS', 'Ficha de Anamnese Digital', ?, ?, ?, ?, ?, ?)
  `);

  const contentJson = JSON.stringify({
    hasHypertension: Boolean(hasHypertension),
    hasDiabetes: Boolean(hasDiabetes),
    isAnticoagulated: Boolean(isAnticoagulated),
    allergies,
    medicalAlerts,
    signedAt: now
  });

  docStmt.run(
    docId,
    clinicId,
    patientId,
    existingPatient.name,
    hashSha256 || null,
    signatureDataUrl || null,
    contentJson,
    hashSha256 || null,
    signatureDataUrl || null,
    now
  );

  logAudit(clinicId, userRole, 'ANAMNESIS_RECORDED', 'PATIENT', patientId, {
    patientName: existingPatient.name,
    hasHypertension: Boolean(hasHypertension),
    hasDiabetes: Boolean(hasDiabetes),
    isAnticoagulated: Boolean(isAnticoagulated)
  }, req.ip);

  return res.status(200).json({ 
    success: true, 
    message: 'Anamnese sincronizada com o prontuário com sucesso.',
    documentId: docId
  });
});

