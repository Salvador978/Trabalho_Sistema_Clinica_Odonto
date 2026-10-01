import React from 'react';
import { Users, Sparkles, Calendar, DollarSign, Activity, Package, Layers, Settings, Lock, TrendingUp } from 'lucide-react';

export type ActiveTab = 'DASHBOARD' | 'PATIENTS' | 'ODONTOGRAM' | 'SCHEDULE' | 'CASHBOOK' | 'BIOSECURITY' | 'LAB' | 'INVENTORY' | 'SETTINGS';

export interface AppNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  counts: {
    patients: number;
    appointments: number;
    labOrders: number;
  };
  onOpenMobileMenu: () => void;
  onPinRequired: () => void;
}

export function AppNavBar({ activeTab, onTabChange, currentUserRole, counts, onOpenMobileMenu, onPinRequired }: AppNavBarProps) {
  return (
    <div className="hidden md:block bg-white border-b border-slate-200 shadow-sm relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-3 pb-0" style={{ scrollSnapType: 'x mandatory' }}>
          
          <button
            type="button"
            onClick={() => onTabChange('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'DASHBOARD' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Dashboard
          </button>
          
          <button
            type="button"
            onClick={() => onTabChange('PATIENTS')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'PATIENTS' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            Pacientes
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'PATIENTS' ? 'bg-blue-100' : 'bg-slate-100'}`}>
              {counts.patients}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('ODONTOGRAM')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'ODONTOGRAM' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Prontuário & Cadeira
          </button>

          <button
            type="button"
            onClick={() => onTabChange('SCHEDULE')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'SCHEDULE' 
                ? 'bg-blue-50 text-blue-700 border-blue-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agenda
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'SCHEDULE' ? 'bg-blue-100' : 'bg-slate-100'}`}>
              {counts.appointments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('CASHBOOK')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'CASHBOOK' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Financeiro DMED
          </button>

          {/* Divisor Vertical */}
          <div className="w-px h-8 bg-slate-200 self-center mx-2 hidden lg:block"></div>

          <button
            type="button"
            onClick={() => onTabChange('BIOSECURITY')}
            className={`hidden lg:flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'BIOSECURITY' 
                ? 'bg-purple-50 text-purple-700 border-purple-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            Autoclave RDC15
          </button>

          <button
            type="button"
            onClick={() => onTabChange('LAB')}
            className={`hidden lg:flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'LAB' 
                ? 'bg-amber-50 text-amber-700 border-amber-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            Protéticos
            {counts.labOrders > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'LAB' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                {counts.labOrders}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('INVENTORY')}
            className={`hidden xl:flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'INVENTORY' 
                ? 'bg-slate-100 text-slate-800 border-slate-600' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            <Package className="w-4 h-4" />
            Estoque
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              if (currentUserRole === 'RECEPTIONIST') {
                onPinRequired();
              } else {
                onTabChange('SETTINGS');
              }
            }}
            className={`ml-auto flex items-center gap-2 px-4 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-colors cursor-pointer border-b-2 ${
              activeTab === 'SETTINGS' 
                ? 'bg-slate-800 text-white border-slate-900' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`}
          >
            {currentUserRole === 'RECEPTIONIST' ? <Lock className="w-4 h-4 text-slate-400" /> : <Settings className="w-4 h-4" />}
            Configurações
          </button>

        </div>
      </div>
    </div>
  );
}
