import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest, logAudit } from '../auth.js';

export const scheduleRouter = Router();

scheduleRouter.use(authMiddleware);

// GET /api/appointments — Lista agendamentos
scheduleRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const dateFilter = req.query.date as string | undefined;

  let query = 'SELECT * FROM appointments WHERE clinic_id = ?';
  const params: any[] = [clinicId];

  if (dateFilter) {
    query += ' AND date = ?';
    params.push(dateFilter);
  }

  query += ' ORDER BY date ASC, time ASC';

  const rows = db.prepare(query).all(...params) as any[];

  const appointments = rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient_name,
    date: r.date,
    time: r.time,
    durationMin: r.duration_min,
    status: r.status,
    procedure: r.procedure,
    notes: r.notes,
    dentistName: r.dentist_name,
    dentistCro: r.dentist_cro,
    phone: r.phone,
    whatsappStatus: r.whatsapp_status,
    isEmergency: Boolean(r.is_emergency)
  }));

  res.json(appointments);
});

// POST /api/appointments — Cria ou atualiza agendamento
scheduleRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const data = req.body;

  if (!data.patientName || !data.date || !data.time) {
    return res.status(400).json({ error: 'patientName, date e time são obrigatórios' });
  }

  const id = data.id || `app_${crypto.randomUUID()}`;

  const existing = db.prepare('SELECT id FROM appointments WHERE id = ? AND clinic_id = ?').get(id, clinicId);

  if (existing) {
    db.prepare(`
      UPDATE appointments SET
        patient_id = ?, patient_name = ?, date = ?, time = ?, duration_min = ?,
        status = ?, procedure = ?, notes = ?, dentist_name = ?, dentist_cro = ?,
        phone = ?, whatsapp_status = ?, is_emergency = ?
      WHERE id = ? AND clinic_id = ?
    `).run(
      data.patientId || null,
      data.patientName.trim(),
      data.date,
      data.time,
      data.durationMin || 30,
      data.status || 'SCHEDULED',
      data.procedure || null,
      data.notes || null,
      data.dentistName || req.auth!.dentistName,
      data.dentistCro || req.auth!.dentistCro,
      data.phone || null,
      data.whatsappStatus || 'PENDING',
      data.isEmergency ? 1 : 0,
      id,
      clinicId
    );

    logAudit(clinicId, userRole, 'APPOINTMENT_UPDATED', 'APPOINTMENT', id, { patient: data.patientName }, req.ip);
  } else {
    db.prepare(`
      INSERT INTO appointments (
        id, clinic_id, patient_id, patient_name, date, time, duration_min,
        status, procedure, notes, dentist_name, dentist_cro,
        phone, whatsapp_status, is_emergency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      clinicId,
      data.patientId || null,
      data.patientName.trim(),
      data.date,
      data.time,
      data.durationMin || 30,
      data.status || 'SCHEDULED',
      data.procedure || null,
      data.notes || null,
      data.dentistName || req.auth!.dentistName,
      data.dentistCro || req.auth!.dentistCro,
      data.phone || null,
      data.whatsappStatus || 'PENDING',
      data.isEmergency ? 1 : 0
    );

    logAudit(clinicId, userRole, 'APPOINTMENT_CREATED', 'APPOINTMENT', id, { patient: data.patientName }, req.ip);
  }

  const saved = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) as any;
  res.status(200).json({
    id: saved.id,
    patientId: saved.patient_id,
    patientName: saved.patient_name,
    date: saved.date,
    time: saved.time,
    durationMin: saved.duration_min,
    status: saved.status,
    procedure: saved.procedure,
    notes: saved.notes,
    dentistName: saved.dentist_name,
    dentistCro: saved.dentist_cro,
    phone: saved.phone,
    whatsappStatus: saved.whatsapp_status,
    isEmergency: Boolean(saved.is_emergency)
  });
});

// PATCH /api/appointments/:id/status — Atualiza status do fluxo de atendimento
scheduleRouter.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const id = String(req.params.id);
  const { status, newStatus, whatsappStatus } = req.body;

  const existing = db.prepare('SELECT * FROM appointments WHERE id = ? AND clinic_id = ?').get(id, clinicId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }

  const finalStatus = newStatus || status || existing.status;
  const finalWaStatus = whatsappStatus || existing.whatsapp_status;

  db.prepare('UPDATE appointments SET status = ?, whatsapp_status = ? WHERE id = ? AND clinic_id = ?').run(
    finalStatus,
    finalWaStatus,
    id,
    clinicId
  );

  res.json({ id, status: finalStatus, whatsappStatus: finalWaStatus });
});

// DELETE /api/appointments/:id — Exclui agendamento
scheduleRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const id = String(req.params.id);

  db.prepare('DELETE FROM appointments WHERE id = ? AND clinic_id = ?').run(id, clinicId);
  res.json({ success: true });
});
