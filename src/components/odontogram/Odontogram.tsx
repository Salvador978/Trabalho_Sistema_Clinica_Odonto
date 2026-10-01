import React, { useState, useRef } from 'react';
import {
  ToothNumber,
  ToothSurface,
  DentalCondition,
  ConditionLayer,
  PERMANENT_TEETH_UPPER,
  PERMANENT_TEETH_LOWER,
  DECIDUOUS_TEETH_UPPER,
  DECIDUOUS_TEETH_LOWER,
  OdontogramData,
  DENTAL_CONDITIONS_META
} from '../../types/odontogram';
import { useOdontogram, useAutoSaveOdontogram } from '../../hooks/useOdontogram';
import { ToothSvg } from './ToothSvg';
import { PaletteToolbar } from './PaletteToolbar';
import { DentalSummary } from './DentalSummary';
import { ProcedurePricing } from '../../types/settings';
import { PatientTreatmentItem } from '../../types/patient';

export interface OdontogramProps {
  patientId?: string;
  patientName?: string;
  initialData?: OdontogramData;
  onSave?: (data: OdontogramData) => void;
  isReadOnly?: boolean;
  hideSummary?: boolean;
  onToothSelect?: (toothNumber: ToothNumber) => void;
  procedurePricings?: ProcedurePricing[];
  onSyncTreatmentPlan?: (items: PatientTreatmentItem[], total: number) => void;
}

