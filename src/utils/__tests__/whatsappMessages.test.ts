import { describe, it, expect } from 'vitest';
import { buildWhatsAppLink, getAppointmentReminderMessage, getRecallMessage } from '../whatsappMessages';

describe('whatsappMessages utils', () => {
  it('buildWhatsAppLink deve formatar link wa.me com DDI 55 e texto encodado', () => {
    const link = buildWhatsAppLink('(11) 91234-5678', 'Mensagem teste');
    expect(link).toContain('https://wa.me/5511912345678?text=');
    expect(link).toContain(encodeURIComponent('Mensagem teste'));
  });

  it('getAppointmentReminderMessage deve formatar mensagem completa com dados da consulta', () => {
    const message = getAppointmentReminderMessage({
      patientName: 'Ana Souza',
      patientPhone: '11988887777',
      dateStr: '28/09/2026',
      timeStr: '15:00',
      clinicName: 'Clínica Sorriso VIP',
      dentistName: 'Dra. Juliana Mendes'
    });

    expect(message).toContain('Ana Souza');
    expect(message).toContain('28/09/2026');
    expect(message).toContain('15:00');
    expect(message).toContain('Clínica Sorriso VIP');
    expect(message).toContain('Dra. Juliana Mendes');
    expect(message).toContain('Confirmar presença');
  });

  it('getRecallMessage deve incluir nome e período de retorno preventivo', () => {
    const recall = getRecallMessage('Carlos Eduardo', 6);
    expect(recall).toContain('Carlos Eduardo');
    expect(recall).toContain('6 meses');
    expect(recall).toContain('limpeza preventiva');
  });
});
