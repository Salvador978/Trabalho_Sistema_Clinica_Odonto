import { describe, it, expect } from 'vitest';
import { LoginSchema, ElevatePinSchema, PatientSchema } from '../schemas';

describe('Zod Schemas Validation', () => {
  it('LoginSchema deve validar login e senha preenchidos', () => {
    const valid = LoginSchema.safeParse({ login: 'admin@consultorio.com', password: 'password123' });
    expect(valid.success).toBe(true);

    const invalid = LoginSchema.safeParse({ login: '', password: '' });
    expect(invalid.success).toBe(false);
  });

  it('ElevatePinSchema deve exigir exatamente 4 dígitos numéricos', () => {
    expect(ElevatePinSchema.safeParse({ pin: '1234' }).success).toBe(true);
    expect(ElevatePinSchema.safeParse({ pin: '123' }).success).toBe(false);
    expect(ElevatePinSchema.safeParse({ pin: '12345' }).success).toBe(false);
    expect(ElevatePinSchema.safeParse({ pin: 'abcd' }).success).toBe(false);
  });

  it('PatientSchema deve exigir nome e telefone válidos', () => {
    const valid = PatientSchema.safeParse({
      name: 'João Pedro',
      phone: '11999998888',
      gender: 'MALE'
    });
    expect(valid.success).toBe(true);

    const invalid = PatientSchema.safeParse({
      name: 'J',
      phone: '123'
    });
    expect(invalid.success).toBe(false);
  });
});
