import React, { useState } from 'react';
import { Sparkles, History, Image as ImageIcon, FileText, Lock } from 'lucide-react';
import { PatientHeaderCard } from './PatientHeaderCard';
import { ClinicalEvolutionForm } from './ClinicalEvolutionForm';
import { ClinicalEvolutionTimeline } from './ClinicalEvolutionTimeline';
import { DocumentCardsGrid } from './DocumentCardsGrid';
import { ActivePatientInfo } from '../../utils/patientUtils';
import { ClinicSettings, ProcedurePricing } from '../../types/settings';
import { ClinicalEvolution } from '../../data/seedEvolutions';
import { ToothNumber } from '../../types/odontogram';
import { PatientTreatmentItem } from '../../types/patient';
import { Odontogram } from '../odontogram/Odontogram';
import { RadiographyGallery } from '../radiography/RadiographyGallery';

export type ProntuarioSubTab = 'ODONTOGRAM' | 'EVOLUTION' | 'XRAYS' | 'DOCS';

export interface ProntuarioViewProps {
  activePatient: ActivePatientInfo;
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  activeSterilizationLot: string;
  onChangeLot: (lot: string) => void;
  onSwitchPatient: () => void;
  clinicalEvolutions: ClinicalEvolution[];
  clinicSettings: ClinicSettings;
  procedurePricings?: ProcedurePricing[];
  prontuarioSubTab: ProntuarioSubTab;
  onChangeSubTab: (tab: ProntuarioSubTab) => void;
  onOpenConsent: () => void;
  onOpenAnamnesis: () => void;
  onOpenPrescription: () => void;
  onOpenDocument: () => void;
  onAddEvolution: (procedure: string, tooth: string, text: string) => void;
  onSaveOdontogram: (data: any) => void;
  onSyncTreatmentPlan?: (items: PatientTreatmentItem[], total: number) => void;
}


export function ProntuarioView({
  activePatient,
  currentUserRole,
  activeSterilizationLot,
  onChangeLot,
  onSwitchPatient,
  clinicalEvolutions,
  clinicSettings,
  procedurePricings,
  prontuarioSubTab,
  onChangeSubTab,
  onOpenConsent,
  onOpenAnamnesis,
  onOpenPrescription,
  onOpenDocument,
  onAddEvolution,
  onSaveOdontogram,
  onSyncTreatmentPlan
}: ProntuarioViewProps) {

  const [selectedEvoTooth, setSelectedEvoTooth] = useState('');

  const handleToothSelect = (tooth: ToothNumber) => {
    setSelectedEvoTooth(`Dente ${tooth}`);
  };


  const patientEvolutions = clinicalEvolutions.filter(
    (e) => e.patientId === activePatient.id || e.patientName.toLowerCase() === activePatient.name.toLowerCase()
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header do Paciente Ativo em Atendimento */}
      <PatientHeaderCard
        activePatient={activePatient}
        activeSterilizationLot={activeSterilizationLot}
        onChangeLot={onChangeLot}
        onSwitchPatient={onSwitchPatient}
      />

      {/* SUB-NAVEGADOR ESPECIALIZADO DO PRONTUÁRIO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => onChangeSubTab('ODONTOGRAM')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            prontuarioSubTab === 'ODONTOGRAM'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Odontograma & Tratamento</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('EVOLUTION')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            prontuarioSubTab === 'EVOLUTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Evolução Clínica & Histórico</span>
          <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
            {patientEvolutions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('XRAYS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            prontuarioSubTab === 'XRAYS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Exames & Radiografias</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('DOCS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            prontuarioSubTab === 'DOCS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documentos & TCLE</span>
        </button>
      </div>

      {/* CONTEÚDO DA SUB-ABA 1: ODONTOGRAMA FDI */}
      {prontuarioSubTab === 'ODONTOGRAM' && (
        <Odontogram
          key={`full-${activePatient.id}`}
          patientId={activePatient.id}
          patientName={activePatient.name}
          isReadOnly={currentUserRole === 'RECEPTIONIST'}
          onSave={onSaveOdontogram}
          procedurePricings={procedurePricings || clinicSettings.procedurePricings}
          onSyncTreatmentPlan={onSyncTreatmentPlan}
        />
      )}

      {/* CONTEÚDO DA SUB-ABA 2: EVOLUÇÃO CLÍNICA & HISTÓRICO */}
      {prontuarioSubTab === 'EVOLUTION' && (
        <div className="space-y-4 sm:space-y-5">
          {/* Visualização Integrada do Mapa Anatômico / Dentes */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>🦷</span>
                <span>Mapa Dental & Odontograma Clínico</span>
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                Toque em qualquer dente para selecioná-lo automaticamente na anotação abaixo
              </span>
            </div>

            <Odontogram
              key={`mini-${activePatient.id}`}
              patientId={activePatient.id}
              patientName={activePatient.name}
              isReadOnly={currentUserRole === 'RECEPTIONIST'}
              hideSummary={true}
              onToothSelect={handleToothSelect}
              procedurePricings={procedurePricings || clinicSettings.procedurePricings}
              onSyncTreatmentPlan={onSyncTreatmentPlan}
            />
          </div>

          {currentUserRole === 'DENTIST' ? (
            <>
              <ClinicalEvolutionForm
                dentistName={clinicSettings.dentistName}
                dentistCro={clinicSettings.dentistCro}
                activeSterilizationLot={activeSterilizationLot}
                onSubmit={onAddEvolution}
                selectedTooth={selectedEvoTooth}
                onToothChange={setSelectedEvoTooth}
                procedurePricings={procedurePricings || clinicSettings.procedurePricings}
              />
              <ClinicalEvolutionTimeline evolutions={patientEvolutions} />
            </>

          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">
                Anotações de Prontuário Confidenciais (Exclusivo Cirurgião-Dentista)
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                O acesso às evoluções clínicas é restrito ao profissional legalmente habilitado no CRO, sob sigilo profissional (CFO-118/2012 e LGPD).
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA SUB-ABA 3: EXAMES & RADIOGRAFIAS */}
      {prontuarioSubTab === 'XRAYS' && (
        <RadiographyGallery
          patientId={activePatient.id}
          patientName={activePatient.name}
          isReadOnly={currentUserRole === 'RECEPTIONIST'}
        />
      )}

      {/* CONTEÚDO DA SUB-ABA 4: DOCUMENTOS & TCLE */}
      {prontuarioSubTab === 'DOCS' && (
        <DocumentCardsGrid
          currentUserRole={currentUserRole}
          onOpenConsent={onOpenConsent}
          onOpenAnamnesis={onOpenAnamnesis}
          onOpenPrescription={onOpenPrescription}
          onOpenDocument={onOpenDocument}
        />
      )}
    </div>
  );
}
