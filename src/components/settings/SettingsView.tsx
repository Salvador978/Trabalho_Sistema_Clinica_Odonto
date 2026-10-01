import React, { useState, useRef } from 'react';
import {
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  Trash2,
  Users,
  Phone,
  Mail,
  Clock,
  Calendar,
  Briefcase,
  Plus,
  Pencil,
  Check,
  Sparkles,
  UserCheck,
  FileText,
  BadgeCheck,
  RotateCw,
  X
} from 'lucide-react';
import { ClinicSettings, ReceptionistProfile, DEFAULT_CLINIC_SETTINGS, DEFAULT_PROCEDURES } from '../../types/settings';
import { ProcedurePricingTable } from './ProcedurePricingTable';

import { downloadBackupJson, restoreBackupPayload, clearAppStorage } from '../../services/storage';

interface SettingsViewProps {
  settings: ClinicSettings;
  onSaveSettings: (newSettings: ClinicSettings) => void;
  onBackupRestored: (data: any) => void;
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  stats: {
    appointmentsCount: number;
    patientsCount: number;
    inventoryCount: number;
    labOrdersCount: number;
    transactionsCount: number;
  };
}

type SettingsSubTab = 'CLINIC' | 'PROCEDURES' | 'RECEPTION' | 'BACKUP';


