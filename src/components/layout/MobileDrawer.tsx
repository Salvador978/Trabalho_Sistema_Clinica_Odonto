import React from 'react';
import { LayoutGrid, Users, Sparkles, Calendar, DollarSign, Activity, Layers, Package, Settings, Lock, LogOut, ShieldCheck, UserCheck, TrendingUp } from 'lucide-react';
import { ActiveTab } from './AppNavBar';
import { IconButton } from '../ui/Button';
import { getCanonicalClinicName, getCanonicalDentistName } from '../../utils/clinicUtils';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  onPinRequired: () => void;
  counts: {
    patients: number;
    appointments: number;
    labOrders: number;
  };
  clinicName?: string;
  dentistName?: string;
  onLogout: () => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  currentUserRole,
  onPinRequired,
  counts,
  clinicName,
  dentistName,
  onLogout
}: MobileDrawerProps) {
  if (!isOpen) return null;

  const displayClinic = getCanonicalClinicName({ clinicName, dentistName });
  const displayDentist = getCanonicalDentistName(dentistName);

  const handleTabSelect = (tab: ActiveTab) => {
    if (tab === 'SETTINGS' && currentUserRole === 'RECEPTIONIST') {
      onPinRequired();
    } else {
      onTabChange(tab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[88dvh] overflow-y-auto pb-safe p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        
        {/* Handle bar do sheet */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="min-w-0 pr-2">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 truncate">
              <LayoutGrid className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="truncate">{displayClinic}</span>
            </h3>
            {displayDentist && (
              <p className="text-[11px] font-semibold text-slate-500 truncate pl-7">
                {displayDentist}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 pl-7">
              {currentUserRole === 'DENTIST' ? (
                <><ShieldCheck className="w-3 h-3 text-blue-600"/> Dentista Logado</>
              ) : (
                <><UserCheck className="w-3 h-3 text-emerald-600"/> Recepção Logada</>
              )}
            </p>
          </div>
          <IconButton icon={<span>✕</span>} variant="ghost" onClick={onClose} className="bg-slate-100 font-bold" aria-label="Fechar" />
        </div>

        {/* Grid de Telas */}
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          <DrawerCard
            isActive={activeTab === 'DASHBOARD'}
            onClick={() => handleTabSelect('DASHBOARD')}
            icon={<TrendingUp className="w-5 h-5" />}
            title="Dashboard"
            subtitle="Métricas e Faturamento"
            badgeLabel="KPIs"
            theme="emerald"
          />
          <DrawerCard
            isActive={activeTab === 'PATIENTS'}
            onClick={() => handleTabSelect('PATIENTS')}
            icon={<Users className="w-5 h-5" />}
            title="1. Pacientes"
            subtitle="Cadastros e fichas"
            badge={counts.patients}
            theme="blue"
          />
          <DrawerCard
            isActive={activeTab === 'ODONTOGRAM'}
            onClick={() => handleTabSelect('ODONTOGRAM')}
            icon={<Sparkles className="w-5 h-5" />}
            title="2. Prontuário"
            subtitle="Odontograma & TCLE"
            badgeLabel="Cadeira"
            theme="indigo"
          />
          <DrawerCard
            isActive={activeTab === 'SCHEDULE'}
            onClick={() => handleTabSelect('SCHEDULE')}
            icon={<Calendar className="w-5 h-5" />}
            title="3. Agenda do Dia"
            subtitle="Consultas & Whats"
            badge={counts.appointments}
            theme="blue"
          />
          <DrawerCard
            isActive={activeTab === 'CASHBOOK'}
            onClick={() => handleTabSelect('CASHBOOK')}
            icon={<DollarSign className="w-5 h-5" />}
            title="4. Financeiro"
            subtitle="Livro Caixa & Fechamento"
            badgeLabel="DMED"
            theme="emerald"
          />
          <DrawerCard
            isActive={activeTab === 'BIOSECURITY'}
            onClick={() => handleTabSelect('BIOSECURITY')}
            icon={<Activity className="w-5 h-5" />}
            title="5. Autoclave"
            subtitle="Biossegurança RDC 15"
            theme="purple"
          />
          <DrawerCard
            isActive={activeTab === 'LAB'}
            onClick={() => handleTabSelect('LAB')}
            icon={<Layers className="w-5 h-5" />}
            title="6. Protéticos"
            subtitle="Ordens de Serviço"
            badge={counts.labOrders}
            theme="amber"
          />
          <DrawerCard
            isActive={activeTab === 'INVENTORY'}
            onClick={() => handleTabSelect('INVENTORY')}
            icon={<Package className="w-5 h-5" />}
            title="7. Estoque"
            subtitle="Materiais e Validades"
            theme="slate"
          />
          <button
            type="button"
            onClick={() => handleTabSelect('SETTINGS')}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
              activeTab === 'SETTINGS'
                ? 'bg-slate-800 border-slate-900 ring-2 ring-slate-500/20 shadow-xs'
                : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                activeTab === 'SETTINGS' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentUserRole === 'RECEPTIONIST' ? <Lock className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <span className={`font-bold text-xs block ${activeTab === 'SETTINGS' ? 'text-white' : 'text-slate-800'}`}>
                8. Configurações
              </span>
              <span className={`text-[10px] ${activeTab === 'SETTINGS' ? 'text-slate-300' : 'text-slate-400'}`}>
                {currentUserRole === 'RECEPTIONIST' ? 'Exige Senha PIN' : 'Clínica & Backups'}
              </span>
            </div>
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Encerrar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawerCard({ isActive, onClick, icon, title, subtitle, badge, badgeLabel, theme }: any) {
  const themes: Record<string, { bgActive: string, borderActive: string, iconBg: string, iconText: string, badgeBg: string, badgeText: string }> = {
    blue: { bgActive: 'bg-blue-50', borderActive: 'border-blue-400 ring-blue-500/20', iconBg: 'bg-blue-100', iconText: 'text-blue-700', badgeBg: 'bg-blue-100', badgeText: 'text-blue-800' },
    indigo: { bgActive: 'bg-indigo-50', borderActive: 'border-indigo-400 ring-indigo-500/20', iconBg: 'bg-indigo-100', iconText: 'text-indigo-700', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
    emerald: { bgActive: 'bg-emerald-50', borderActive: 'border-emerald-400 ring-emerald-500/20', iconBg: 'bg-emerald-100', iconText: 'text-emerald-700', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-800' },
    purple: { bgActive: 'bg-purple-50', borderActive: 'border-purple-400 ring-purple-500/20', iconBg: 'bg-purple-100', iconText: 'text-purple-700', badgeBg: 'bg-purple-100', badgeText: 'text-purple-800' },
    amber: { bgActive: 'bg-amber-50', borderActive: 'border-amber-400 ring-amber-500/20', iconBg: 'bg-amber-100', iconText: 'text-amber-700', badgeBg: 'bg-amber-100', badgeText: 'text-amber-800' },
    slate: { bgActive: 'bg-slate-100', borderActive: 'border-slate-400 ring-slate-500/20', iconBg: 'bg-white', iconText: 'text-slate-700', badgeBg: 'bg-slate-200', badgeText: 'text-slate-800' },
  };

  const t = themes[theme] || themes.blue;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
        isActive
          ? `${t.bgActive} ${t.borderActive} ring-2 shadow-xs`
          : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${t.iconBg} ${t.iconText}`}>
          {icon}
        </div>
        {(badge !== undefined || badgeLabel) && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.badgeBg} ${t.badgeText}`}>
            {badgeLabel || badge}
          </span>
        )}
      </div>
      <div>
        <span className="font-bold text-slate-800 text-xs block">{title}</span>
        <span className="text-[10px] text-slate-400">{subtitle}</span>
      </div>
    </button>
  );
}
