import { describe, it, expect } from 'vitest';
import { generateSha256Hash } from '../useSignature';

describe('generateSha256Hash', () => {
  it('deve gerar hash hexadecimal SHA-256 de 64 caracteres consistente', async () => {
    const payload = {
      patientId: 'pat_123',
      patientName: 'Maria Silva',
      hypertension: true,
      timestamp: '2026-09-29T10:00:00Z'
    };

    const hash1 = await generateSha256Hash(payload);
    const hash2 = await generateSha256Hash(payload);

    expect(hash1).toBeDefined();
    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);
  });

  it('deve produzir hashes distintos para payloads distintos', async () => {
    const hashA = await generateSha256Hash({ test: 'A' });
    const hashB = await generateSha256Hash({ test: 'B' });

    expect(hashA).not.toBe(hashB);
  });
});
