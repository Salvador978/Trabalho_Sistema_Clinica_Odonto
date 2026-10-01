import React from 'react';
import { ShieldCheck, UserCheck, Menu, User, ChevronDown, Lock, ArrowRightLeft, LogOut } from 'lucide-react';
import { ClinicSettings } from '../../types/settings';
import { ActivePatientInfo } from '../../utils/patientUtils';
import { Button } from '../ui/Button';

import { getCanonicalClinicName, getCanonicalDentistName, getCanonicalCro } from '../../utils/clinicUtils';

export interface AppHeaderProps {
  clinicSettings: ClinicSettings;
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  activePatient: ActivePatientInfo;
  onSelectDentistRole: () => void;
  onSwitchToReceptionist: () => void;
  onOpenActivePatientSwitch: () => void;
  onOpenReceptionistSwitch: () => void;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export function AppHeader({
  clinicSettings,
  currentUserRole,
  activePatient,
  onSelectDentistRole,
  onSwitchToReceptionist,
  onOpenActivePatientSwitch,
  onOpenReceptionistSwitch,
  onOpenMobileMenu,
  onLogout
}: AppHeaderProps) {
  const displayClinicName = React.useMemo(() => {
    return getCanonicalClinicName(clinicSettings);
  }, [clinicSettings.clinicName, clinicSettings.dentistName]);

  const displayCro = React.useMemo(() => {
    return getCanonicalCro(clinicSettings.dentistCro);
  }, [clinicSettings.dentistCro]);

  const displayDentistName = React.useMemo(() => {
    return getCanonicalDentistName(clinicSettings.dentistName);
  }, [clinicSettings.dentistName]);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Nome — Visual 100% idêntico e consistente no Celular e PC */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-[46vw] sm:max-w-none">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white shadow-sm font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate leading-tight">
                <span className="truncate">{displayClinicName}</span>
                {displayCro && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 shrink-0">
                    {displayCro}
                  </span>
                )}
              </h1>
              {displayDentistName && (
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate leading-tight mt-0.5">
                  {displayDentistName}
                  {displayCro && <span className="sm:hidden font-normal text-slate-400 ml-1">({displayCro})</span>}
                </p>
              )}
            </div>
          </div>

          {/* Controle de Papel (Mobile e Desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {/* Atalho Rápido de Paciente/Recepcionista no Mobile */}
            <div className="flex md:hidden items-center">
              {currentUserRole === 'DENTIST' ? (
                <button
                  type="button"
                  onClick={onOpenActivePatientSwitch}
                  className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1 max-w-[110px] cursor-pointer"
                  title="Trocar paciente ativo na cadeira"
                >
                  <span className="truncate">💺 {activePatient.name.split(' ')[0]}</span>
                  <ArrowRightLeft className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenReceptionistSwitch}
                  className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1 max-w-[110px] cursor-pointer"
                  title="Trocar recepcionista de plantão"
                >
                  <span className="truncate">👩‍💼 {clinicSettings.receptionistName?.split(' ')[0] || 'Recepção'}</span>
                  <UserCheck className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                </button>
              )}
            </div>

            {/* Toggle de Papel Simplificado no Mobile */}
            <div className="flex md:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={onSelectDentistRole}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  currentUserRole === 'DENTIST'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {currentUserRole === 'DENTIST' && <ShieldCheck className="w-3 h-3" />}
                Dentista
              </button>
              <button
                type="button"
                onClick={onSwitchToReceptionist}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                  currentUserRole === 'RECEPTIONIST'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {currentUserRole === 'RECEPTIONIST' && <UserCheck className="w-3 h-3" />}
                Recepção
              </button>
            </div>


            {/* Controle Avançado Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-inner">
                {currentUserRole === 'DENTIST' ? (
                  <>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-lg bg-white shadow-sm border border-slate-200 text-sm font-bold text-blue-700 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Modo Dentista
                    </button>
                    <button
                      type="button"
                      onClick={onSwitchToReceptionist}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      Trocar p/ Recepção
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onSelectDentistRole}
                      className="px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Modo Dentista
                    </button>
                    <button
                      type="button"
                      onClick={onOpenReceptionistSwitch}
                      className="px-4 py-1.5 rounded-lg bg-white shadow-sm border border-emerald-200 text-sm font-bold text-emerald-700 flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      Recepção: {clinicSettings.receptionistName?.split(' ')[0] || 'Atendente'}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                  </>
                )}
              </div>

              {/* Paciente Ativo no Header Desktop */}
              <button
                type="button"
                onClick={onOpenActivePatientSwitch}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 pl-2 pr-4 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer group"
                title="Trocar Paciente na Cadeira"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase tracking-wider leading-none mb-0.5">
                    {activePatient.id ? 'Na Cadeira' : 'Atendimento'}
                  </span>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700 leading-none truncate max-w-[150px]">
                    {activePatient.id
                      ? `${activePatient.name.split(' ')[0]} ${activePatient.name.split(' ')[1]?.charAt(0) || ''}.`
                      : 'Selecionar Paciente'}
                  </span>
                </div>
                <ArrowRightLeft className="w-3 h-3 text-slate-300 group-hover:text-blue-500 ml-1" />
              </button>

              <div className="w-px h-8 bg-slate-200 mx-1"></div>

              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex flex-col items-center justify-center"
                title="Sair do Sistema"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] font-bold leading-none mt-1">Sair</span>
              </button>
            </div>

            {/* Menu Mobile */}
            <button 
              type="button"
              className="md:hidden p-2 -mr-2 text-slate-600 cursor-pointer hover:bg-slate-100 rounded-lg"
              onClick={onOpenMobileMenu}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
