import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  DollarSign,
  Pencil,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  UserCheck,
  FileText,
  HeartPulse,
  Filter,
  Eye,
  ArrowUpDown,
  LayoutGrid,
  List,
  X,
  Activity,
  AlertCircle
} from 'lucide-react';
import {
  Patient,
  ClinicalStatus,
  calculateAge,
  formatPhone
} from '../../types/patient';
import { openWhatsAppDirect } from '../../utils/whatsapp';

interface PatientsViewProps {
  patients: Patient[];
  onNewPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onOpenOdontogram: (patient: Patient) => void;
  onScheduleAppointment: (patient: Patient) => void;
  onCheckout: (patient: Patient) => void;
  dentistName?: string;
  clinicAddress?: string;
}

type SortOption = 'NAME_ASC' | 'RECENT' | 'ALERTS_FIRST' | 'RECALL_FIRST';

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  onNewPatient,
  onEditPatient,
  onDeletePatient,
  onOpenOdontogram,
  onScheduleAppointment,
  onCheckout,
  dentistName = 'Dra. Juliana Mendes',
  clinicAddress = 'Av. Paulista, 1000 - Conj. 42'
}) => {
  // Estados de busca, filtros e ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClinicalStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const [viewMode, setViewMode] = useState<'AUTO' | 'CARDS' | 'TABLE'>('AUTO');
  
  // Modal de Detalhes / Ficha Rápida do Paciente
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Patient | null>(null);

  // Helper para verificar alertas
  const hasCriticalAlerts = (p: Patient) => {
    const a = p.medicalAlerts;
    return Boolean(
      a.hypertension ||
      a.diabetes ||
      a.anticoagulant ||
      a.allergicPenicillin ||
      a.allergicAnesthetics ||
      a.allergicDipyroneNSAIDs ||
      a.pregnantOrLactating ||
      (a.allergies && a.allergies.length > 0)
    );
  };

  // Pacientes filtrados e ordenados
  const filteredPatients = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cleanSearchDigits = searchTerm.replace(/\D/g, '');

    const filtered = patients.filter((p) => {
      // 1. Filtro de Status
      if (statusFilter !== 'ALL' && p.status !== statusFilter) {
        return false;
      }

      // 2. Filtro de Texto
      if (!cleanSearch) return true;

      const matchesName = p.name.toLowerCase().includes(cleanSearch);
      const matchesCpf = p.cpf && p.cpf.replace(/\D/g, '').includes(cleanSearchDigits);
      const matchesPhone = p.phone && p.phone.replace(/\D/g, '').includes(cleanSearchDigits);
      const matchesEmail = p.email && p.email.toLowerCase().includes(cleanSearch);
      const matchesResponsible = p.financialResponsibleName && p.financialResponsibleName.toLowerCase().includes(cleanSearch);

      return Boolean(matchesName || matchesCpf || matchesPhone || matchesEmail || matchesResponsible);
    });

    // Ordenação
    return filtered.sort((a, b) => {
      if (sortBy === 'NAME_ASC') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'RECENT') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      if (sortBy === 'ALERTS_FIRST') {
        const aAlerts = hasCriticalAlerts(a) ? 1 : 0;
        const bAlerts = hasCriticalAlerts(b) ? 1 : 0;
        return bAlerts - aAlerts || a.name.localeCompare(b.name);
      }
      if (sortBy === 'RECALL_FIRST') {
        const aRecall = a.status === 'RECALL_DUE' ? 1 : 0;
        const bRecall = b.status === 'RECALL_DUE' ? 1 : 0;
        return bRecall - aRecall || a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [patients, searchTerm, statusFilter, sortBy]);

  // Contadores analíticos
  const totalCount = patients.length;
  const inTreatmentCount = patients.filter((p) => p.status === 'IN_TREATMENT').length;
  const dischargeCount = patients.filter((p) => p.status === 'CLINICAL_DISCHARGE').length;
  const recallDueCount = patients.filter((p) => p.status === 'RECALL_DUE').length;

  // Disparo de mensagem no WhatsApp
  const handleWhatsAppContact = (patient: Patient) => {
    let msg = `Olá, ${patient.name}! Tudo bem?\nAqui é da clínica odontológica de ${dentistName}.`;
    if (patient.status === 'RECALL_DUE') {
      msg += ` Notamos que já faz 6 meses desde seu último atendimento. Recomendamos agendar seu retorno para profilaxia e avaliação bucal preventiva!`;
    } else {
      msg += ` Estamos à disposição para qualquer dúvida ou para o seu próximo agendamento odontológico.`;
    }
    openWhatsAppDirect(patient.phone, msg);
  };

  // Helper para obter iniciais do nome
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Formata data ISO para PT-BR
  const formatDateBR = (isoDate?: string) => {
    if (!isoDate) return 'Sem registro';
    if (isoDate.includes('/')) return isoDate;
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* 1. HEADER DO MÓDULO COM MÉTRICAS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs border border-blue-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              Gestão de Pacientes & Prontuários
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span>{totalCount} cadastrados</span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">{inTreatmentCount} em tratamento</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">{dischargeCount} alta clínica</span>
              {recallDueCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">{recallDueCount} recall</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onNewPatient}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* 2. ALERTA DE RECALL / RETORNO PREVENTIVO (SE HOUVER) */}
      {recallDueCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">Oportunidade de Retenção & Profilaxia:</span>
              <span className="text-amber-800 ml-1">
                {recallDueCount} {recallDueCount === 1 ? 'paciente está' : 'pacientes estão'} há mais de 6 meses sem retorno. O contato ativo reforça a prevenção e o vínculo com a clínica.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'RECALL_DUE' ? 'ALL' : 'RECALL_DUE')}
            className={`shrink-0 px-3.5 py-1.5 font-bold rounded-xl transition-all text-xs cursor-pointer ${
              statusFilter === 'RECALL_DUE'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {statusFilter === 'RECALL_DUE' ? '✓ Filtrando Recalls' : `Ver Pacientes (${recallDueCount})`}
          </button>
        </div>
      )}

      {/* 3. BARRA DE BUSCA, FILTROS E MODO DE VISUALIZAÇÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Input de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Nome, CPF, WhatsApp ou Responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl py-2.5 pl-9 pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 focus:bg-white transition-colors"
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

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-xs text-slate-700 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent font-medium text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="NAME_ASC">Nome (A - Z)</option>
                <option value="RECENT">Cadastrados Recentemente</option>
                <option value="ALERTS_FIRST">Alertas Médicos Primeiro</option>
                <option value="RECALL_FIRST">Retorno / Recall Primeiro</option>
              </select>
            </div>

            {/* Alternador de Visualização (Desktop & Mobile) */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('AUTO')}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  viewMode === 'AUTO'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Inteligente (Tabela no PC, Cards no Celular)"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chips de Filtro por Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_TREATMENT')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'IN_TREATMENT'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Em Tratamento ({inTreatmentCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('CLINICAL_DISCHARGE')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'CLINICAL_DISCHARGE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Alta Clínica ({dischargeCount})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('RECALL_DUE')}
            className={`px-3 py-1.5 font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'RECALL_DUE'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Retorno / Recall ({recallDueCount})
          </button>
        </div>
      </div>

      {/* 4. CONTEÚDO: VAZIO OU LISTAGEM */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-12 text-center space-y-3 shadow-xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">Nenhum paciente encontrado</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos nenhum registro correspondente ao termo "{searchTerm}" com os filtros ativos.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Limpar Busca
              </button>
            )}
            <button
              type="button"
              onClick={onNewPatient}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Paciente
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* MODO CARDS RESPONSIVOS (EXIBIDO NO MOBILE OU SE FORÇADO) */}
          <div
            className={`space-y-3 ${
              viewMode === 'TABLE' ? 'hidden' : viewMode === 'CARDS' ? 'block' : 'block md:hidden'
            }`}
          >
            {filteredPatients.map((patient) => {
              const age = calculateAge(patient.birthDate);
              const alerts = patient.medicalAlerts;
              const hasAlerts = hasCriticalAlerts(patient);

              return (
                <div
                  key={patient.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 hover:border-blue-200 transition-all"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-100 text-sm">
                        {getInitials(patient.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm truncate">
                            {patient.name}
                          </h3>
                          {age !== null && (
                            <span className="text-[11px] font-medium text-slate-500">
                              ({age} anos)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>CPF: {patient.cpf || 'Não informado'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {patient.status === 'IN_TREATMENT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Tratamento
                        </span>
                      )}
                      {patient.status === 'CLINICAL_DISCHARGE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Alta
                        </span>
                      )}
                      {patient.status === 'RECALL_DUE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Recall
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contato & Informações Complementares */}
                  <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-slate-800 truncate">
                        {patient.phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWhatsAppContact(patient)}
                        className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                        title="Conversar no WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 shrink-0">
                      Última consulta: {formatDateBR(patient.lastAppointmentDate)}
                    </div>
                  </div>

                  {/* Alertas Médicos Críticos (se houver) */}
                  {hasAlerts && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {alerts.hypertension && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-100 text-red-800 border border-red-200">
                          Hipertenso
                        </span>
                      )}
                      {alerts.diabetes && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-100 text-red-800 border border-red-200">
                          Diabético
                        </span>
                      )}
                      {alerts.anticoagulant && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Anticoagulante
                        </span>
                      )}
                      {alerts.allergicPenicillin && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600 text-white">
                          Alergia Penicilina
                        </span>
                      )}
                      {alerts.allergicAnesthetics && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600 text-white">
                          Alergia Anestésico
                        </span>
                      )}
                      {alerts.allergicDipyroneNSAIDs && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600 text-white">
                          Alergia Dipirona/AINE
                        </span>
                      )}
                      {alerts.pregnantOrLactating && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          Gestante/Lactante
                        </span>
                      )}
                      {(alerts.allergies || []).map((alg) => (
                        <span key={alg} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-red-600 text-white">
                          Alergia: {alg}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Responsável DMED */}
                  {patient.hasFinancialResponsible && patient.financialResponsibleName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium">
                      <CreditCard className="w-3 h-3 text-purple-600" />
                      <span>DMED: {patient.financialResponsibleName} ({patient.financialResponsibleRelationship || 'Resp.'})</span>
                    </div>
                  )}

                  {/* Orçamento Pendente em Aberto (Gerado pelo Dentista na Cadeira) */}
                  {Boolean(patient.pendingBudgetAmount && patient.pendingBudgetAmount > 0) && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold min-w-0">
                        <DollarSign className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="truncate">Orçamento Aberto: R$ {patient.pendingBudgetAmount?.toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCheckout(patient)}
                        className="px-2.5 py-1 text-[11px] font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                      >
                        Cobrar no Balcão
                      </button>
                    </div>
                  )}

                  {/* BARRA DE AÇÕES RÁPIDAS NO CARD (NÃO SOBREPÕE) */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenOdontogram(patient)}
                      className="px-2 py-2 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="Atender na Cadeira / Prontuário"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="truncate">Prontuário</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onScheduleAppointment(patient)}
                      className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="Agendar Consulta"
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="truncate">Agendar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPatientForDetails(patient)}
                      className="px-2 py-2 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="Ver Ficha Completa"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="truncate">Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditPatient(patient)}
                      className="px-2 py-2 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="Editar Cadastro"
                    >
                      <Pencil className="w-3 h-3" />
                      <span className="truncate">Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MODO TABELA DESKTOP (EXIBIDO NO PC OU SE FORÇADO) */}
          <div
            className={`bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden ${
              viewMode === 'CARDS' ? 'hidden' : viewMode === 'TABLE' ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">Paciente & Cadastro</th>
                    <th className="py-3.5 px-4">WhatsApp & Contato</th>
                    <th className="py-3.5 px-4">Alertas Médicos Críticos</th>
                    <th className="py-3.5 px-4">Status & Última Consulta</th>
                    <th className="py-3.5 px-4 text-right pr-6">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPatients.map((patient) => {
                    const age = calculateAge(patient.birthDate);
                    const alerts = patient.medicalAlerts;
                    const hasAlerts = hasCriticalAlerts(patient);

                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* 1. Paciente & Cadastro */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 border border-blue-200 text-xs">
                              {getInitials(patient.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                  {patient.name}
                                </span>
                                {age !== null && (
                                  <span className="text-[11px] font-medium text-slate-500">
                                    ({age} anos)
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>CPF: {patient.cpf || 'Não informado'}</span>
                              </div>

                              {patient.hasFinancialResponsible && patient.financialResponsibleName && (
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                  <CreditCard className="w-3 h-3 text-purple-600" />
                                  <span>DMED: {patient.financialResponsibleName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Contato & WhatsApp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 font-mono text-xs">
                                {patient.phone}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleWhatsAppContact(patient)}
                                className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                                title="Abrir WhatsApp direto"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                            {patient.email && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {patient.email}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Alertas Médicos Críticos */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {alerts.hypertension && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Hipertensão
                              </span>
                            )}
                            {alerts.diabetes && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Diabetes
                              </span>
                            )}
                            {alerts.anticoagulant && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Anticoagulante
                              </span>
                            )}
                            {alerts.allergicPenicillin && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">
                                Alergia Penicilina
                              </span>
                            )}
                            {alerts.allergicAnesthetics && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">
                                Alergia Anestésico
                              </span>
                            )}
                            {alerts.allergicDipyroneNSAIDs && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">
                                Alergia Dipirona/AINE
                              </span>
                            )}
                            {alerts.pregnantOrLactating && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                Gestante/Lactante
                              </span>
                            )}
                            {(alerts.allergies || []).map((alg) => (
                              <span key={alg} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white">
                                {alg}
                              </span>
                            ))}
                            {!hasAlerts && (
                              <span className="text-[11px] text-slate-400 italic">
                                Sem alertas críticos
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Status & Última Consulta */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div>
                              {patient.status === 'IN_TREATMENT' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                  Em Tratamento
                                </span>
                              )}
                              {patient.status === 'CLINICAL_DISCHARGE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Alta Clínica
                                </span>
                              )}
                              {patient.status === 'RECALL_DUE' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Recall (6+ meses)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Última: {formatDateBR(patient.lastAppointmentDate)}
                            </div>
                            {Boolean(patient.pendingBudgetAmount && patient.pendingBudgetAmount > 0) && (
                              <button
                                type="button"
                                onClick={() => onCheckout(patient)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 text-[10px] font-bold cursor-pointer transition-colors mt-0.5"
                                title="Orçamento pendente gerado pelo dentista. Clique para cobrar."
                              >
                                <span>🏷️ Orçado: R$ {patient.pendingBudgetAmount?.toFixed(2)}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 5. Ações Rápidas */}
                        <td className="py-3.5 px-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1">
                            {/* Abrir Odontograma / Cadeira */}
                            <button
                              type="button"
                              onClick={() => onOpenOdontogram(patient)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                              title="Abrir Odontograma & Prontuário na Cadeira"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            {/* Agendar */}
                            <button
                              type="button"
                              onClick={() => onScheduleAppointment(patient)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                              title="Agendar Consulta"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>

                            {/* Cobrança / Balcão */}
                            <button
                              type="button"
                              onClick={() => onCheckout(patient)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                patient.pendingBudgetAmount && patient.pendingBudgetAmount > 0
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 shadow-2xs'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                              title={
                                patient.pendingBudgetAmount && patient.pendingBudgetAmount > 0
                                  ? `Cobrar Orçamento Pendente: R$ ${patient.pendingBudgetAmount.toFixed(2)}`
                                  : 'Abrir Checkout / Pagamento'
                              }
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>

                            {/* Ficha Completa */}
                            <button
                              type="button"
                              onClick={() => setSelectedPatientForDetails(patient)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                              title="Visualizar Ficha Cadastral"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => onEditPatient(patient)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                              title="Editar Dados Cadastrais"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Confirma a exclusão definitiva do paciente "${patient.name}"?`)) {
                                  onDeletePatient(patient.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors cursor-pointer"
                              title="Excluir Paciente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 5. MODAL DE FICHA COMPLETA DO PACIENTE */}
      {selectedPatientForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
            {/* Header da Ficha */}
            <div className="bg-blue-600 px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                  {getInitials(selectedPatientForDetails.name)}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {selectedPatientForDetails.name}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Ficha Cadastral & Resumo Clínico
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientForDetails(null)}
                className="text-blue-100 hover:text-white transition-colors cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo Rolável da Ficha */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Bloco 1: Dados Pessoais & Documentos */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Identificação & Documentos
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">CPF:</span>
                    <span className="font-semibold text-slate-800">{selectedPatientForDetails.cpf || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nascimento / Idade:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateBR(selectedPatientForDetails.birthDate)} ({calculateAge(selectedPatientForDetails.birthDate)} anos)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contato de Emergência:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedPatientForDetails.emergencyContactName
                        ? `${selectedPatientForDetails.emergencyContactName}${selectedPatientForDetails.secondaryPhone ? ` (${selectedPatientForDetails.secondaryPhone})` : ''}`
                        : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Contatos & Endereço */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Contato & Localização
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">WhatsApp / Telefone:</span>
                      <span className="font-bold text-slate-800">{selectedPatientForDetails.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppContact(selectedPatientForDetails)}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Conversar
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">E-mail:</span>
                    <span className="font-semibold text-slate-800 truncate block">{selectedPatientForDetails.email || 'Não informado'}</span>
                  </div>
                </div>
                {(selectedPatientForDetails.address || selectedPatientForDetails.city) && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      {selectedPatientForDetails.address}, {selectedPatientForDetails.number} {selectedPatientForDetails.neighborhood ? `- ${selectedPatientForDetails.neighborhood}` : ''}, {selectedPatientForDetails.city}/{selectedPatientForDetails.state} {selectedPatientForDetails.cep ? `(CEP: ${selectedPatientForDetails.cep})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Bloco 3: Alertas Médicos & Anamnese */}
              <div className="bg-red-50/50 rounded-xl p-3.5 border border-red-200 space-y-2">
                <h4 className="font-bold text-red-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5 text-red-600" />
                  Alertas Médicos & Condições Críticas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPatientForDetails.medicalAlerts.hypertension && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                      🚨 Hipertensão Arterial
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.diabetes && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 border border-red-300">
                      🚨 Diabetes Mellitus
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.anticoagulant && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠️ Anticoagulante (Atenção a Hemorragias)
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.allergicPenicillin && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white">
                      ⛔ Alergia a Penicilinas / Amoxicilina
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.allergicAnesthetics && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white">
                      ⛔ Alergia a Anestésicos Locais
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.allergicDipyroneNSAIDs && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white">
                      ⛔ Alergia a Dipirona / Anti-inflamatórios
                    </span>
                  )}
                  {selectedPatientForDetails.medicalAlerts.pregnantOrLactating && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
                      🤰 Gestante / Lactante
                    </span>
                  )}
                  {(selectedPatientForDetails.medicalAlerts.allergies || []).map((alg) => (
                    <span key={alg} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white">
                      ⛔ Alergia: {alg}
                    </span>
                  ))}
                  {!hasCriticalAlerts(selectedPatientForDetails) && (
                    <span className="text-slate-500 italic">
                      Nenhum alerta crítico relatado no cadastro inicial.
                    </span>
                  )}
                </div>
              </div>

              {/* Bloco 4: Responsável Financeiro (DMED) se houver */}
              {selectedPatientForDetails.hasFinancialResponsible && (
                <div className="bg-purple-50 rounded-xl p-3.5 border border-purple-200 space-y-1">
                  <h4 className="font-bold text-purple-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    Responsável Financeiro (Declaração DMED / Receita Federal)
                  </h4>
                  <p className="text-purple-800">
                    <strong>{selectedPatientForDetails.financialResponsibleName}</strong> ({selectedPatientForDetails.financialResponsibleRelationship || 'Responsável Legal'})
                    {selectedPatientForDetails.financialResponsibleCpf && ` • CPF: ${selectedPatientForDetails.financialResponsibleCpf}`}
                  </p>
                </div>
              )}
            </div>

            {/* Rodapé da Ficha com Ações Rápidas */}
            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPatientForDetails;
                    setSelectedPatientForDetails(null);
                    onOpenOdontogram(p);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Atender na Cadeira
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPatientForDetails;
                    setSelectedPatientForDetails(null);
                    onScheduleAppointment(p);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Agendar
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPatientForDetails(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsView;
