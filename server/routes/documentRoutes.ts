import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole, AuthenticatedRequest, logAudit } from '../auth.js';

export const documentRouter = Router();

documentRouter.use(authMiddleware);

// GET /api/documents/patient/:patientId — Lista todos os documentos vinculados ao prontuário
documentRouter.get('/patient/:patientId', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const patientId = req.params.patientId;
  const typeFilter = req.query.type as string | undefined;

  let query = 'SELECT * FROM documents WHERE clinic_id = ? AND patient_id = ?';
  const params: any[] = [clinicId, patientId];

  if (typeFilter) {
    query += ' AND type = ?';
    params.push(typeFilter);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  const docs = rows.map((r) => {
    let content = {};
    try {
      content = JSON.parse(r.content_json);
    } catch {}
    return {
      id: r.id,
      patientId: r.patient_id,
      patientName: r.patient_name,
      type: r.type,
      title: r.title,
      sha256Hash: r.sha256_hash,
      signatureBase64: r.signature_base64,
      dentistCro: r.dentist_cro,
      content,
      createdAt: r.created_at
    };
  });

  res.json(docs);
});

// GET /api/documents/:id — Detalhes de um documento específico
documentRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const docId = String(req.params.id);

  const r = db.prepare('SELECT * FROM documents WHERE id = ? AND clinic_id = ?').get(docId, clinicId) as any;
  if (!r) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  let content = {};
  try {
    content = JSON.parse(r.content_json);
  } catch {}

  res.json({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    type: r.type,
    title: r.title,
    sha256Hash: r.sha256_hash,
    signatureBase64: r.signature_base64,
    dentistCro: r.dentist_cro,
    content,
    createdAt: r.created_at
  });
});

// POST /api/documents — Persistência real de TCLE assinado com SHA-256 ou Orçamento aprovado
documentRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const {
    patientId,
    patientName,
    type,
    title,
    sha256Hash,
    signatureBase64,
    dentistCro,
    content
  } = req.body;

  if (!patientId || !title || !type) {
    return res.status(400).json({ error: 'patientId, title e type são obrigatórios' });
  }

  const docId = `doc_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO documents (
      id, clinic_id, patient_id, patient_name, type, title,
      sha256_hash, signature_base64, dentist_cro, content_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    docId,
    clinicId,
    patientId,
    patientName || 'Paciente',
    type,
    title,
    sha256Hash || null,
    signatureBase64 || null,
    dentistCro || null,
    JSON.stringify(content || {}),
    now
  );

  logAudit(clinicId, userRole, 'DOCUMENT_CREATED', 'DOCUMENT', docId, {
    type,
    title,
    hasSignature: Boolean(signatureBase64),
    hasHash: Boolean(sha256Hash)
  }, req.ip);

  res.status(201).json({
    id: docId,
    patientId,
    patientName,
    type,
    title,
    sha256Hash,
    createdAt: now,
    message: 'Documento gravado com segurança e prova de integridade no prontuário.'
  });
});

// DELETE /api/documents/:id — Excluir documento (Restrito ao Dentista)
documentRouter.delete('/:id', requireRole('DENTIST'), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const docId = String(req.params.id);

  const existing = db.prepare('SELECT * FROM documents WHERE id = ? AND clinic_id = ?').get(docId, clinicId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Documento não encontrado' });
  }

  logAudit(clinicId, userRole, 'DOCUMENT_DELETED', 'DOCUMENT', docId, {
    type: existing.type,
    title: existing.title
  }, req.ip);

  db.prepare('DELETE FROM documents WHERE id = ? AND clinic_id = ?').run(docId, clinicId);

  res.json({ success: true, message: 'Documento removido com registro em trilha de auditoria.' });
});
