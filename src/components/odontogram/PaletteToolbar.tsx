import React from 'react';
import {
  DentalCondition,
  ConditionLayer,
  DENTAL_CONDITIONS_META
} from '../../types/odontogram';
import { RotateCcw, RotateCw, Trash2, Code2 } from 'lucide-react';

interface PaletteToolbarProps {
  selectedCondition: DentalCondition;
  onSelectCondition: (condition: DentalCondition) => void;
  activeLayer: ConditionLayer;
  onSelectLayer: (layer: ConditionLayer) => void;
  dentitionMode: 'PERMANENT' | 'DECIDUOUS' | 'MIXED';
  onSelectDentitionMode: (mode: 'PERMANENT' | 'DECIDUOUS' | 'MIXED') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearActiveLayer: () => void;
  onExportJson: () => void;
}

export const PaletteToolbar: React.FC<PaletteToolbarProps> = ({
  selectedCondition,
  onSelectCondition,
  activeLayer,
  onSelectLayer,
  dentitionMode,
  onSelectDentitionMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearActiveLayer,
  onExportJson
}) => {
  const conditions: DentalCondition[] = [
    'CARIES',
    'RESTORATION_RESIN',
    'RESTORATION_AMALGAM',
    'SEALANT',
    'ENDODONTIC_TREATED',
    'IMPLANT',
    'CROWN',
    'EXTRACTION_INDICATED',
    'MISSING_TOOTH',
    'HEALTHY'
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
      {/* BARRA SUPERIOR: Camadas Clínicas, Dentição e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Camadas Clínicas */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Camada:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectLayer('INITIAL_STATE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'INITIAL_STATE'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Estado Inicial
            </button>
            <button
              type="button"
              onClick={() => onSelectLayer('TREATMENT_PLAN')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'TREATMENT_PLAN'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Plano Tratamento
            </button>
            <button
              type="button"
              onClick={() => onSelectLayer('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Realizado
            </button>
          </div>
        </div>

        {/* Tipo de Dentição e Ferramentas */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onSelectDentitionMode('PERMANENT')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dentitionMode === 'PERMANENT'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Permanente (32)
            </button>
            <button
              type="button"
              onClick={() => onSelectDentitionMode('DECIDUOUS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dentitionMode === 'DECIDUOUS'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Decídua (20)
            </button>
            <button
              type="button"
              onClick={() => onSelectDentitionMode('MIXED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                dentitionMode === 'MIXED'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mista
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer alteração"
              className="p-1.5 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer alteração"
              className="p-1.5 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClearActiveLayer}
              title="Limpar camada atual"
              className="p-1.5 px-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExportJson}
              title="Exportar JSON formatado"
              className="p-1.5 px-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PALETA DE PROCEDIMENTOS: SEPARADA POR FACES VS DENTE TODO */}
      <div className="space-y-2.5">
        {/* Banner Orientador Inteligente */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs pb-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold text-[11px]">Tipo de Tratamento Ativo:</span>
            {DENTAL_CONDITIONS_META[selectedCondition]?.category === 'TOOTH' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] shadow-2xs animate-in fade-in">
                <span>🦷</span>
                <span>Dente Todo — O dente inteiro será selecionado e marcado ao clicar</span>
              </span>
            ) : selectedCondition === 'HEALTHY' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[11px]">
                <span>🧹</span>
                <span>Limpar — Clique na face para limpar a face, ou no número para limpar o dente</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 font-bold text-[11px]">
                <span>📍</span>
                <span>Por Face — Clique na face anatômica desejada (V, L, M, D ou O/I)</span>
              </span>
            )}
          </div>
        </div>

        {/* Grupos de Botões */}
        <div className="space-y-2">
          {/* 1. Tratamentos por Faces */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0 w-fit">
              Faces do Dente:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['CARIES', 'RESTORATION_RESIN', 'RESTORATION_AMALGAM', 'SEALANT'] as DentalCondition[]).map((cond) => {
                const meta = DENTAL_CONDITIONS_META[cond];
                const isSelected = selectedCondition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => onSelectCondition(cond)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: meta.colorHex }}
                    />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tratamentos do Dente Todo */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 shrink-0 w-fit">
              Dente Inteiro:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ENDODONTIC_TREATED', 'IMPLANT', 'CROWN', 'EXTRACTION_INDICATED', 'MISSING_TOOTH'] as DentalCondition[]).map((cond) => {
                const meta = DENTAL_CONDITIONS_META[cond];
                const isSelected = selectedCondition === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => onSelectCondition(cond)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: meta.colorHex }}
                    />
                    <span>{meta.label}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">Todo</span>
                  </button>
                );
              })}

              {/* Botão de Limpeza / Hígido */}
              <button
                type="button"
                onClick={() => onSelectCondition('HEALTHY')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  selectedCondition === 'HEALTHY'
                    ? 'border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20 shadow-2xs font-bold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white shrink-0" />
                <span>Hígido (Limpar)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