export const Odontogram: React.FC<OdontogramProps> = ({
  patientId = '00000000-0000-0000-0000-000000000001',
  patientName = 'Paciente Exemplo',
  initialData,
  onSave,
  isReadOnly = false,
  hideSummary = false,
  onToothSelect,
  procedurePricings,
  onSyncTreatmentPlan
}) => {

  const {
    versionNumber,
    title,
    setTitle,
    activeLayer,
    setActiveLayer,
    selectedCondition,
    setSelectedCondition,
    dentitionMode,
    setDentitionMode,
    selectedTooth,
    setSelectedTooth,
    findings,
    findingsByTooth,
    applyConditionToSurface,
    applyConditionToWholeTooth,
    undo,
    redo,
    canUndo,
    canRedo,
    clearActiveLayer,
    exportPayload
  } = useOdontogram(patientId, initialData);

  const { saveStatus, lastSavedAt } = useAutoSaveOdontogram(patientId, findings, activeLayer, !isReadOnly);

  // Identifica se a condição ativa afeta o dente como um todo (Canal, Implante, Coroa, Extração, Ausente)
  const isWholeToothCondition = DENTAL_CONDITIONS_META[selectedCondition]?.category === 'TOOTH';

  // Estados de modais
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [toothActionModal, setToothActionModal] = useState<ToothNumber | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Divide dentes permanentes por quadrantes anatômicos
  const q1Teeth = PERMANENT_TEETH_UPPER.slice(0, 8); // 18 a 11 (Maxila Superior Direita)
  const q2Teeth = PERMANENT_TEETH_UPPER.slice(8, 16); // 21 a 28 (Maxila Superior Esquerda)
  const q4Teeth = PERMANENT_TEETH_LOWER.slice(0, 8); // 48 a 41 (Mandíbula Inferior Direita)
  const q3Teeth = PERMANENT_TEETH_LOWER.slice(8, 16); // 31 a 38 (Mandíbula Inferior Esquerda)

  // Dentes decíduos
  const q5Teeth = DECIDUOUS_TEETH_UPPER.slice(0, 5); // 55 a 51
  const q6Teeth = DECIDUOUS_TEETH_UPPER.slice(5, 10); // 61 a 65
  const q8Teeth = DECIDUOUS_TEETH_LOWER.slice(0, 5); // 85 a 81
  const q7Teeth = DECIDUOUS_TEETH_LOWER.slice(5, 10); // 71 a 75

  const handleSurfaceClick = (tooth: ToothNumber, surface: ToothSurface) => {
    if (isReadOnly) return;
    if (isWholeToothCondition || surface === 'GENERAL_TOOTH') {
      // Sempre que for um tratamento do dente todo, o dente inteiro é selecionado
      applyConditionToWholeTooth(tooth, selectedCondition);
    } else {
      // Tratamento por face (Cárie, Restauração Resina, Amálgama, Selante)
      applyConditionToSurface(tooth, surface, selectedCondition);
    }
  };

  const handleToothClick = (tooth: ToothNumber) => {
    setSelectedTooth(tooth);
    if (onToothSelect) {
      onToothSelect(tooth);
    }
    if (!isReadOnly) {
      if (isWholeToothCondition) {
        // Aplica diretamente ao dente todo com 1 clique
        applyConditionToWholeTooth(tooth, selectedCondition);
      } else if (selectedCondition === 'HEALTHY') {
        // Limpa o dente todo
        applyConditionToWholeTooth(tooth, 'HEALTHY');
      } else {
        setToothActionModal(tooth);
      }
    }
  };

  const handleApplyToothCondition = (cond: DentalCondition) => {
    if (!toothActionModal) return;
    applyConditionToWholeTooth(toothActionModal, cond);
    setToothActionModal(null);
  };

  const handleRemoveFinding = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding) return;
    if (finding.surface === 'GENERAL_TOOTH') {
      applyConditionToWholeTooth(finding.toothNumber, 'HEALTHY');
    } else {
      applyConditionToSurface(finding.toothNumber, finding.surface, 'HEALTHY');
    }
  };

  // Renderizador de fileira de dentes limpo e responsivo
  const renderToothRow = (teeth: readonly ToothNumber[], size: 'sm' | 'md' | 'lg' = 'md') => {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 justify-center">
        {teeth.map((tooth) => {
          const toothData = findingsByTooth.get(tooth);

          return (
            <ToothSvg
              key={tooth}
              toothNumber={tooth}
              activeLayer={activeLayer}
              initialFindings={toothData?.initial || []}
              treatmentFindings={toothData?.treatment || []}
              completedFindings={toothData?.completed || []}
              onSurfaceClick={handleSurfaceClick}
              onToothClick={handleToothClick}
              isSelected={selectedTooth === tooth}
              isWholeToothActive={isWholeToothCondition}
              size={size}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 font-sans animate-in fade-in duration-150">
      {/* 1. HEADER DO ODONTOGRAMA & VERSÃO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100 shadow-2xs">
              🦷
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-800">
                  Odontograma Interativo Digital (FDI / ISO 3950)
                </h2>
                <span className="px-2 py-0.2 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  v{versionNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Paciente: <strong className="text-slate-800">{patientName}</strong> • {findings.length} achados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 md:w-48 text-xs border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-blue-500 text-slate-700 bg-slate-50/50 focus:bg-white transition-colors"
            placeholder="Título do Plano"
            disabled={isReadOnly}
          />
          <div className="flex items-center gap-2 text-xs shrink-0">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Salvando alterações...
              </span>
            )}

            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Salvo automaticamente {lastSavedAt ? `às ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            )}

            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Erro ao salvar. Tentando novamente...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOOLBAR DA PALETA DE PROCEDIMENTOS LIMPA */}
      {!isReadOnly && (
        <PaletteToolbar
          selectedCondition={selectedCondition}
          onSelectCondition={setSelectedCondition}
          activeLayer={activeLayer}
          onSelectLayer={setActiveLayer}
          dentitionMode={dentitionMode}
          onSelectDentitionMode={setDentitionMode}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onClearActiveLayer={clearActiveLayer}
          onExportJson={() => setShowJsonModal(true)}
        />
      )}

      {/* 3. ÁREA GRÁFICA DO ODONTOGRAMA (ARCADA COMPLETA LIMPA & DIRETA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-xs overflow-x-auto touch-pan-x" ref={scrollContainerRef}>
        <div className="w-fit min-w-full mx-auto space-y-4 sm:space-y-5">
          {/* LEGENDA TOPOGRÁFICA SUBTIL */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-100 pb-2 px-1">
            <span>← DIREITA DO PACIENTE (Q1 / Q4)</span>
            <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px]">
              Linha Média Facial
            </span>
            <span>ESQUERDA DO PACIENTE (Q2 / Q3) →</span>
          </div>

          {/* 1. DENTIÇÃO PERMANENTE SUPERIOR (18 -> 11 | 21 -> 28) */}
          {(dentitionMode === 'PERMANENT' || dentitionMode === 'MIXED') && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider mb-1">
                Arcada Superior (Maxila)
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                {/* Quadrante 1 (18 ao 11) */}
                {renderToothRow(q1Teeth)}
                {/* Linha Média Sagital */}
                <div className="w-0.5 h-12 sm:h-14 bg-blue-300 rounded-full shrink-0" title="Linha Média" />
                {/* Quadrante 2 (21 ao 28) */}
                {renderToothRow(q2Teeth)}
              </div>
            </div>
          )}

          {/* 2. DENTIÇÃO DECÍDUA SUPERIOR */}
          {(dentitionMode === 'DECIDUOUS' || dentitionMode === 'MIXED') && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-amber-700 text-center uppercase tracking-wider mb-1">
                Arcada Superior Decídua / Infantil
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                {renderToothRow(q5Teeth)}
                <div className="w-0.5 h-10 sm:h-12 bg-amber-400 rounded-full shrink-0" />
                {renderToothRow(q6Teeth)}
              </div>
            </div>
          )}

          {/* DIVISOR DE PLANO OCLUSAL */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full border-t border-dashed border-slate-200" />
            <span className="absolute bg-white px-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Plano Oclusal
            </span>
          </div>

          {/* 3. DENTIÇÃO DECÍDUA INFERIOR */}
          {(dentitionMode === 'DECIDUOUS' || dentitionMode === 'MIXED') && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-amber-700 text-center uppercase tracking-wider mb-1">
                Arcada Inferior Decídua / Infantil
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                {renderToothRow(q8Teeth)}
                <div className="w-0.5 h-10 sm:h-12 bg-amber-400 rounded-full shrink-0" />
                {renderToothRow(q7Teeth)}
              </div>
            </div>
          )}

          {/* 4. DENTIÇÃO PERMANENTE INFERIOR (48 -> 41 | 31 -> 38) */}
          {(dentitionMode === 'PERMANENT' || dentitionMode === 'MIXED') && (
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider mb-1">
                Arcada Inferior (Mandíbula)
              </div>
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-1">
                {/* Quadrante 4 (48 ao 41) */}
                {renderToothRow(q4Teeth)}
                {/* Linha Média Sagital */}
                <div className="w-0.5 h-12 sm:h-14 bg-blue-300 rounded-full shrink-0" title="Linha Média" />
                {/* Quadrante 3 (31 ao 38) */}
                {renderToothRow(q3Teeth)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. RESUMO CLÍNICO E LISTA DE PROCEDIMENTOS (SE NÃO OCULTO) */}
      {!hideSummary && (
        <DentalSummary
          findings={findings}
          activeLayer={activeLayer}
          onRemoveFinding={handleRemoveFinding}
          procedurePricings={procedurePricings}
          patientName={patientName}
          patientId={patientId}
          onSyncTreatmentPlan={onSyncTreatmentPlan}
        />
      )}


      {/* MODAL DE CONDIÇÃO GERAL DO DENTE (CLIQUE NO DENTE) */}
      {toothActionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[92vh] flex flex-col p-4 sm:p-5 shadow-2xl space-y-4 my-auto overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Dente {toothActionModal}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">
                    FDI ISO 3950
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aplicar condição a todo o elemento dentário:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToothActionModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyToothCondition('IMPLANT')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 font-semibold text-left transition-colors cursor-pointer"
              >
                🔩 Implante Dentário
              </button>
              <button
                type="button"
                onClick={() => handleApplyToothCondition('CROWN')}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900 font-semibold text-left transition-colors cursor-pointer"
              >
                👑 Coroa / Prótese Fixa
              </button>
              <button
                type="button"
                onClick={() => handleApplyToothCondition('ENDODONTIC_TREATED')}
                className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 text-cyan-900 font-semibold text-left transition-colors cursor-pointer"
              >
                🩺 Canal Tratado
              </button>
              <button
                type="button"
                onClick={() => handleApplyToothCondition('ENDODONTIC_NEEDED')}
                className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100 text-pink-900 font-semibold text-left transition-colors cursor-pointer"
              >
                ⚠️ Canal Indicado
              </button>
              <button
                type="button"
                onClick={() => handleApplyToothCondition('MISSING_TOOTH')}
                className="p-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-left transition-colors cursor-pointer"
              >
                ❌ Dente Ausente
              </button>
              <button
                type="button"
                onClick={() => handleApplyToothCondition('EXTRACTION_INDICATED')}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-900 font-semibold text-left transition-colors cursor-pointer"
              >
                ⛔ Exodontia Indicada
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleApplyToothCondition('HEALTHY')}
                className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
              >
                Limpar / Dente Hígido
              </button>
              <button
                type="button"
                onClick={() => setToothActionModal(null)}
                className="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXPORTAÇÃO JSON */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl space-y-4 my-auto overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  JSON Estruturado para API REST (Gerencia Odonto)
                </h3>
                <p className="text-xs text-slate-500">
                  Payload normalizado compatível com o endpoint /patients/:id/odontogram/versions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto max-h-80 font-mono">
              {JSON.stringify(exportPayload(), null, 2)}
            </pre>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(exportPayload(), null, 2));
                  setJsonCopied(true);
                  setTimeout(() => setJsonCopied(false), 2000);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              >
                {jsonCopied ? '✓ Copiado com Sucesso!' : 'Copiar para Área de Transferência'}
              </button>
              <button
                type="button"
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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

export default Odontogram;
