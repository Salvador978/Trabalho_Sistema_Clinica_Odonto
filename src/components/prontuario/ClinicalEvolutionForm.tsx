import React, { useState } from 'react';
import { PlusCircle, Check, DollarSign } from 'lucide-react';
import { ProcedurePricing } from '../../types/settings';


export interface ClinicalEvolutionFormProps {
  dentistName: string;
  dentistCro: string;
  activeSterilizationLot: string;
  onSubmit: (procedure: string, tooth: string, text: string) => void;
  selectedTooth?: string;
  onToothChange?: (tooth: string) => void;
  procedurePricings?: ProcedurePricing[];
}

export function ClinicalEvolutionForm({
  dentistName,
  dentistCro,
  activeSterilizationLot,
  onSubmit,
  selectedTooth = '',
  onToothChange,
  procedurePricings = []
}: ClinicalEvolutionFormProps) {
  const [procedure, setProcedure] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(procedure, selectedTooth, text);
    setProcedure('');
    setText('');
    if (onToothChange) onToothChange('');
  };

  const handleSelectPredefined = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    setProcedure(val);
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Registrar Nova Evolução Clínica no Prontuário
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {dentistName} • {dentistCro}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Procedimento Realizado: *
            </label>
            {procedurePricings.length > 0 && (
              <span className="text-[10px] text-blue-600 font-semibold">Tabela de Preços</span>
            )}
          </div>

          {procedurePricings.length > 0 && (
            <select
              onChange={handleSelectPredefined}
              defaultValue=""
              className="w-full mb-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-slate-50 focus:outline-blue-500 cursor-pointer"
            >
              <option value="">⚡ Selecionar rápido da tabela de preços...</option>
              {procedurePricings.filter(p => p.active).map(p => (
                <option key={p.id} value={p.name}>
                  {p.name} — R$ {p.price.toFixed(2)}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            required
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="Ex: Restauração Resina MOD, Exodontia simples, etc."
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-500 bg-white"
          />
        </div>


        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Elemento Dentário / Região:
          </label>
          <input
            type="text"
            value={selectedTooth}
            onChange={(e) => onToothChange?.(e.target.value)}
            placeholder="Ex: Dente 16, Dente 38, Arcada Geral..."
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Anotações Clínicas & Conduta Técnica: *
        </label>
        <textarea
          rows={3}
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Descreva detalhadamente a anestesia, isolamento, materiais empregados, técnica restauradora ou cirúrgica e orientações pós-operatórias transmitidas ao paciente..."
          className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-blue-500 bg-white leading-relaxed"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-3">
        <span className="text-[11px] text-slate-400">
          Lote esterilizado vinculado: <strong className="font-mono text-slate-600">{activeSterilizationLot}</strong>
        </span>
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Salvar Evolução com Assinatura CRO</span>
        </button>
      </div>
    </form>
  );
}
