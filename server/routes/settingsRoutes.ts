import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, AuthenticatedRequest, logAudit } from '../auth.js';

export const settingsRouter = Router();

settingsRouter.use(authMiddleware);

// GET /api/settings — Configurações da clínica
settingsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;

  const row = db.prepare('SELECT settings_json FROM clinic_settings WHERE clinic_id = ?').get(clinicId) as any;
  if (!row) {
    return res.status(404).json({ error: 'Configurações não encontradas' });
  }

  try {
    const settings = JSON.parse(row.settings_json);
    // Se for recepcionista, não vaza o PIN do dentista nem chaves administrativas sensíveis
    if (req.auth!.role === 'RECEPTIONIST') {
      delete settings.dentistPin;
    }
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Erro ao processar configurações' });
  }
});

// PUT /api/settings — Atualização das configurações
settingsRouter.put('/', (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const userRole = req.auth!.role;
  const newSettings = req.body;

  const existingRow = db.prepare('SELECT settings_json FROM clinic_settings WHERE clinic_id = ?').get(clinicId) as any;
  let currentSettings: any = {};
  if (existingRow) {
    try {
      currentSettings = JSON.parse(existingRow.settings_json);
    } catch {}
  }

  // Se for recepção, só pode alterar dados de perfil de recepção
  let finalSettings = newSettings;
  if (userRole === 'RECEPTIONIST') {
    finalSettings = {
      ...currentSettings,
      receptionistName: newSettings.receptionistName || currentSettings.receptionistName,
      receptionistPhone: newSettings.receptionistPhone || currentSettings.receptionistPhone,
      receptionistShift: newSettings.receptionistShift || currentSettings.receptionistShift,
      receptionistNotes: newSettings.receptionistNotes || currentSettings.receptionistNotes
    };
  }

  db.prepare(`
    INSERT INTO clinic_settings (clinic_id, settings_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(clinic_id) DO UPDATE SET
      settings_json = excluded.settings_json,
      updated_at = excluded.updated_at
  `).run(clinicId, JSON.stringify(finalSettings));

  // Também sincroniza nome da clínica e dentista na tabela clinics caso tenham mudado
  if (userRole === 'DENTIST') {
    if (newSettings.clinicName || newSettings.dentistName || newSettings.dentistCro) {
      db.prepare(`
        UPDATE clinics SET
          name = COALESCE(?, name),
          dentist_name = COALESCE(?, dentist_name),
          dentist_cro = COALESCE(?, dentist_cro)
        WHERE id = ?
      `).run(newSettings.clinicName || null, newSettings.dentistName || null, newSettings.dentistCro || null, clinicId);
    }
  }

  logAudit(clinicId, userRole, 'SETTINGS_UPDATED', 'SETTINGS', clinicId, {}, req.ip);

  res.json(finalSettings);
});
