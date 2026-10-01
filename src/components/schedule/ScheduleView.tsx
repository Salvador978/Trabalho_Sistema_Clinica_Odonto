import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Phone,
  MessageSquare,
  Activity,
  CheckCircle2,
  DollarSign,
  Pencil,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Sparkles,
  AlertCircle,
  LayoutList,
  Grid,
  Check
} from 'lucide-react';
import { AppointmentItem, timeToMinutes, minutesToTime } from './AppointmentModal';
import { Patient } from '../../types/patient';
import { WhatsAppActionBtn } from './WhatsAppActionBtn';

interface ScheduleViewProps {
  appointments: AppointmentItem[];
  patientsList?: Patient[];
  onNewAppointment: () => void;
  onEditAppointment: (app: AppointmentItem) => void;
  onDeleteAppointment: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: AppointmentItem['status']) => void;
  onTriggerWhatsApp: (id: string) => void;
  onOpenCheckout: (app: AppointmentItem) => void;
  onOpenReceipt: (app: AppointmentItem) => void;
  onCallToChair: (app: AppointmentItem) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  appointments,
  patientsList = [],
  onNewAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onUpdateStatus,
  onTriggerWhatsApp,
  onOpenCheckout,
  onOpenReceipt,
  onCallToChair
}) => {
  // Data selecionada (Padrão: 2026-09-26 ou hoje)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-26');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'SLOTS'>('LIST');

  // Navegação de datas
  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate('2026-09-26');
  };

  // Formatação de data amigável em português
  const formattedDateTitle = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Filtragem dos agendamentos
  const dayAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Se tiver data definida no agendamento, compara com a data selecionada
      if (app.date && app.date !== selectedDate) {
        return false;
      }
      return true;
    });
  }, [appointments, selectedDate]);

  const filteredAppointments = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    return dayAppointments
      .filter((app) => {
        if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;
        if (!cleanSearch) return true;

        return (
          app.patientName.toLowerCase().includes(cleanSearch) ||
          app.patientPhone.includes(cleanSearch) ||
          app.procedure.toLowerCase().includes(cleanSearch) ||
          app.time.includes(cleanSearch)
        );
      })
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  }, [dayAppointments, filterStatus, searchTerm]);

  // Contadores do dia selecionado
  const total = dayAppointments.length;
  const inWaitingRoom = dayAppointments.filter((a) => a.status === 'WAITING_ROOM').length;
  const inProgress = dayAppointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completed = dayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const paidCount = dayAppointments.filter((a) => a.paid).length;

  // Grade de horários padrão do consultório (08:00 às 18:00 de 30 em 30 min)
  const scheduleSlots = useMemo(() => {
    const slots: { time: string; appointment?: AppointmentItem }[] = [];
    for (let m = 8 * 60; m <= 18 * 60; m += 30) {
      const timeStr = minutesToTime(m);
      const app = dayAppointments.find((a) => a.time === timeStr);
      slots.push({ time: timeStr, appointment: app });
    }
    return slots;
  }, [dayAppointments]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* 1. NAVEGADOR DE DATAS & HEADER DA AGENDA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs border border-blue-100 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
                {formattedDateTitle}
              </h2>
              {selectedDate === '2026-09-26' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  Hoje
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
              <span>{total} agendamentos</span>
              <span>•</span>
              <span className={inWaitingRoom > 0 ? 'text-amber-700 font-bold animate-pulse' : 'text-slate-600'}>
                {inWaitingRoom} na espera
              </span>
              <span>•</span>
              <span className="text-indigo-700 font-semibold">{inProgress} na cadeira</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{completed} concluídos</span>
            </p>
          </div>
        </div>

        {/* Controles de Navegação de Dias e Novo Agendamento */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navegador ◀ Hoje ▶ */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor de Data Direto */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-blue-500 cursor-pointer"
          />

          <button
            type="button"
            onClick={onNewAppointment}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto sm:ml-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE CARDS DE FLUXO DA RECEPÇÃO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
            {total}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Total do Dia
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {total} pacientes
            </span>
          </div>
        </div>

        {/* Card 2: Na Sala de Espera */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'WAITING_ROOM' ? 'ALL' : 'WAITING_ROOM')}
          className={`border rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all ${
            inWaitingRoom > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              inWaitingRoom > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {inWaitingRoom}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
              Na Sala de Espera
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {inWaitingRoom > 0 ? 'Aguardando cadeira' : 'Nenhum na espera'}
            </span>
          </div>
        </div>

        {/* Card 3: Na Cadeira */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`border rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all ${
            inProgress > 0
              ? 'bg-indigo-50/70 border-indigo-300 hover:bg-indigo-50 ring-2 ring-indigo-400/20'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
              inProgress > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {inProgress}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block truncate">
              Na Cadeira
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {inProgress > 0 ? 'Em procedimento' : 'Cadeira disponível'}
            </span>
          </div>
        </div>

        {/* Card 4: Concluídos & Pagos */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
            {completed}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block truncate">
              Concluídos
            </span>
            <span className="text-xs font-bold text-slate-800 truncate block">
              {paidCount} quitados no caixa
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTROS DE STATUS, BUSCA E MODO DE VISUALIZAÇÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Input de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, procedimento ou horário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl py-2 pl-9 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Seletor de Modo: Lista vs Grade de Horários */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Lista / Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SLOTS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'SLOTS'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grade Horária (Slots)</span>
            </button>
          </div>
        </div>

        {/* Chips de Status */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('WAITING_ROOM')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'WAITING_ROOM'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Na Espera ({inWaitingRoom})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Na Cadeira ({inProgress})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'COMPLETED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Concluídos ({completed})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('CONFIRMED')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'CONFIRMED'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Confirmados
          </button>
        </div>
      </div>

      {/* 4. VISUALIZAÇÃO: MODO LISTA / TIMELINE */}
      {viewMode === 'LIST' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">Nenhum agendamento encontrado</h4>
              <p className="max-w-xs mx-auto text-slate-400">
                Não há consultas cadastradas para {formattedDateTitle} com os filtros selecionados.
              </p>
              <button
                type="button"
                onClick={onNewAppointment}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agendar Consulta
              </button>
            </div>
          ) : (
            filteredAppointments.map((app) => {
              const statusMeta = {
                SCHEDULED: { label: 'Agendado', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
                CONFIRMED: { label: 'Confirmado WhatsApp', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                WAITING_ROOM: { label: 'Na Sala de Espera', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' },
                IN_PROGRESS: { label: 'Na Cadeira Odontológica', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold' },
                COMPLETED: { label: 'Finalizado', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                CANCELLED: { label: 'Cancelado', bg: 'bg-red-50 text-red-700 border-red-200' }
              }[app.status];

              const isWaiting = app.status === 'WAITING_ROOM';
              const isInProgress = app.status === 'IN_PROGRESS';
              const matchedPatient = (patientsList || []).find(
                (p) => p.name.toLowerCase() === app.patientName.toLowerCase()
              );
              const pendingBudget = matchedPatient?.pendingBudgetAmount;

              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isWaiting
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : isInProgress
                      ? 'bg-indigo-50/30 hover:bg-indigo-50/50'
                      : pendingBudget && pendingBudget > 0 && !app.paid
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Bloco Esquerda: Horário & Dados do Paciente */}
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="text-center shrink-0 w-16 p-2 rounded-2xl bg-slate-100 border border-slate-200 font-mono shadow-2xs">
                      <span className="block text-sm font-extrabold text-slate-800">{app.time}</span>
                      <span className="block text-[10px] text-slate-500 font-medium">{app.duration} min</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                          {app.patientName}
                        </h3>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${statusMeta.bg}`}>
                          {statusMeta.label}
                        </span>
                        {app.whatsappStatus === 'SENT' && app.status !== 'CONFIRMED' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Lembrete Enviado
                          </span>
                        )}
                        {app.paid ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Pago no Caixa
                          </span>
                        ) : pendingBudget && pendingBudget > 0 ? (
                          <button
                            type="button"
                            onClick={() => onOpenCheckout(app)}
                            className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Orçamento gerado pelo dentista durante a consulta. Clique para receber."
                          >
                            <span>🏷️ Orçado: R$ {pendingBudget.toFixed(2)}</span>
                          </button>
                        ) : null}
                      </div>

                      <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 truncate">
                        <span>🦷</span>
                        <span>{app.procedure}</span>
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {app.patientPhone}
                        </span>
                        {app.sterilizationLot && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            • Instrumental: {app.sterilizationLot}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloco Direita: Ações Rápidas (NUNCA SOBREPÕE NO MOBILE) */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full lg:w-auto pt-3 border-t border-slate-100 lg:border-0 lg:pt-0 shrink-0">
                    {/* Botão de Disparo WhatsApp */}
                    <WhatsAppActionBtn
                      patientName={app.patientName}
                      patientPhone={app.patientPhone}
                      appointmentDate={app.date || selectedDate}
                      appointmentTime={app.time}
                      onSent={() => onTriggerWhatsApp(app.id)}
                    />

                    {/* Botão de Fluxo 1: Chegou na Recepção */}
                    {(app.status === 'SCHEDULED' || app.status === 'CONFIRMED') && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(app.id, 'WAITING_ROOM')}
                        className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        Chegou na Recepção
                      </button>
                    )}

                    {/* Botão de Fluxo 2: Chamar para Cadeira */}
                    {app.status === 'WAITING_ROOM' && (
                      <button
                        type="button"
                        onClick={() => onCallToChair(app)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs animate-bounce"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Chamar para Cadeira
                      </button>
                    )}

                    {/* Botão de Fluxo 3: Finalizar & Cobrar */}
                    {app.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(app.id, 'COMPLETED')}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalizar e Cobrar
                      </button>
                    )}

                    {/* Botão de Fluxo 4: Cobrar no Balcão */}
                    {!app.paid && (app.status === 'COMPLETED' || (pendingBudget && pendingBudget > 0)) && (
                      <button
                        type="button"
                        onClick={() => onOpenCheckout(app)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                          pendingBudget && pendingBudget > 0
                            ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300'
                            : 'text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{pendingBudget && pendingBudget > 0 ? `Cobrar Orçamento (R$ ${pendingBudget.toFixed(2)})` : 'Cobrar no Balcão'}</span>
                      </button>
                    )}

                    {/* Botão de Fluxo 5: Ver Recibo */}
                    {app.status === 'COMPLETED' && app.paid && (
                      <button
                        type="button"
                        onClick={() => onOpenReceipt(app)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Ver Recibo CRO ➔
                      </button>
                    )}

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => onEditAppointment(app)}
                      title="Editar agendamento"
                      className="p-1.5 text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => onDeleteAppointment(app.id)}
                      title="Excluir agendamento"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. VISUALIZAÇÃO: MODO GRADE HORÁRIA (SLOT VIEW) */}
      {viewMode === 'SLOTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-700">
              Régua de Horários do Dia (08:00 às 18:30)
            </span>
            <span>Slots de 30 minutos</span>
          </div>

          <div className="space-y-2">
            {scheduleSlots.map((slot) => {
              const app = slot.appointment;

              if (app) {
                return (
                  <div
                    key={slot.time}
                    className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-16 font-mono font-bold text-xs text-blue-900 shrink-0">
                      {slot.time}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {app.patientName}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-white border border-blue-200 text-blue-700 font-semibold">
                          {app.duration}m
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{app.procedure}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {app.status === 'WAITING_ROOM' && (
                        <button
                          type="button"
                          onClick={() => onCallToChair(app)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                        >
                          Chamar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditAppointment(app)}
                        className="p-1 rounded-lg text-slate-600 hover:bg-white cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Horário Livre
              return (
                <div
                  key={slot.time}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="w-16 font-mono text-xs text-slate-400 font-medium">
                    {slot.time}
                  </div>
                  <div className="flex-1 text-[11px] text-slate-400 italic">
                    Horário Disponível
                  </div>
                  <button
                    type="button"
                    onClick={onNewAppointment}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    + Agendar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
