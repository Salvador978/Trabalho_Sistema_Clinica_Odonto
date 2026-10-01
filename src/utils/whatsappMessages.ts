export interface AppointmentNotificationData {
  patientName: string;
  patientPhone: string;
  dateStr: string;
  timeStr: string;
  clinicName?: string;
  dentistName?: string;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  // Limpa caracteres não numéricos do telefone
  const cleanedPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

export function getAppointmentReminderMessage(data: AppointmentNotificationData): string {
  return `Olá, *${data.patientName}*! 👋\n\n` +
    `Aqui é da equipe do *${data.clinicName || 'Consultório Odontológico'}*.\n` +
    `Lembramos da sua consulta com o(a) *${data.dentistName || 'Dentista'}* agendada para:\n\n` +
    `📅 *Data:* ${data.dateStr}\n` +
    `⏰ *Horário:* ${data.timeStr}\n\n` +
    `Por favor, responda esta mensagem com:\n` +
    `*1* para *Confirmar presença*\n` +
    `*2* para *Solicitar reagendamento*\n\n` +
    `Agradecemos a atenção!`;
}

export function getRecallMessage(patientName: string, monthsSinceLastVisit = 6): string {
  return `Olá, *${patientName}*! Tudo bem? 😊\n\n` +
    `Já se passaram *${monthsSinceLastVisit} meses* desde a sua última avaliação e limpeza preventiva.\n\n` +
    `A manutenção regular é essencial para prevenir cáries, tártaro e manter a saúde bucal em dia.\n` +
    `Gostaria de verificar os horários disponíveis para esta semana?`;
}
