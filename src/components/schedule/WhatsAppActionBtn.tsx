import React from 'react';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppLink, getAppointmentReminderMessage } from '../../utils/whatsappMessages';

interface WhatsAppActionBtnProps {
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName?: string;
  dentistName?: string;
  onSent?: () => void;
}

export const WhatsAppActionBtn: React.FC<WhatsAppActionBtnProps> = ({
  patientName,
  patientPhone,
  appointmentDate,
  appointmentTime,
  clinicName,
  dentistName,
  onSent
}) => {
  if (!patientPhone) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = getAppointmentReminderMessage({
      patientName,
      patientPhone,
      dateStr: appointmentDate,
      timeStr: appointmentTime,
      clinicName,
      dentistName
    });

    const url = buildWhatsAppLink(patientPhone, message);
    window.open(url, '_blank', 'noopener,noreferrer');

    if (onSent) onSent();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Enviar lembrete via WhatsApp"
      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-emerald-200 cursor-pointer shadow-2xs active:scale-95"
    >
      <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>Lembrete</span>
    </button>
  );
};
