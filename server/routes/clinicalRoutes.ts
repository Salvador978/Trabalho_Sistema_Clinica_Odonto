import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest, logAudit } from '../auth.js';

export const clinicalRouter = Router();

clinicalRouter.use(authMiddleware);

// GET /api/clinical/evolutions/patient/:patientId — Histórico de evoluções (Acesso Restrito ao Dentista)
clinicalRouter.get('/evolutions/patient/:patientId', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const patientId = String(req.params.patientId);

  const rows = db.prepare(`
    SELECT * FROM clinical_evolutions
    WHERE clinic_id = ? AND patient_id = ?
    ORDER BY date DESC, created_at DESC
  `).all(clinicId, patientId) as any[];

  const evolutions = rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    date: r.date,
    dentistName: r.dentist_name,
    dentistCro: r.dentist_cro,
    procedure: r.procedure,
    tooth: r.tooth,
    text: r.text,
    sterilizationLot: r.sterilization_lot
  }));

  res.json(evolutions);
});

// POST /api/clinical/evolutions — Registrar nova evolução com Lote RDC 15 (Apenas Dentista)
clinicalRouter.post('/evolutions', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const { patientId, patientName, date, procedure, tooth, text, sterilizationLot } = req.body;

  if (!patientId || !procedure || !text || !sterilizationLot) {
    return res.status(400).json({ error: 'patientId, procedure, text e sterilizationLot são obrigatórios' });
  }

  const evoId = `evo_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO clinical_evolutions (
      id, clinic_id, patient_id, patient_name, date,
      dentist_name, dentist_cro, procedure, tooth, text, sterilization_lot, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    evoId,
    clinicId,
    patientId,
    patientName || 'Paciente',
    date || now.split('T')[0],
    req.auth!.dentistName,
    req.auth!.dentistCro,
    procedure,
    tooth || null,
    text,
    sterilizationLot,
    now
  );

  logAudit(clinicId, userRole, 'CLINICAL_EVOLUTION_RECORDED', 'PATIENT', patientId, {
    procedure,
    tooth,
    sterilizationLot
  }, req.ip);

  res.status(201).json({
    id: evoId,
    patientId,
    patientName,
    date: date || now.split('T')[0],
    dentistName: req.auth!.dentistName,
    dentistCro: req.auth!.dentistCro,
    procedure,
    tooth,
    text,
    sterilizationLot
  });
});

// GET /api/clinical/odontogram/patient/:patientId — Obter estado do odontograma
clinicalRouter.get('/odontogram/patient/:patientId', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const patientId = String(req.params.patientId);

  const row = db.prepare('SELECT findings_json FROM odontograms WHERE clinic_id = ? AND patient_id = ?').get(clinicId, patientId) as any;

  if (!row) {
    return res.json({ findings: [] });
  }

  try {
    const findings = JSON.parse(row.findings_json);
    return res.json({ findings });
  } catch {
    return res.json({ findings: [] });
  }
});

// PUT /api/clinical/odontogram/patient/:patientId — Salvar achados do odontograma (Apenas Dentista)
clinicalRouter.put('/odontogram/patient/:patientId', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const patientId = String(req.params.patientId);
  const findings = req.body.findings ?? req.body.teeth;

  if (!Array.isArray(findings)) {
    return res.status(400).json({ error: 'findings ou teeth deve ser um array' });
  }

  const existing = db.prepare('SELECT patient_id FROM odontograms WHERE clinic_id = ? AND patient_id = ?').get(clinicId, patientId);

  if (existing) {
    db.prepare('UPDATE odontograms SET findings_json = ?, updated_at = datetime(\'now\') WHERE clinic_id = ? AND patient_id = ?').run(
      JSON.stringify(findings),
      clinicId,
      patientId
    );
  } else {
    db.prepare('INSERT INTO odontograms (patient_id, clinic_id, findings_json, updated_at) VALUES (?, ?, ?, datetime(\'now\'))').run(
      patientId,
      clinicId,
      JSON.stringify(findings)
    );
  }

  logAudit(clinicId, userRole, 'ODONTOGRAM_SAVED', 'PATIENT', patientId, { findingsCount: findings.length }, req.ip);

  res.json({ success: true, count: findings.length });
});