export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onBackupRestored,
  currentUserRole,
  stats
}) => {
  const [formData, setFormData] = useState<ClinicSettings>(() => {
    let initialClinicName = settings.clinicName;
    if (
      (!initialClinicName || initialClinicName === 'Consultório Odontológico Dra. Juliana Mendes') &&
      settings.dentistName &&
      settings.dentistName !== 'Dra. Juliana Mendes'
    ) {
      initialClinicName = `Consultório Odontológico ${settings.dentistName.trim()}`;
    }

    return {
      ...settings,
      clinicName: initialClinicName,
      receptionistName: settings.receptionistName || 'Mariana Costa',
      receptionistRoleTitle: settings.receptionistRoleTitle || 'Recepcionista & Balcão',
      receptionistCpf: settings.receptionistCpf || '456.789.012-34',
      receptionistPhone: settings.receptionistPhone || '(11) 97123-4567',
      receptionistEmail: settings.receptionistEmail || 'recepcao@consultorioodonto.com.br',
      receptionistSchedule: settings.receptionistSchedule || '08:00 às 17:00 (1h de almoço)',
      receptionistWorkDays: settings.receptionistWorkDays || 'Segunda a Sexta-feira',
      receptionistNotes: settings.receptionistNotes || 'Responsável pelo acolhimento presencial, confirmações ativas no WhatsApp, triagem inicial no tablet e conferência de maquininha de cartão no fechamento diário.',
      receptionistsTeam: settings.receptionistsTeam && settings.receptionistsTeam.length > 0
        ? settings.receptionistsTeam
        : [
            {
              id: 'rec_01',
              name: settings.receptionistName || 'Mariana Costa',
              roleTitle: settings.receptionistRoleTitle || 'Recepcionista & Balcão',
              cpf: settings.receptionistCpf || '456.789.012-34',
              phone: settings.receptionistPhone || '(11) 97123-4567',
              email: settings.receptionistEmail || 'recepcao@consultorioodonto.com.br',
              schedule: settings.receptionistSchedule || '08:00 às 17:00',
              workDays: settings.receptionistWorkDays || 'Segunda a Sexta-feira',
              startDate: '2024-02-15',
              notes: 'Operadora principal do balcão e agenda.',
              active: true
            }
          ]
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>('CLINIC');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para modal/formulário de membro da equipe de recepção
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ReceptionistProfile | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<ReceptionistProfile>>({
    name: '',
    roleTitle: 'Recepcionista & Balcão',
    cpf: '',
    phone: '',
    email: '',
    schedule: '08:00 às 17:00',
    workDays: 'Segunda a Sexta-feira',
    startDate: '',
    notes: '',
    active: false
  });

  const isDentist = currentUserRole === 'DENTIST';

  const handleInputChange = (field: keyof ClinicSettings, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Quando o nome do dentista é alterado, sincroniza automaticamente o nome do consultório
      if (field === 'dentistName') {
        const newName = String(value || '').trim();
        const wasDefaultOrMatching =
          !prev.clinicName ||
          prev.clinicName === 'Consultório Odontológico Dra. Juliana Mendes' ||
          prev.clinicName === 'Consultório Odontológico' ||
          prev.clinicName.startsWith('Consultório Odontológico');

        if (wasDefaultOrMatching) {
          updated.clinicName = newName ? `Consultório Odontológico ${newName}` : 'Consultório Odontológico';
        }
      }

      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSave = (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    if (!isDentist) {
      alert('Apenas o Cirurgião-Dentista titular pode alterar os parâmetros cadastrais e fiscais da clínica.');
      return;
    }
    onSaveSettings(formData);
    setSaveMessage(customMsg || 'Configurações salvas com sucesso! Os novos dados já estão ativos no sistema.');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Definir um colaborador da equipe como operador ativo principal
  const handleSetActiveOperator = (member: ReceptionistProfile) => {
    const updatedTeam = (formData.receptionistsTeam || []).map((m) => ({
      ...m,
      active: m.id === member.id
    }));

    const newSettings: ClinicSettings = {
      ...formData,
      receptionistName: member.name,
      receptionistRoleTitle: member.roleTitle,
      receptionistCpf: member.cpf,
      receptionistPhone: member.phone,
      receptionistEmail: member.email,
      receptionistSchedule: member.schedule,
      receptionistWorkDays: member.workDays,
      receptionistNotes: member.notes || formData.receptionistNotes,
      receptionistsTeam: updatedTeam
    };

    setFormData(newSettings);
    onSaveSettings(newSettings);
    setSaveMessage(`"${member.name}" agora é a operadora ativa da Recepção e Balcão!`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Abrir modal para novo colaborador
  const handleOpenNewMemberModal = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      roleTitle: 'Recepcionista & Balcão',
      cpf: '',
      phone: '',
      email: '',
      schedule: '08:00 às 17:00',
      workDays: 'Segunda a Sexta-feira',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      active: false
    });
    setIsTeamModalOpen(true);
  };

  // Abrir modal para editar colaborador existente
  const handleOpenEditMemberModal = (member: ReceptionistProfile) => {
    setEditingMember(member);
    setMemberForm({ ...member });
    setIsTeamModalOpen(true);
  };

  // Salvar colaborador da equipe
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name?.trim()) {
      alert('Por favor, informe o nome completo do colaborador da recepção.');
      return;
    }

    let updatedTeam = [...(formData.receptionistsTeam || [])];

    if (editingMember) {
      // Edição
      updatedTeam = updatedTeam.map((m) =>
        m.id === editingMember.id ? ({ ...m, ...memberForm } as ReceptionistProfile) : m
      );
    } else {
      // Criação
      const newMember: ReceptionistProfile = {
        id: `rec_${Date.now()}`,
        name: memberForm.name || '',
        roleTitle: memberForm.roleTitle || 'Recepcionista & Balcão',
        cpf: memberForm.cpf || '',
        phone: memberForm.phone || '',
        email: memberForm.email || '',
        schedule: memberForm.schedule || '08:00 às 17:00',
        workDays: memberForm.workDays || 'Segunda a Sexta-feira',
        startDate: memberForm.startDate,
        notes: memberForm.notes,
        active: updatedTeam.length === 0
      };
      updatedTeam.push(newMember);
    }

    const newSettings: ClinicSettings = {
      ...formData,
      receptionistsTeam: updatedTeam
    };

    setFormData(newSettings);
    onSaveSettings(newSettings);
    setIsTeamModalOpen(false);
    setSaveMessage('Colaborador de recepção salvo com sucesso na equipe!');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Excluir colaborador da equipe
  const handleDeleteMember = (id: string, name: string) => {
    if ((formData.receptionistsTeam || []).length <= 1) {
      alert('É necessário manter pelo menos um colaborador cadastrado na equipe de recepção.');
      return;
    }

    if (!confirm(`Deseja realmente remover "${name}" da equipe da recepção?`)) return;

    const updatedTeam = (formData.receptionistsTeam || []).filter((m) => m.id !== id);
    const wasActive = formData.receptionistsTeam?.find((m) => m.id === id)?.active;

    let newActiveName = formData.receptionistName;
    if (wasActive && updatedTeam.length > 0) {
      updatedTeam[0].active = true;
      newActiveName = updatedTeam[0].name;
    }

    const newSettings: ClinicSettings = {
      ...formData,
      receptionistName: newActiveName,
      receptionistsTeam: updatedTeam
    };

    setFormData(newSettings);
    onSaveSettings(newSettings);
  };

  // Funções de backup
  const handleExportBackup = () => {
    downloadBackupJson(formData.dentistCro);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const result = restoreBackupPayload(parsed);

        if (result.success) {
          setRestoreFeedback({
            type: 'success',
            message: 'Backup restaurado com sucesso! Os cadastros, recepção, estoque e financeiro foram sincronizados.'
          });
          if (result.data) {
            onBackupRestored(result.data);
            if (result.data.settings) {
              setFormData({ ...DEFAULT_CLINIC_SETTINGS, ...result.data.settings });
            }
          }
        } else {
          setRestoreFeedback({
            type: 'error',
            message: result.message
          });
        }
      } catch (err) {
        setRestoreFeedback({
          type: 'error',
          message: 'Falha ao interpretar arquivo JSON. Verifique se o arquivo não está corrompido.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    const confirm1 = window.confirm(
      '⚠️ ATENÇÃO: Esta ação apagará todos os dados salvos localmente e restaurará o estado inicial de fábrica. Deseja continuar?'
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      'Tem certeza absoluta? Certifique-se de que exportou um backup antes de prosseguir!'
    );
    if (!confirm2) return;

    clearAppStorage();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO GERAL DA TELA DE CONFIGURAÇÕES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              Configurações Gerais & Parâmetros do Consultório
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametrização oficial da clínica, equipe da recepção, meios de pagamento e salvaguarda de dados
          </p>
        </div>

        {!isDentist && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Visualização de Recepção (Edição Bloqueada)</span>
          </div>
        )}
      </div>

      {/* 2. SUB-NAVEGAÇÃO EM ABAS INTERNAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveSubTab('CLINIC')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'CLINIC'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200 sm:border-transparent sm:bg-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Clínica & Dentista Titular
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('PROCEDURES')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'PROCEDURES'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200 sm:border-transparent sm:bg-transparent'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Tabela de Procedimentos & Preços
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
            {formData.procedurePricings?.length || DEFAULT_PROCEDURES.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('RECEPTION')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'RECEPTION'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200 sm:border-transparent sm:bg-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          Equipe da Recepção & Atendimento
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
            {formData.receptionistsTeam?.length || 1}
          </span>
        </button>


        <button
          type="button"
          onClick={() => setActiveSubTab('BACKUP')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'BACKUP'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200 sm:border-transparent sm:bg-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Backup & Salvaguarda Local
        </button>
      </div>

      {/* FEEDBACKS GLOBAIS DE SALVAMENTO E RESTAURAÇÃO */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {restoreFeedback && (
        <div
          className={`border rounded-xl p-3.5 flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            restoreFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {restoreFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{restoreFeedback.message}</span>
          <button
            type="button"
            onClick={() => setRestoreFeedback(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 font-normal"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 1: CLÍNICA & DENTISTA TITULAR (BRANDING, CRO, PIN, MAQUININHA)   */}
      {/* ==================================================================== */}
      {activeSubTab === 'CLINIC' && (
        <form onSubmit={(e) => handleSave(e, 'Parâmetros oficiais da clínica e do dentista atualizados com sucesso!')} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: DADOS PROFISSIONAIS E DA CLÍNICA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cirurgião-Dentista Titular & Branding
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nome Completo do Dentista Titular:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isDentist}
                    value={formData.dentistName}
                    onChange={(e) => handleInputChange('dentistName', e.target.value)}
                    placeholder="Ex: Dra. Juliana Mendes"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Número de Inscrição no CRO / UF:
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isDentist}
                      value={formData.dentistCro}
                      onChange={(e) => handleInputChange('dentistCro', e.target.value)}
                      placeholder="Ex: CRO-SP 123.456"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500 font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      CPF do Profissional (DMED / Carnê-Leão):
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isDentist}
                      value={formData.dentistCpf}
                      onChange={(e) => handleInputChange('dentistCpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Nome Fantasia da Clínica / Consultório:
                    </label>
                    <button
                      type="button"
                      disabled={!isDentist}
                      onClick={() => {
                        const newName = formData.dentistName.trim()
                          ? `Consultório Odontológico ${formData.dentistName.trim()}`
                          : 'Consultório Odontológico';
                        handleInputChange('clinicName', newName);
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Sincronizar automaticamente com o nome do dentista titular"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Sincronizar c/ Nome do Dentista</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    disabled={!isDentist}
                    value={formData.clinicName}
                    onChange={(e) => handleInputChange('clinicName', e.target.value)}
                    placeholder="Ex: Consultório Odontológico"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500 font-medium"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nome exibido no cabeçalho superior do sistema, atestados, receituários e documentos.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      CNPJ da Clínica (Opcional):
                    </label>
                    <input
                      type="text"
                      disabled={!isDentist}
                      value={formData.clinicCnpj}
                      onChange={(e) => handleInputChange('clinicCnpj', e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Telefone / WhatsApp de Contato:
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isDentist}
                      value={formData.clinicPhone}
                      onChange={(e) => handleInputChange('clinicPhone', e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Endereço Físico Completo (Cabeçalho de Receituários & TCLE):
                  </label>
                  <textarea
                    rows={2}
                    required
                    disabled={!isDentist}
                    value={formData.clinicAddress}
                    onChange={(e) => handleInputChange('clinicAddress', e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Sala 42, Bela Vista, São Paulo - SP"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-blue-500"
                  />
                </div>

                {/* SEGURANÇA & PIN DO DENTISTA */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>PIN de Acesso Seguro do Cirurgião-Dentista (4 Dígitos)</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Código numérico exigido para alternar do perfil de Recepção para o Dentista Titular (Proteção LGPD Art. 11 e Sigilo Ético CFO).
                  </p>
                  <div className="w-36">
                    <input
                      type="password"
                      maxLength={4}
                      required
                      disabled={!isDentist}
                      value={formData.dentistPin || '1234'}
                      onChange={(e) => handleInputChange('dentistPin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-800 disabled:bg-slate-50 focus:outline-blue-500 font-bold bg-white"
                      placeholder="1234"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PARÂMETROS FINANCEIROS & MEIOS DE PAGAMENTO */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Parâmetros Financeiros & Maquininha
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <QrCode className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Chave PIX Oficial de Recebimento no Balcão</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">Tipo:</label>
                      <select
                        disabled={!isDentist}
                        value={formData.pixKeyType}
                        onChange={(e) => handleInputChange('pixKeyType', e.target.value)}
                        className="w-full border border-emerald-300 rounded-lg p-1.5 text-xs bg-white text-slate-800 font-semibold"
                      >
                        <option value="CNPJ">CNPJ</option>
                        <option value="CPF">CPF</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="PHONE">Celular</option>
                        <option value="RANDOM">Chave Aleatória</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">Chave:</label>
                      <input
                        type="text"
                        required
                        disabled={!isDentist}
                        value={formData.pixKey}
                        onChange={(e) => handleInputChange('pixKey', e.target.value)}
                        placeholder="Ex: 45.123.789/0001-10"
                        className="w-full border border-emerald-300 rounded-lg p-1.5 text-xs bg-white text-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Apresentada no balcão com QR Code dinâmico e botão de cópia instantânea.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">
                    Taxas Padrão de Maquininha (Operadoras de Cartão)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Taxa Cartão de Débito (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="10"
                          required
                          disabled={!isDentist}
                          value={formData.debitCardFee}
                          onChange={(e) => handleInputChange('debitCardFee', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-slate-800 bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Padrão de mercado: 1.0% a 1.5%</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Taxa Cartão de Crédito à Vista (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="15"
                          required
                          disabled={!isDentist}
                          value={formData.creditCardFee}
                          onChange={(e) => handleInputChange('creditCardFee', parseFloat(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-bold text-slate-800 bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">Padrão de mercado: 2.5% a 3.5%</span>
                    </div>
                  </div>
                </div>

                {isDentist && (
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Parâmetros do Consultório
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* ABA: TABELA DE PROCEDIMENTOS & PREÇOS (SOLICITAÇÃO DO USUÁRIO)      */}
      {/* ==================================================================== */}
      {activeSubTab === 'PROCEDURES' && (
        <ProcedurePricingTable
          procedures={formData.procedurePricings || DEFAULT_PROCEDURES}
          onUpdateProcedures={(newProcs) => {
            const updated: ClinicSettings = { ...formData, procedurePricings: newProcs };
            setFormData(updated);
            onSaveSettings(updated);
          }}
          isReadOnly={!isDentist}
        />
      )}

      {/* ==================================================================== */}
      {/* ABA 2: EQUIPE DA RECEPÇÃO & ATENDIMENTO (SOLICITAÇÃO DO USUÁRIO)     */}
      {/* ==================================================================== */}
      {activeSubTab === 'RECEPTION' && (

        <div className="space-y-6">
          {/* HEADER DA ABA DE RECEPÇÃO */}
          <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                👩‍💼
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-emerald-950">
                    Operador Ativo no Balcão: {formData.receptionistName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/70 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                    {formData.receptionistRoleTitle}
                  </span>
                </div>
                <p className="text-xs text-emerald-800">
                  Horário: <strong>{formData.receptionistSchedule}</strong> ({formData.receptionistWorkDays}) | Tel: <strong>{formData.receptionistPhone}</strong>
                </p>
                <p className="text-[11px] text-emerald-700">
                  Este nome é registrado automaticamente nos fechamentos diários de caixa e relatórios de atendimento.
                </p>
              </div>
            </div>

            {isDentist && (
              <button
                type="button"
                onClick={handleOpenNewMemberModal}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                Novo Colaborador de Recepção
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUNA ESQUERDA (2 COLS): FORMULÁRIO DETALHADO DO OPERADOR PRINCIPAL */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dados Cadastrais do(a) Recepcionista Titular
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Operador do Balcão
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome Completo do(a) Recepcionista: *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        disabled={!isDentist}
                        value={formData.receptionistName}
                        onChange={(e) => handleInputChange('receptionistName', e.target.value)}
                        placeholder="Ex: Mariana Costa"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-500 bg-white"
                      />
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Cargo / Função no Consultório: *
                    </label>
                    <div className="relative">
                      <select
                        disabled={!isDentist}
                        value={formData.receptionistRoleTitle}
                        onChange={(e) => handleInputChange('receptionistRoleTitle', e.target.value)}
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 bg-white"
                      >
                        <option value="Recepcionista & Balcão">Recepcionista & Balcão</option>
                        <option value="Secretária Executiva">Secretária Executiva</option>
                        <option value="Auxiliar de Saúde Bucal (ASB)">Auxiliar de Saúde Bucal (ASB)</option>
                        <option value="Técnico em Saúde Bucal (TSB)">Técnico em Saúde Bucal (TSB)</option>
                        <option value="Gerente de Atendimento">Gerente de Atendimento</option>
                        <option value="Atendente Geral">Atendente Geral</option>
                      </select>
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CPF / Documento:
                    </label>
                    <input
                      type="text"
                      disabled={!isDentist}
                      value={formData.receptionistCpf}
                      onChange={(e) => handleInputChange('receptionistCpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-emerald-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp: *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        disabled={!isDentist}
                        value={formData.receptionistPhone}
                        onChange={(e) => handleInputChange('receptionistPhone', e.target.value)}
                        placeholder="(11) 97123-4567"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 bg-white"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      E-mail Institucional:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled={!isDentist}
                        value={formData.receptionistEmail}
                        onChange={(e) => handleInputChange('receptionistEmail', e.target.value)}
                        placeholder="recepcao@consultorio.com"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-emerald-500 bg-white"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Horário de Expediente / Turno:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isDentist}
                        value={formData.receptionistSchedule}
                        onChange={(e) => handleInputChange('receptionistSchedule', e.target.value)}
                        placeholder="Ex: 08:00 às 17:00 (1h almoço)"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-white"
                      />
                      <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Dias de Trabalho / Escala:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={!isDentist}
                        value={formData.receptionistWorkDays}
                        onChange={(e) => handleInputChange('receptionistWorkDays', e.target.value)}
                        placeholder="Ex: Segunda a Sexta-feira"
                        className="w-full border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-white"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Instruções Operacionais e Atribuições Específicas do Consultório:
                  </label>
                  <textarea
                    rows={3}
                    disabled={!isDentist}
                    value={formData.receptionistNotes}
                    onChange={(e) => handleInputChange('receptionistNotes', e.target.value)}
                    placeholder="Orientações do dentista: recepção presencial, conferência de fundo de troco, disparo de WhatsApp, entrega do tablet na sala de espera..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500 bg-white"
                  />
                </div>

                {isDentist && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSave(undefined, 'Dados da recepcionista titular atualizados com sucesso!')}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      Salvar Dados da Recepção
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* COLUNA DIREITA (1 COL): EQUIPE CADASTRADA & ATALHO DE OPERADORES */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Equipe Cadastrada ({formData.receptionistsTeam?.length || 0})
                    </h3>
                  </div>
                  {isDentist && (
                    <button
                      type="button"
                      onClick={handleOpenNewMemberModal}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {(!formData.receptionistsTeam || formData.receptionistsTeam.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Nenhum colaborador adicional cadastrado.
                    </div>
                  ) : (
                    formData.receptionistsTeam.map((member) => {
                      const isActive = member.name === formData.receptionistName || member.active;

                      return (
                        <div
                          key={member.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isActive
                              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                              : 'bg-slate-50 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-800">{member.name}</span>
                                {isActive && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block font-medium">
                                {member.roleTitle}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {member.schedule} • {member.phone}
                              </span>
                            </div>

                            {isDentist && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMemberModal(member)}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Editar colaborador"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {formData.receptionistsTeam && formData.receptionistsTeam.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMember(member.id, member.name)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Remover colaborador"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {!isActive && isDentist && (
                            <div className="pt-2 mt-2 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => handleSetActiveOperator(member)}
                                className="w-full py-1 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer text-center"
                              >
                                Definir como Operador(a) Ativo(a)
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* CARD DE DIRETRIZES & PERMISSÕES DO BALCÃO */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Diretrizes do Balcão (LGPD / CFO)
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Agenda & Presença:</strong> Abertura de horários, confirmação WhatsApp e aviso de chegada.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Tablet Recepção:</strong> Coleta de assinatura e anamnese na sala de espera.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Fechamento de Caixa:</strong> Conciliação diária de PIX e maquininhas.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-500 pt-1 border-t border-slate-100">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px]">Bloqueio de prontuário sigiloso, evoluções clínicas e receituário controlado.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 3: BACKUP & SALVAGUARDA DE DADOS                                 */}
      {/* ==================================================================== */}
      {activeSubTab === 'BACKUP' && (
        <div className="space-y-6">
          {/* CARD DE BACKUP LOCAL */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Salvaguarda de Emergência dos Dados da Clínica (Backup Local-First)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Garante que os cadastros, prontuários, equipe da recepção e fechamento de caixa possam ser exportados e restaurados
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                100% Offline / Privado
              </span>
            </div>

            {/* Resumo Estatístico do Banco Local */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Consultas</span>
                <div className="text-lg font-black text-slate-800">{stats.appointmentsCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pacientes</span>
                <div className="text-lg font-black text-slate-800">{stats.patientsCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Itens Estoque</span>
                <div className="text-lg font-black text-slate-800">{stats.inventoryCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Protéticos O.S.</span>
                <div className="text-lg font-black text-slate-800">{stats.labOrdersCount}</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Lançamentos</span>
                <div className="text-lg font-black text-slate-800">{stats.transactionsCount}</div>
              </div>
            </div>

            {/* Alerta de Mitigação de Risco */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Recomendação Operacional para o Fim do Expediente:</span>
                <p className="text-amber-800 leading-relaxed">
                  Baixe o arquivo de backup no fim do dia e salve em um pendrive ou pasta sincronizada com Google Drive/OneDrive. O processo leva menos de 5 segundos e impede perda de dados caso o navegador seja limpo.
                </p>
              </div>
            </div>

            {/* Ações de Backup */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Exportar Backup do Consultório (.json)
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                Restaurar Backup (.json)
              </button>

              {isDentist && (
                <button
                  type="button"
                  onClick={handleResetData}
                  title="Apaga os dados locais e reinicia com a base original de exemplo"
                  className="ml-auto px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Resetar para Padrão de Fábrica
                </button>
              )}
            </div>
          </div>

          {/* MATRIZ DE PERMISSÕES & SIGILO PROFISSIONAL (CFO / LGPD) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Diretrizes de Sigilo Ativas no Sistema (CFO / LGPD Art. 11)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Perfil Cirurgião-Dentista Titular (Acesso Total)
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  Acesso irrestrito a prontuários clínicos, emissão de receitas medicamentosas ágeis (antibióticos/analgésicos), odontograma ativo, parametrização do CRO, e ao Livro Caixa consolidado com cálculo de lucro líquido e deduções do Carnê-Leão / DMED.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Perfil Recepção (Operação de Atendimento)
                </div>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  Acesso à Agenda do Dia, disparos de confirmação de WhatsApp em 1 clique, abertura da Anamnese no Tablet para o paciente, e ao Balcão de Recebimento com Fechamento Diário de Caixa. <strong>Bloqueio estrito</strong> de anotações médicas confidenciais, emissão de receituários e demonstrativos de lucro do dentista.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CADASTRO / EDIÇÃO DE COLABORADOR DA EQUIPE DE RECEPÇÃO        */}
      {/* ==================================================================== */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in">
            <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {editingMember ? 'Editar Colaborador de Recepção' : 'Novo Colaborador de Recepção'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="text-emerald-100 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo: *
                  </label>
                  <input
                    type="text"
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    placeholder="Ex: Amanda Silva"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cargo / Função: *
                    </label>
                    <select
                      value={memberForm.roleTitle}
                      onChange={(e) => setMemberForm({ ...memberForm, roleTitle: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 bg-white"
                    >
                      <option value="Recepcionista & Balcão">Recepcionista & Balcão</option>
                      <option value="Secretária Executiva">Secretária Executiva</option>
                      <option value="Auxiliar de Saúde Bucal (ASB)">Auxiliar de Saúde Bucal (ASB)</option>
                      <option value="Técnico em Saúde Bucal (TSB)">Técnico em Saúde Bucal (TSB)</option>
                      <option value="Gerente de Atendimento">Gerente de Atendimento</option>
                      <option value="Atendente Geral">Atendente Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      CPF:
                    </label>
                    <input
                      type="text"
                      value={memberForm.cpf}
                      onChange={(e) => setMemberForm({ ...memberForm, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp: *
                    </label>
                    <input
                      type="text"
                      required
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                      placeholder="(11) 98888-7777"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail:
                    </label>
                    <input
                      type="email"
                      value={memberForm.email}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                      placeholder="amanda@consultorio.com"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Horário / Turno:
                    </label>
                    <input
                      type="text"
                      value={memberForm.schedule}
                      onChange={(e) => setMemberForm({ ...memberForm, schedule: e.target.value })}
                      placeholder="Ex: 13:00 às 21:00"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dias de Trabalho:
                    </label>
                    <input
                      type="text"
                      value={memberForm.workDays}
                      onChange={(e) => setMemberForm({ ...memberForm, workDays: e.target.value })}
                      placeholder="Ex: Segunda a Sexta"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Internas:
                  </label>
                  <textarea
                    rows={2}
                    value={memberForm.notes}
                    onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                    placeholder="Instruções ou atribuições particulares deste colaborador..."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsView;
