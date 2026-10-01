import React from 'react';
import { FileCheck2, Tablet, Pill, FileText, Lock } from 'lucide-react';

export interface DocumentCardsGridProps {
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  onOpenConsent: () => void;
  onOpenAnamnesis: () => void;
  onOpenPrescription: () => void;
  onOpenDocument: () => void;
}

export function DocumentCardsGrid({
  currentUserRole,
  onOpenConsent,
  onOpenAnamnesis,
  onOpenPrescription,
  onOpenDocument
}: DocumentCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1: TCLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Termo de Consentimento (TCLE)
          </h4>
          <p className="text-xs text-slate-500">
            Geração de termo com riscos cirúrgicos anatômicos e assinatura digital em tela com carimbo de data/hora.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenConsent}
          className="w-full py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Emitir / Assinar TCLE</span>
        </button>
      </div>

      {/* Card 2: Anamnese Tablet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <Tablet className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Anamnese no Tablet
          </h4>
          <p className="text-xs text-slate-500">
            Questionário simplificado de saúde bucal e alergias para o paciente preencher na recepção.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAnamnesis}
          className="w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Abrir Modo Tablet</span>
        </button>
      </div>

      {/* Card 3: Receituário Ágil */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Receituário Odontológico Ágil
          </h4>
          <p className="text-xs text-slate-500">
            Prescrição de antimicrobianos e analgésicos com posologias pré-configuradas e envio direto no WhatsApp.
          </p>
        </div>
        {currentUserRole === 'DENTIST' ? (
          <button
            type="button"
            onClick={onOpenPrescription}
            className="w-full py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Prescrever Receita</span>
          </button>
        ) : (
          <span className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed">
            <Lock className="w-3 h-3" />
            Exclusivo Dentista
          </span>
        )}
      </div>

      {/* Card 4: Atestados & Orçamentos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            Atestados & Orçamentos
          </h4>
          <p className="text-xs text-slate-500">
            Emissão de atestado de comparecimento com repouso (CFO) e propostas de orçamento com parcelamento.
          </p>
        </div>
        {currentUserRole === 'DENTIST' ? (
          <button
            type="button"
            onClick={onOpenDocument}
            className="w-full py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Emitir Documento</span>
          </button>
        ) : (
          <span className="w-full py-2 text-xs font-semibold text-slate-400 bg-slate-100 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed">
            <Lock className="w-3 h-3" />
            Exclusivo Dentista
          </span>
        )}
      </div>
    </div>
  );
}
