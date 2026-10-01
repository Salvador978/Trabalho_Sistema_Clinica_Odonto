import React, { useState } from 'react';
import {
  Users,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  AlertTriangle,
  X,
  Plus,
  Phone,
  ArrowRight,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { Patient, calculateAge } from '../../types/patient';
import { AppointmentItem } from '../schedule/AppointmentModal';

interface ActivePatientSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentActivePatientId: string;
  appointments: AppointmentItem[];
  patientsList: Patient[];
  onSelectPatient: (patient: Patient, appointmentId?: string) => void;
  onQuickNewPatient: () => void;
}

export const ActivePatientSwitchModal: React.FC<ActivePatientSwitchModalProps> = ({
  isOpen,
  onClose,
  currentActivePatientId,
  appointments,
  patientsList,
  onSelectPatient,
  onQuickNewPatient
}) => {
  const [activeTab, setActiveTab] = useState<'TODAY' | 'ALL'>('TODAY');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filtrar pacientes cadastrados pela busca
  const filteredPatients = patientsList.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      p.cpf.includes(term)
    );
  });

  // Localizar ou converter paciente de agendamento para Patient object
  const getPatientFromAppointment = (app: AppointmentItem): Patient => {
    const existing = patientsList.find(
      (p) => p.name.toLowerCase() === app.patientName.toLowerCase()
    );

    if (existing) return existing;

    // Se for um agendamento sem cadastro completo na lista, cria objeto transitório compatível
    return {
      id: `pat_${app.id}`,
      name: app.patientName,
      phone: app.patientPhone,
      cpf: '',
      birthDate: '1995-01-01',
      gender: 'OTHER',
      status: 'IN_TREATMENT',
      medicalAlerts: {
        hypertension: false,
        diabetes: false,
        anticoagulant: false,
        allergicPenicillin: false,
        allergicAnesthetics: false,
        allergicDipyroneNSAIDs: false,
        pregnantOrLactating: false,
        allergies: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
        {/* CABEÇALHO DO MODAL */}
        <div className="bg-blue-600 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              🦷
            </div>
            <div>
              <h3 className="font-bold text-base">Trocar Paciente na Cadeira</h3>
              <p className="text-xs text-blue-100">
                Selecione quem está em atendimento clínico para carregar o odontograma, anamnese e TCLE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUB-NAVEGAÇÃO: FILA DE HOJE VS TODOS OS PACIENTES */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 border border-slate-300/60">
            <button
              type="button"
              onClick={() => setActiveTab('TODAY')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'TODAY'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Agenda de Hoje
              <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full">
                {appointments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Todos os Cadastros
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] font-extrabold rounded-full">
                {patientsList.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onQuickNewPatient();
            }}
            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            + Novo Paciente Rápido
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL ROLÁVEL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* SELEÇÃO 1: FILA DE HOJE (ORDENADA POR PRIORIDADE DA SALA DE ESPERA) */}
          {activeTab === 'TODAY' && (
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">Nenhum agendamento cadastrado para hoje.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Buscar na lista geral de pacientes ➔
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Agrupamento: Sala de espera primeiro, depois os demais */}
                  {[...appointments]
                    .sort((a, b) => {
                      if (a.status === 'WAITING_ROOM') return -1;
                      if (b.status === 'WAITING_ROOM') return 1;
                      if (a.status === 'IN_PROGRESS') return -1;
                      if (b.status === 'IN_PROGRESS') return 1;
                      return 0;
                    })
                    .map((app) => {
                      const patientObj = getPatientFromAppointment(app);
                      const isCurrentlyActive =
                        patientObj.id === currentActivePatientId ||
                        patientObj.name.toLowerCase() === currentActivePatientId.toLowerCase();

                      const isWaiting = app.status === 'WAITING_ROOM';
                      const isInProgress = app.status === 'IN_PROGRESS';

                      return (
                        <div
                          key={app.id}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrentlyActive
                              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                              : isWaiting
                              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="text-center shrink-0 w-14 p-1.5 rounded-xl bg-slate-100 border border-slate-200 font-mono">
                              <span className="block text-xs font-black text-slate-800">{app.time}</span>
                              <span className="block text-[9px] text-slate-500 font-medium">{app.duration}m</span>
                            </div>

                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {app.patientName}
                                </h4>

                                {isCurrentlyActive && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                    Na Cadeira Agora
                                  </span>
                                )}

                                {isWaiting && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    Na Sala de Espera!
                                  </span>
                                )}

                                {app.status === 'CONFIRMED' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    Confirmado
                                  </span>
                                )}

                                {app.status === 'COMPLETED' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Finalizado
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 font-medium truncate">
                                🦷 {app.procedure}
                              </p>

                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {app.patientPhone}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                            {isCurrentlyActive ? (
                              <span className="text-xs font-bold text-blue-700 flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-xl">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                Selecionado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectPatient(patientObj, app.id);
                                  onClose();
                                }}
                                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isWaiting
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white animate-bounce'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                <Activity className="w-3.5 h-3.5" />
                                Chamar para Cadeira
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* SELEÇÃO 2: TODOS OS PACIENTES CADASTRADOS (BUSCA LIVRE) */}
          {activeTab === 'ALL' && (
            <div className="space-y-3">
              {/* Barra de Busca Rápida */}
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente por nome, CPF ou WhatsApp..."
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-500 bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {filteredPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">Nenhum paciente encontrado com "{searchTerm}".</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onQuickNewPatient();
                    }}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Cadastrar "{searchTerm}" como novo paciente
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {filteredPatients.map((pat) => {
                    const isCurrentlyActive = pat.id === currentActivePatientId;
                    const age = calculateAge(pat.birthDate);

                    return (
                      <div
                        key={pat.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentlyActive
                            ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isCurrentlyActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {pat.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {pat.name}
                              </h4>
                              {isCurrentlyActive && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                                  Ativo na Cadeira
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 truncate">
                              CPF: {pat.cpf || 'Não informado'} • Tel: {pat.phone} {age !== null ? `• ${age} anos` : ''}
                            </p>

                            {/* Alertas Médicos */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {pat.medicalAlerts.hypertension && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                                  Hipertenso
                                </span>
                              )}
                              {pat.medicalAlerts.diabetes && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-800">
                                  Diabético
                                </span>
                              )}
                              {pat.medicalAlerts.anticoagulant && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                  Anticoagulante
                                </span>
                              )}
                              {(pat.medicalAlerts.allergies || []).map((al) => (
                                <span key={al} className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-600 text-white">
                                  Alergia: {al}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          {isCurrentlyActive ? (
                            <span className="text-xs font-bold text-blue-700 flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              Na Cadeira
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPatient(pat);
                                onClose();
                              }}
                              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Atender Este Paciente
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Ao selecionar, o <strong>Odontograma</strong>, <strong>TCLE</strong> e <strong>Galeria Radiográfica</strong> carregarão os dados deste paciente imediatamente.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
export default ActivePatientSwitchModal;
