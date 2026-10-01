import React from 'react';
import { Users, Sparkles, Calendar, DollarSign, LayoutGrid } from 'lucide-react';
import { ActiveTab } from './AppNavBar';

export interface MobileBottomDockProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAllScreens: () => void;
  counts: {
    patients: number;
    appointments: number;
  };
  isMobileMenuOpen: boolean;
}

export function MobileBottomDock({ activeTab, onTabChange, onOpenAllScreens, counts, isMobileMenuOpen }: MobileBottomDockProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-14">
        <button
          type="button"
          onClick={() => onTabChange('PATIENTS')}
          className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer ${
            activeTab === 'PATIENTS' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] leading-tight">Pacientes</span>
          <span className="absolute top-1 right-2.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-100 text-blue-700">
            {counts.patients}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ODONTOGRAM')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'ODONTOGRAM' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] leading-tight">Prontuário</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('SCHEDULE')}
          className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer ${
            activeTab === 'SCHEDULE' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] leading-tight">Agenda</span>
          <span className="absolute top-1 right-2.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-100 text-blue-700">
            {counts.appointments}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('CASHBOOK')}
          className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
            activeTab === 'CASHBOOK' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] leading-tight">Financeiro</span>
        </button>

        <button
          type="button"
          onClick={onOpenAllScreens}
          className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors cursor-pointer ${
            isMobileMenuOpen || ['BIOSECURITY', 'LAB', 'INVENTORY', 'SETTINGS'].includes(activeTab)
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] leading-tight">Telas (8)</span>
          {['BIOSECURITY', 'LAB', 'INVENTORY', 'SETTINGS'].includes(activeTab) && (
            <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-1.5 right-4" />
          )}
        </button>
      </div>
    </nav>
  );
}
