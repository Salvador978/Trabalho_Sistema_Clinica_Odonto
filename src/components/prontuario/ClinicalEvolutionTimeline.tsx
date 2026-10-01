import React from 'react';
import { ClinicalEvolution } from '../../data/seedEvolutions';

export interface ClinicalEvolutionTimelineProps {
  evolutions: ClinicalEvolution[];
}

export function ClinicalEvolutionTimeline({ evolutions }: ClinicalEvolutionTimelineProps) {
  if (evolutions.length === 0) {
    return (
      <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-500">Nenhuma evolução registrada para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
        Histórico Cronológico de Atendimentos & Evoluções
      </h4>

      {evolutions.map((evo) => (
        <div
          key={evo.id}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 hover:border-blue-200 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {evo.procedure}
              </span>
              {evo.tooth && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                  {evo.tooth}
                </span>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              {evo.date}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {evo.text}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[11px] text-slate-400">
            <span>
              Responsável: <strong className="text-slate-600">{evo.dentistName} ({evo.dentistCro})</strong>
            </span>
            {evo.sterilizationLot && (
              <span className="font-mono">
                Autoclave: {evo.sterilizationLot}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
