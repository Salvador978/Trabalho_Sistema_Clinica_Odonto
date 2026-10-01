import 'dotenv/config';
import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { logger } from './logger.js';

const INSECURE_DEFAULT_SECRETS = [
  'gerencia_odonto_jwt_super_secret_production_key_2026_983427189',
  'gerencia_odonto_jwt_super_secret_key_2026',
  'coloque_uma_chave_secreta_forte_de_pelo_menos_32_caracteres_aqui',
  'secret',
  'password'
];

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isWeak = !secret || INSECURE_DEFAULT_SECRETS.includes(secret);

  if (process.env.NODE_ENV === 'production' && isWeak) {
    logger.error('CRÍTICO: JWT_SECRET ausente ou utilizando valor padrão/inseguro em produção!');
    process.exit(1);
  }

  if (isWeak) {
    logger.warn('AVISO DE SEGURANÇA: JWT_SECRET não configurado ou fraco. Gerando segredo criptográfico efêmero.');
    return crypto.randomBytes(32).toString('hex');
  }

  return secret;
}

export const JWT_SECRET = resolveJwtSecret();

export interface AuthTokenPayload {
  clinicId: string;
  role: 'DENTIST' | 'RECEPTIONIST';
  login: string;
  dentistName: string;
  dentistCro: string;
  clinicName: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function generateToken(payload: AuthTokenPayload, expiresIn: string = '8h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.auth = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Por favor, autentique-se novamente.' });
    }
    return res.status(401).json({ error: 'Token de autenticação inválido' });
  }
}

export function requireRole(allowedRole: 'DENTIST') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (req.auth.role !== allowedRole) {
      logAudit(
        req.auth.clinicId,
        req.auth.role,
        'UNAUTHORIZED_ROLE_ACCESS_BLOCKED',
        'ROUTE',
        req.originalUrl,
        { reason: 'Permissão de Dentista necessária', requiredRole: allowedRole },
        req.ip
      );
      return res.status(403).json({
        error: 'Acesso negado. Ação restrita ao Cirurgião-Dentista (Sigilo Clínico / LGPD / CFO).'
      });
    }
    next();
  };
}

export function checkPinRateLimit(clinicId: string): { isBlocked: boolean; remainingAttempts: number } {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM pin_failed_attempts
    WHERE clinic_id = ? AND attempted_at > datetime('now', '-15 minutes')
  `).get(clinicId) as { count: number };

  const failedCount = result ? Number(result.count) : 0;
  if (failedCount >= 5) {
    return { isBlocked: true, remainingAttempts: 0 };
  }
  return { isBlocked: false, remainingAttempts: 5 - failedCount };
}

export function recordFailedPinAttempt(clinicId: string, ipAddress?: string) {
  db.prepare(`
    INSERT INTO pin_failed_attempts (clinic_id, ip_address, attempted_at)
    VALUES (?, ?, datetime('now'))
  `).run(clinicId, ipAddress || 'unknown');
}

export function clearFailedPinAttempts(clinicId: string) {
  db.prepare('DELETE FROM pin_failed_attempts WHERE clinic_id = ?').run(clinicId);
}

export function logAudit(
  clinicId: string,
  userRole: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: any,
  ipAddress?: string
) {
  try {
    db.prepare(`
      INSERT INTO audit_log (clinic_id, user_role, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      clinicId,
      userRole,
      action,
      entityType || null,
      entityId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null
    );
  } catch (err) {
    console.error('Falha ao registrar audit log:', err);
  }
}
