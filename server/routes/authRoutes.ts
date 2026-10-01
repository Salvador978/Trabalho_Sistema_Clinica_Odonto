import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import {
  authMiddleware,
  requireRole,
  generateToken,
  AuthenticatedRequest,
  checkPinRateLimit,
  recordFailedPinAttempt,
  clearFailedPinAttempts,
  logAudit
} from '../auth.js';
import { validateBody, LoginSchema, ElevatePinSchema, ChangePinSchema } from '../validation/schemas.js';

export const authRouter = Router();

// POST /api/auth/login — Autenticação de clínica com padrão seguro de Menor Privilégio (inicia como RECEPTIONIST)
authRouter.post('/login', validateBody(LoginSchema), (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login e senha são obrigatórios' });
  }

  const cleanLogin = String(login).trim().toLowerCase();
  const cleanPass = String(password).trim();

  const clinic = db.prepare(`
    SELECT * FROM clinics
    WHERE LOWER(login) = ? OR LOWER(id) = ? OR LOWER(name) = ?
  `).get(cleanLogin, cleanLogin, cleanLogin) as any;

  if (!clinic) {
    logAudit('unknown', 'ANONYMOUS', 'LOGIN_FAILED_NOT_FOUND', 'CLINIC', cleanLogin, { ip: req.ip }, req.ip);
    return res.status(401).json({ error: 'Credenciais de acesso incorretas' });
  }

  if (!clinic.active) {
    logAudit(clinic.id, 'ANONYMOUS', 'LOGIN_FAILED_INACTIVE', 'CLINIC', clinic.id, { ip: req.ip }, req.ip);
    return res.status(403).json({ error: 'Clínica desativada. Entre em contato com o suporte.' });
  }

  const isPasswordValid = bcrypt.compareSync(cleanPass, clinic.password_hash);
  if (!isPasswordValid) {
    logAudit(clinic.id, 'ANONYMOUS', 'LOGIN_FAILED_WRONG_PASSWORD', 'CLINIC', clinic.id, { ip: req.ip }, req.ip);
    return res.status(401).json({ error: 'Credenciais de acesso incorretas' });
  }

  let currentClinicName = clinic.name;
  let currentDentistName = clinic.dentist_name;
  let currentDentistCro = clinic.dentist_cro;

  const settingsRow = db.prepare('SELECT settings_json FROM clinic_settings WHERE clinic_id = ?').get(clinic.id) as any;
  if (settingsRow) {
    try {
      const s = JSON.parse(settingsRow.settings_json);
      if (s.clinicName) currentClinicName = s.clinicName;
      if (s.dentistName) currentDentistName = s.dentistName;
      if (s.dentistCro) currentDentistCro = s.dentistCro;
    } catch {}
  }

  // Token inicial sempre atribuído à Recepção (Princípio do Menor Privilégio)
  const token = generateToken({
    clinicId: clinic.id,
    role: 'RECEPTIONIST',
    login: clinic.login,
    dentistName: currentDentistName,
    dentistCro: currentDentistCro,
    clinicName: currentClinicName
  }, '8h');

  logAudit(clinic.id, 'RECEPTIONIST', 'LOGIN_SUCCESS', 'CLINIC', clinic.id, {}, req.ip);

  res.json({
    token,
    session: {
      clinicId: clinic.id,
      clinicName: currentClinicName,
      dentistName: currentDentistName,
      dentistCro: currentDentistCro,
      login: clinic.login,
      loggedAt: new Date().toISOString(),
      role: 'RECEPTIONIST'
    }
  });
});

// POST /api/auth/elevate — Elevação de papel para DENTIST via PIN com Rate Limiting estrito no backend
authRouter.post('/elevate', authMiddleware, validateBody(ElevatePinSchema), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const { pin } = req.body;

  // 1. Checa proteção contra força bruta no backend (5 tentativas nos últimos 15 min)
  const rateLimit = checkPinRateLimit(clinicId);
  if (rateLimit.isBlocked) {
    logAudit(clinicId, req.auth!.role, 'PIN_BRUTE_FORCE_BLOCKED', 'SECURITY', clinicId, { ip: req.ip }, req.ip);
    return res.status(429).json({
      error: 'PIN temporariamente bloqueado por 15 minutos após 5 tentativas incorretas consecutivas.'
    });
  }

  // 2. Busca o hash do PIN no banco
  const clinic = db.prepare('SELECT * FROM clinics WHERE id = ?').get(clinicId) as any;
  if (!clinic) {
    return res.status(404).json({ error: 'Clínica não encontrada' });
  }

  const isPinValid = bcrypt.compareSync(String(pin).trim(), clinic.dentist_pin_hash);

  if (!isPinValid) {
    recordFailedPinAttempt(clinicId, req.ip);
    const updatedRate = checkPinRateLimit(clinicId);

    logAudit(clinicId, req.auth!.role, 'PIN_ELEVATION_FAILED', 'SECURITY', clinicId, {
      remainingAttempts: updatedRate.remainingAttempts,
      ip: req.ip
    }, req.ip);

    if (updatedRate.isBlocked) {
      return res.status(429).json({
        error: 'Tentativas esgotadas. PIN bloqueado por 15 minutos.'
      });
    }

    return res.status(401).json({
      error: `PIN incorreto. Você tem mais ${updatedRate.remainingAttempts} tentativa(s) antes do bloqueio temporário.`
    });
  }

  // 3. Sucesso: limpa tentativas falhas e emite token elevado de Dentista
  clearFailedPinAttempts(clinicId);

  const dentistToken = generateToken({
    clinicId: clinic.id,
    role: 'DENTIST',
    login: clinic.login,
    dentistName: clinic.dentist_name,
    dentistCro: clinic.dentist_cro,
    clinicName: clinic.name
  }, '4h');

  logAudit(clinicId, 'DENTIST', 'PIN_ELEVATION_SUCCESS', 'SECURITY', clinicId, {}, req.ip);

  res.json({
    token: dentistToken,
    role: 'DENTIST',
    message: 'Acesso elevado para Cirurgião-Dentista autorizado.'
  });
});

// POST /api/auth/change-pin — Alteração de PIN (Apenas Dentista autenticado)
authRouter.post('/change-pin', authMiddleware, requireRole('DENTIST'), validateBody(ChangePinSchema), (req: AuthenticatedRequest, res: Response) => {
  const clinicId = req.auth!.clinicId;
  const { newPin } = req.body;

  const cleanPin = String(newPin).trim();
  const pinHash = bcrypt.hashSync(cleanPin, 10);

  db.prepare('UPDATE clinics SET dentist_pin_hash = ? WHERE id = ?').run(pinHash, clinicId);

  // Sincroniza nas configurações (hash only, sem PIN em texto plano)
  const settingsRow = db.prepare('SELECT settings_json FROM clinic_settings WHERE clinic_id = ?').get(clinicId) as any;
  if (settingsRow) {
    try {
      const parsed = JSON.parse(settingsRow.settings_json);
      // Remove qualquer PIN em texto plano que possa existir no JSON de configurações
      delete parsed.dentistPin;
      db.prepare('UPDATE clinic_settings SET settings_json = ? WHERE clinic_id = ?').run(
        JSON.stringify(parsed),
        clinicId
      );
    } catch {}
  }

  logAudit(clinicId, 'DENTIST', 'PIN_CHANGED', 'SECURITY', clinicId, {}, req.ip);

  res.json({ success: true, message: 'PIN do dentista atualizado com sucesso' });
});

// GET /api/auth/me — Recupera sessão atual
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    auth: req.auth,
    serverTime: new Date().toISOString()
  });
});
