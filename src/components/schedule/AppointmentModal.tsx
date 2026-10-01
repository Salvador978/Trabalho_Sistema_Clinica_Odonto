import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, X, Check, AlertTriangle, FileText, CheckCircle2, MessageCircle } from 'lucide-react';
import { WhatsAppActionBtn } from './WhatsAppActionBtn';

export interface AppointmentItem {
  id: string;
  time: string;
  duration: number;
  patientName: string;
  patientPhone: string;
  procedure: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'WAITING_ROOM' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  whatsappStatus: 'SENT' | 'CONFIRMED' | 'NOT_SENT';
  sterilizationLot?: string;
  paid?: boolean;
  date?: string;
}

export interface PatientOption {
  id?: string;
  name: string;
  phone: string;
  cpf?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: AppointmentItem) => void;
  onDelete?: (id: string) => void;
  appointmentToEdit?: AppointmentItem | null;
  initialPatientName?: string;
  existingAppointments: AppointmentItem[];
  registeredPatients: PatientOption[];
}

// Converte string 'HH:MM' em minutos desde a meia-noite
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

// Converte minutos desde a meia-noite para formato 'HH:MM'
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const COMMON_PROCEDURES = [
  'Avaliação Inicial + Diagnóstico Clínico',
  'Profilaxia + Aplicação Tópica de Flúor',
  'Restauração Direta em Resina Composta',
  'Tratamento Endodôntico (Canal)',
  'Exodontia Simples Cirúrgica',
  'Preparo Protético / Moldagem',
  'Instalação / Ajuste de Prótese',
  'Clareamento Dental em Consultório',
  'Remoção de Sutura / Pós-Operatório',
  'Urgência Odontológica / Dor Aguda',
  'Outro (Especificar)'
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  appointmentToEdit,
  initialPatientName,
  existingAppointments,
  registeredPatients
}) => {
  // Modo de paciente: Seleção ou Cadastro Rápido
  const [patientMode, setPatientMode] = useState<'SELECT' | 'QUICK_ADD'>('SELECT');
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [quickPatientName, setQuickPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  // Dados do agendamento
  const [date, setDate] = useState('2026-09-26');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState<number>(45);
  const [procedureSelect, setProcedureSelect] = useState(COMMON_PROCEDURES[0]);
  const [customProcedure, setCustomProcedure] = useState('');
  const [status, setStatus] = useState<AppointmentItem['status']>('SCHEDULED');
  const [whatsappStatus, setWhatsappStatus] = useState<AppointmentItem['whatsappStatus']>('NOT_SENT');
  const [notes, setNotes] = useState('');

  // Inicializa ou reseta formulário ao abrir
  useEffect(() => {
    if (isOpen) {
      if (appointmentToEdit) {
        // Modo Edição
        setSelectedPatientName(appointmentToEdit.patientName);
        setQuickPatientName('');
        setPatientPhone(appointmentToEdit.patientPhone);
        setDate(appointmentToEdit.date || '2026-09-26');
        setTime(appointmentToEdit.time);
        setDuration(appointmentToEdit.duration);
        
        if (COMMON_PROCEDURES.includes(appointmentToEdit.procedure)) {
          setProcedureSelect(appointmentToEdit.procedure);
          setCustomProcedure('');
        } else {
          setProcedureSelect('Outro (Especificar)');
          setCustomProcedure(appointmentToEdit.procedure);
        }

        setStatus(appointmentToEdit.status);
        setWhatsappStatus(appointmentToEdit.whatsappStatus || (appointmentToEdit.status === 'CONFIRMED' ? 'CONFIRMED' : 'NOT_SENT'));
        setNotes(appointmentToEdit.notes || '');
        setPatientMode('SELECT');
      } else {
        // Modo Criação
        const matched = initialPatientName
          ? registeredPatients.find((p) => p.name.toLowerCase() === initialPatientName.toLowerCase())
          : registeredPatients[0];
        const defaultPatient = matched?.name || initialPatientName || '';
        const defaultPhone = matched?.phone || '';
        setSelectedPatientName(defaultPatient);
        setQuickPatientName('');
        setPatientPhone(defaultPhone);
        setDate('2026-09-26');
        setTime('10:00');
        setDuration(45);
        setProcedureSelect(COMMON_PROCEDURES[0]);
        setCustomProcedure('');
        setStatus('SCHEDULED');
        setWhatsappStatus('NOT_SENT');
        setNotes('');
        setPatientMode('SELECT');
      }
    }
  }, [isOpen, appointmentToEdit, initialPatientName, registeredPatients]);

  if (!isOpen) return null;

  // Atualiza telefone quando seleciona um paciente registrado
  const handleSelectPatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPatientName(val);
    const found = registeredPatients.find((p) => p.name === val);
    if (found) {
      setPatientPhone(found.phone);
    }
  };

  // Motor Anti-Conflito de Horários
  const startMin = timeToMinutes(time);
  const endMin = startMin + duration;
  const formattedEndTime = minutesToTime(endMin);

  const conflictingAppointment = existingAppointments.find((app) => {
    // Não valida conflito contra si mesmo se estiver editando
    if (appointmentToEdit && app.id === appointmentToEdit.id) return false;
    // Ignora agendamentos cancelados
    if (app.status === 'CANCELLED') return false;

    // Se tiver data, verifica se é na mesma data (padrão 2026-09-26)
    const appDate = app.date || '2026-09-26';
    if (appDate !== date) return false;

    const existingStart = timeToMinutes(app.time);
    const existingEnd = existingStart + app.duration;

    // Regra de Sobreposição: startA < endB && endA > startB
    return startMin < existingEnd && endMin > existingStart;
  });

  const hasConflict = Boolean(conflictingAppointment);

  // Submissão do Formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasConflict) return;

    const patientNameFinal = patientMode === 'SELECT' ? selectedPatientName : quickPatientName.trim();
    if (!patientNameFinal) {
      alert('Por favor, informe o nome do paciente.');
      return;
    }

    const procedureFinal = procedureSelect === 'Outro (Especificar)' ? customProcedure.trim() : procedureSelect;
    if (!procedureFinal) {
      alert('Por favor, informe o procedimento da consulta.');
      return;
    }

    const savedItem: AppointmentItem = {
      id: appointmentToEdit ? appointmentToEdit.id : `app_${crypto.randomUUID()}`,
      time,
      duration,
      patientName: patientNameFinal,
      patientPhone: patientPhone.trim() || '(11) 90000-0000',
      procedure: procedureFinal,
      status,
      notes: notes.trim(),
      whatsappStatus: whatsappStatus || (status === 'CONFIRMED' ? 'CONFIRMED' : 'NOT_SENT'),
      sterilizationLot: appointmentToEdit?.sterilizationLot || 'LOTE-2609-01',
      paid: appointmentToEdit?.paid || false,
      date
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {appointmentToEdit ? 'Editar Agendamento Clínico' : 'Novo Agendamento Clínico'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Consultório Individual com Validação Anti-Conflito de Horário
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            {/* SEÇÃO 1: SELEÇÃO OU CADASTRO RÁPIDO DO PACIENTE */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Identificação do Paciente
              </label>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPatientMode('SELECT')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    patientMode === 'SELECT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Cadastrado
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('QUICK_ADD')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    patientMode === 'QUICK_ADD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  + Rápido
                </button>
              </div>
            </div>

            {patientMode === 'SELECT' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                    Selecionar Paciente:
                  </label>
                  <select
                    value={selectedPatientName}
                    onChange={handleSelectPatientChange}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                    required
                  >
                    {registeredPatients.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} {p.cpf ? `(${p.cpf})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                    Nome Completo do Novo Paciente:
                  </label>
                  <input
                    type="text"
                    value={quickPatientName}
                    onChange={(e) => setQuickPatientName(e.target.value)}
                    placeholder="Ex: Gabriel Martins"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                    Telefone / WhatsApp (Confirmação):
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="(11) 99876-5432"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: DATA, HORÁRIO E DURAÇÃO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Data do Atendimento:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Horário de Início:
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-bold bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Duração Estimada:
              </label>
              <div className="flex items-center gap-1">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all border ${
                      duration === mins
                        ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ALERTA VISUAL ANTI-CONFLITO OU SUCESSO DE HORÁRIO */}
          {hasConflict ? (
            <div className="p-3 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-2.5 text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Conflito de Horário Detectado:</strong>
                Já existe atendimento agendado para{' '}
                <span className="font-bold underline">{conflictingAppointment?.patientName}</span>{' '}
                das {conflictingAppointment?.time} às{' '}
                {minutesToTime(
                  timeToMinutes(conflictingAppointment?.time || '00:00') +
                    (conflictingAppointment?.duration || 0)
                )}.
                <div className="text-[11px] text-red-700 mt-1">
                  Selecione outro horário ou altere a duração para liberar a cadeira.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800">
              <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Horário Disponível: {time} às {formattedEndTime} ({duration} min)
              </span>
              <span className="text-[10px] text-emerald-600 font-bold uppercase">
                Sem Sobreposição
              </span>
            </div>
          )}

          {/* SEÇÃO 3: PROCEDIMENTO E MOTIVO */}
          <div className="space-y-2">
            <label className="block text-slate-600 font-semibold mb-1">
              Procedimento / Motivo da Consulta:
            </label>
            <select
              value={procedureSelect}
              onChange={(e) => setProcedureSelect(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
            >
              {COMMON_PROCEDURES.map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>

            {procedureSelect === 'Outro (Especificar)' && (
              <input
                type="text"
                value={customProcedure}
                onChange={(e) => setCustomProcedure(e.target.value)}
                placeholder="Digite a descrição detalhada do procedimento..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                required
              />
            )}
          </div>

          {/* SEÇÃO 4: STATUS DO ATENDIMENTO & OBSERVAÇÕES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Status do Agendamento:
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as any;
                  setStatus(newStatus);
                  if (newStatus === 'CONFIRMED' && whatsappStatus === 'NOT_SENT') {
                    setWhatsappStatus('CONFIRMED');
                  }
                }}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white font-medium"
              >
                <option value="SCHEDULED">Agendado (Aguardando)</option>
                <option value="CONFIRMED">Confirmado (WhatsApp)</option>
                <option value="WAITING_ROOM">Na Sala de Espera (Recepção)</option>
                <option value="IN_PROGRESS">Na Cadeira (Em Atendimento)</option>
                <option value="COMPLETED">Finalizado</option>
                <option value="CANCELLED">Cancelado / Desmarcado</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Disparo / Notificação WhatsApp:
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={whatsappStatus}
                  onChange={(e) => {
                    const newWs = e.target.value as AppointmentItem['whatsappStatus'];
                    setWhatsappStatus(newWs);
                    if (newWs === 'CONFIRMED' && status === 'SCHEDULED') {
                      setStatus('CONFIRMED');
                    }
                  }}
                  className="flex-1 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white font-medium"
                >
                  <option value="NOT_SENT">Não Enviado</option>
                  <option value="SENT">Lembrete Enviado</option>
                  <option value="CONFIRMED">Confirmado</option>
                </select>
                {patientPhone && (
                  <WhatsAppActionBtn
                    patientName={patientMode === 'SELECT' ? selectedPatientName : quickPatientName}
                    patientPhone={patientPhone}
                    appointmentDate={date}
                    appointmentTime={time}
                    onSent={() => {
                      setWhatsappStatus('SENT');
                      if (status === 'SCHEDULED') setStatus('CONFIRMED');
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Anotações Internas (Opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Paciente tem fobia de agulha, prefere anestésico sem vaso..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
            />
          </div>
        </div>

        {/* FOOTER & AÇÕES */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {appointmentToEdit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir o agendamento de ${appointmentToEdit.patientName}?`)) {
                  onDelete(appointmentToEdit.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors text-center"
            >
              Excluir Agendamento
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={hasConflict}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {appointmentToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>

      </form>

    </div>
  </div>
);
};
