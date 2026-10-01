import { describe, it, expect } from 'vitest';
import { cleanPhoneNumber, generateWhatsAppLink, buildAppointmentConfirmationMessage } from '../whatsapp';

describe('whatsapp utils', () => {
  it('cleanPhoneNumber deve formatar números com DDI do Brasil (55)', () => {
    expect(cleanPhoneNumber('(11) 98765-4321')).toBe('5511987654321');
    expect(cleanPhoneNumber('11987654321')).toBe('5511987654321');
    expect(cleanPhoneNumber('5511987654321')).toBe('5511987654321');
    expect(cleanPhoneNumber('')).toBe('');
  });

  it('generateWhatsAppLink deve criar link válido wa.me com mensagem encodada', () => {
    const link = generateWhatsAppLink('11987654321', 'Olá, Dr.!');
    expect(link).toContain('https://wa.me/5511987654321?text=');
    expect(link).toContain(encodeURIComponent('Olá, Dr.!'));
  });

  it('buildAppointmentConfirmationMessage deve gerar mensagem contendo os dados da consulta', () => {
    const msg = buildAppointmentConfirmationMessage({
      patientName: 'Lucas Lima',
      date: '30/09/2026',
      time: '14:30',
      duration: 45,
      procedure: 'Restauração Estética',
      dentistName: 'Dra. Juliana Mendes'
    });

    expect(msg).toContain('Lucas Lima');
    expect(msg).toContain('30/09/2026');
    expect(msg).toContain('14:30');
    expect(msg).toContain('Restauração Estética');
    expect(msg).toContain('Dra. Juliana Mendes');
  });
});
