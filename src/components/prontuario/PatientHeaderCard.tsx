import React from 'react';
import { ArrowRightLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ActivePatientInfo } from '../../utils/patientUtils';

export interface PatientHeaderCardProps {
  activePatient: ActivePatientInfo;
  activeSterilizationLot: string;
  onChangeLot: (lot: string) => void;
  onSwitchPatient: () => void;
}

export function PatientHeaderCard({
  activePatient,
  activeSterilizationLot,
  onChangeLot,
  onSwitchPatient
}: PatientHeaderCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200 shrink-0 shadow-2xs">
            {activePatient.name
              ? activePatient.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'PT'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {activePatient.name}
              </h2>
              {activePatient.id ? (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Na Cadeira
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Aguardando Seleção
                </span>
              )}
              <button
                type="button"
                onClick={onSwitchPatient}
                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Trocar quem está na cadeira odontológica agora"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                <span>{activePatient.id ? 'Trocar Paciente' : 'Selecionar Paciente'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              CPF: {activePatient.cpf} • Nasc: {activePatient.birthDate} • Tel: {activePatient.phone}
            </p>
          </div>
        </div>

        {/* Instrumental Autoclave RDC 15 */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 px-3 rounded-xl border border-slate-200 text-xs self-start md:self-auto shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-600 font-semibold">Instrumental RDC 15:</span>
          <select
            value={activeSterilizationLot}
            onChange={(e) => onChangeLot(e.target.value)}
            className="border border-slate-300 rounded-lg p-1 text-xs font-mono font-bold text-blue-700 bg-white cursor-pointer"
          >
            <option value="LOTE-2609-01">LOTE-2609-01 (Autoclave 26/09)</option>
            <option value="LOTE-2509-02">LOTE-2509-02 (Autoclave 25/09)</option>
          </select>
        </div>
      </div>

      {/* Alertas Críticos de Anamnese */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
        <span className="font-bold text-slate-600 flex items-center gap-1 mr-1 text-[11px] uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Alertas Médicos:
        </span>
        {activePatient.medicalAlerts.hypertension && (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-red-100 text-red-800 border border-red-200">
            🚨 Hipertensão Arterial
          </span>
        )}
        {activePatient.medicalAlerts.diabetes && (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-red-100 text-red-800 border border-red-200">
            🚨 Diabetes
          </span>
        )}
        {activePatient.medicalAlerts.anticoagulant && (
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
            ⚠️ Usa Anticoagulante
          </span>
        )}
        {activePatient.medicalAlerts.allergies.map((allergy) => (
          <span
            key={allergy}
            className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-red-600 text-white border border-red-700"
          >
            ⛔ Alergia: {allergy}
          </span>
        ))}
        {!activePatient.medicalAlerts.hypertension &&
          !activePatient.medicalAlerts.diabetes &&
          !activePatient.medicalAlerts.anticoagulant &&
          activePatient.medicalAlerts.allergies.length === 0 && (
            <span className="text-slate-400 italic text-[11px]">
              Nenhum alerta crítico relatado na anamnese.
            </span>
          )}
      </div>
    </div>
  );
}
