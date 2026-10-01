/**
 * UTILITÁRIO DE DISPARO DE WHATSAPP EM 1 CLIQUE
 * Padrão: https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}
 */

export const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  // Se não começa com código de país do Brasil (55), adiciona
  if (digits.length >= 10 && !digits.startsWith('55')) {
    return `55${digits}`;
  }
  return digits;
};

export const generateWhatsAppLink = (phone: string, message: string): string => {
  const intlPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
};

export const openWhatsAppDirect = (phone: string, message: string): void => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
};

/**
 * Modelo de confirmação de consulta para o paciente
 */
export const buildAppointmentConfirmationMessage = (params: {
  patientName: string;
  date: string;
  time: string;
  duration: number;
  procedure: string;
  dentistName?: string;
  clinicAddress?: string;
}): string => {
  const dentist = params.dentistName || 'Dra. Juliana Mendes';
  const address = params.clinicAddress || 'Av. Paulista, 1000 - Sala 42, Bela Vista, São Paulo - SP';

  return `🦷 *CONFIRMAÇÃO DE CONSULTA - CONSULTÓRIO ODONTOLÓGICO*

Olá, *${params.patientName}*! Tudo bem?

Passando para confirmar o seu atendimento com a *${dentist}*:
📅 *Data:* ${params.date}
⏰ *Horário:* ${params.time} (${params.duration} min)
🦷 *Procedimento:* ${params.procedure}

📍 *Endereço:* ${address}

_Por favor, responda com *1 para CONFIRMAR* ou nos avise caso necessite reagendar._`;
};

/**
 * Modelo de recibo de quitação formal com CRO para envio direto
 */
export const buildReceiptWhatsAppMessage = (params: {
  payerName: string;
  payerCpf: string;
  patientName: string;
  grossTotal: number;
  valorExtenso: string;
  description: string;
  dentistName?: string;
  dentistCro?: string;
  dentistCpf?: string;
}): string => {
  const dentist = params.dentistName || 'Dra. Juliana Mendes';
  const cro = params.dentistCro || 'CRO-SP 123.456';
  const cpf = params.dentistCpf || '123.456.789-00';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return `🦷 *RECIBO ODONTOLÓGICO DE QUITAÇÃO*
*${dentist}*
CRO: ${cro} | CPF: ${cpf}

Recebi de: *${params.payerName}* (CPF: ${params.payerCpf})
A quantia de: *R$ ${params.grossTotal.toFixed(2)}* (${params.valorExtenso})
Referente a serviços odontológicos prestados a: *${params.patientName}*
Tratamento: ${params.description}
Data da Quitação: ${dataHoje}

_Válido para comprovação na Declaração de Imposto de Renda (DMED / Carnê-Leão)._`;
};
