/**
 * MOTOR CRIPTOGRÁFICO NATIVO (WEB CRYPTO API)
 * Gera hashes SHA-256 reais e provas imutáveis de consentimento para o TCLE.
 */

export async function computeSHA256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ConsentProof {
  hash: string;
  timestamp: string;
  ipAddress: string;
  patientName: string;
  patientCpf: string;
  dentistCro: string;
  proceduresSummary: string;
  signatureStrokeCount: number;
  signatureBase64: string;
}

/**
 * Gera prova criptográfica imutável para assinatura de TCLE / Orçamento
 */
export async function generateConsentProof(params: {
  patientName: string;
  patientCpf: string;
  dentistName: string;
  dentistCro: string;
  procedures: string[];
  signatureBase64: string;
  strokeCount: number;
}): Promise<ConsentProof> {
  const timestamp = new Date().toISOString();
  const proceduresSummary = params.procedures.join(' | ');

  const canonicalPayload = [
    `PATIENT:${params.patientName.trim()}`,
    `CPF:${params.patientCpf.trim()}`,
    `DENTIST:${params.dentistName.trim()}`,
    `CRO:${params.dentistCro.trim()}`,
    `PROCEDURES:${proceduresSummary}`,
    `TIMESTAMP:${timestamp}`,
    `STROKES:${params.strokeCount}`,
    `SIG_LEN:${params.signatureBase64.length}`
  ].join('|');

  const hash = await computeSHA256(canonicalPayload);

  return {
    hash,
    timestamp,
    ipAddress: 'Dispositivo Clínico Local',
    patientName: params.patientName,
    patientCpf: params.patientCpf,
    dentistCro: params.dentistCro,
    proceduresSummary,
    signatureStrokeCount: params.strokeCount,
    signatureBase64: params.signatureBase64
  };
}
