import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Check,
  Plus,
  Phone,
  Clock,
  X,
  Briefcase,
  BadgeCheck,
  ShieldCheck
} from 'lucide-react';
import { ReceptionistProfile, ClinicSettings } from '../../types/settings';

interface ReceptionistSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicSettings: ClinicSettings;
  onSelectReceptionist: (member: ReceptionistProfile) => void;
  onAddReceptionist: (newMember: ReceptionistProfile) => void;
}

export const ReceptionistSwitchModal: React.FC<ReceptionistSwitchModalProps> = ({
  isOpen,
  onClose,
  clinicSettings,
  onSelectReceptionist,
  onAddReceptionist
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Recepcionista & Balcão');
  const [newPhone, setNewPhone] = useState('');
  const [newSchedule, setNewSchedule] = useState('08:00 às 17:00');

  if (!isOpen) return null;

  const team: ReceptionistProfile[] = clinicSettings.receptionistsTeam && clinicSettings.receptionistsTeam.length > 0
    ? clinicSettings.receptionistsTeam
    : [
        {
          id: 'rec_01',
          name: clinicSettings.receptionistName || 'Mariana Costa',
          roleTitle: clinicSettings.receptionistRoleTitle || 'Recepcionista & Balcão',
          cpf: clinicSettings.receptionistCpf || '456.789.012-34',
          phone: clinicSettings.receptionistPhone || '(11) 97123-4567',
          email: clinicSettings.receptionistEmail || '',
          schedule: clinicSettings.receptionistSchedule || '08:00 às 17:00',
          workDays: clinicSettings.receptionistWorkDays || 'Segunda a Sexta-feira',
          active: true
        }
      ];

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: ReceptionistProfile = {
      id: `rec_${Date.now()}`,
      name: newName.trim(),
      roleTitle: newRole,
      cpf: '',
      phone: newPhone.trim(),
      email: '',
      schedule: newSchedule,
      workDays: 'Segunda a Sexta-feira',
      active: true
    };

    onAddReceptionist(newMember);
    setIsAddingNew(false);
    setNewName('');
    setNewPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in">
        {/* CABEÇALHO */}
        <div className="bg-emerald-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              👩‍💼
            </div>
            <div>
              <h3 className="font-bold text-sm">Quem está no Balcão agora?</h3>
              <p className="text-[11px] text-emerald-100">
                Selecione o operador ativo para a recepção e fechamento de caixa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* LISTA DE RECEPCIONISTAS */}
          {!isAddingNew ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Colaboradores Cadastrados
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Novo
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {team.map((member) => {
                  const isActive =
                    member.name.toLowerCase() === (clinicSettings.receptionistName || '').toLowerCase() ||
                    member.active;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        onSelectReceptionist(member);
                        onClose();
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {member.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-800 truncate">
                              {member.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                                Ativo no Balcão
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {member.roleTitle}
                          </p>
                          {member.phone && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {member.phone} {member.schedule ? `• ${member.schedule}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isActive ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 hover:underline">
                            Selecionar
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-1">
                O operador selecionado assinará o fechamento de caixa e os atendimentos de balcão.
              </p>
            </div>
          ) : (
            /* FORMULÁRIO RÁPIDO PARA ADICIONAR NOVO COLABORADOR */
            <form onSubmit={handleCreateNew} className="space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Cadastrar Novo Colaborador de Balcão
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Voltar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome Completo: *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Amanda Silva"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cargo / Função:
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-emerald-500 bg-white"
                  >
                    <option value="Recepcionista & Balcão">Recepcionista</option>
                    <option value="Secretária Executiva">Secretária</option>
                    <option value="Auxiliar de Saúde Bucal (ASB)">ASB</option>
                    <option value="Técnico em Saúde Bucal (TSB)">TSB</option>
                    <option value="Atendente Geral">Atendente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Horário de Trabalho:
                </label>
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="Ex: 08:00 às 17:00 ou 13:00 às 21:00"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar e Ativar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ReceptionistSwitchModal;
