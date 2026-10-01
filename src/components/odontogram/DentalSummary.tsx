import React, { useState, useMemo } from 'react';
import {
  ToothFinding,
  ConditionLayer,
  DENTAL_CONDITIONS_META
} from '../../types/odontogram';
import { ProcedurePricing } from '../../types/settings';
import { PatientTreatmentItem } from '../../types/patient';
import { DollarSign, CheckCircle2, Plus, Sparkles, Send, Trash2, ArrowRight } from 'lucide-react';

interface DentalSummaryProps {
  findings: ToothFinding[];
  activeLayer: ConditionLayer;
  onRemoveFinding: (findingId: string) => void;
  procedurePricings?: ProcedurePricing[];
  patientName?: string;
  patientId?: string;
  onSyncTreatmentPlan?: (items: PatientTreatmentItem[], total: number) => void;
}

export const DentalSummary: React.FC<DentalSummaryProps> = ({
  findings,
  activeLayer,
  onRemoveFinding,
  procedurePricings = [],
  patientName = 'Paciente',
  patientId,
  onSyncTreatmentPlan
}) => {
  // Achados da camada ativa (Tratamento ou Realizado)
  const currentFindings = findings.filter((f) => f.layer === activeLayer);

  // Procedimentos avulsos adicionados diretamente ao orçamento (ex: Profilaxia, Consulta, Clareamento)
  const [extraItems, setExtraItems] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [selectedExtraProcId, setSelectedExtraProcId] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Mapeador de preços para cada achado clínico
  const budgetedItems: PatientTreatmentItem[] = useMemo(() => {
    const list: PatientTreatmentItem[] = [];

    // Mapear cada dente/face anotado
    currentFindings.forEach((finding) => {
      const meta = DENTAL_CONDITIONS_META[finding.condition];
      
      // Buscar na tabela de procedimentos pelo conditionKey
      let matched = procedurePricings.find((p) => p.active && p.conditionKey === finding.condition);

      // Fallbacks inteligentes por nome se não achar por chave direta
      if (!matched && finding.condition === 'CARIES') {
        matched = procedurePricings.find((p) => p.active && p.name.toLowerCase().includes('resina'));
      }

      const defaultPrice = matched ? matched.price : (finding.condition === 'HEALTHY' ? 0 : 190.0);
      const procName = matched ? matched.name : `${meta.label} no Dente ${finding.toothNumber}`;

      if (defaultPrice > 0 || finding.condition !== 'HEALTHY') {
        list.push({
          id: `item_${finding.id}`,
          procedureId: matched?.id,
          procedureName: `${procName} (${finding.surface === 'GENERAL_TOOTH' ? 'Geral' : `Face ${finding.surface}`})`,
          toothNumber: finding.toothNumber,
          surface: finding.surface,
          price: defaultPrice,
          layer: activeLayer === 'COMPLETED' ? 'COMPLETED' : 'TREATMENT_PLAN',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Adicionar itens extras gerais
    extraItems.forEach((extra) => {
      list.push({
        id: extra.id,
        procedureName: extra.name,
        price: extra.price,
        layer: activeLayer === 'COMPLETED' ? 'COMPLETED' : 'TREATMENT_PLAN',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    });

    return list;
  }, [currentFindings, procedurePricings, extraItems, activeLayer]);

  // Total acumulado em tempo real
  const totalBudget = useMemo(() => {
    return budgetedItems.reduce((acc, curr) => acc + curr.price, 0);
  }, [budgetedItems]);

  // Dentes únicos afetados
  const uniqueTeeth = new Set(currentFindings.map((f) => f.toothNumber));

  // Contagens
  const cariesCount = currentFindings.filter((f) => f.condition === 'CARIES').length;
  const restorationsCount = currentFindings.filter(
    (f) => f.condition === 'RESTORATION_RESIN' || f.condition === 'RESTORATION_AMALGAM'
  ).length;
  const implantsCount = currentFindings.filter((f) => f.condition === 'IMPLANT').length;
  const endodonticCount = currentFindings.filter(
    (f) => f.condition === 'ENDODONTIC_TREATED' || f.condition === 'ENDODONTIC_NEEDED'
  ).length;

  const handleAddExtraProcedure = () => {
    if (!selectedExtraProcId) return;
    const found = procedurePricings.find((p) => p.id === selectedExtraProcId);
    if (!found) return;

    setExtraItems((prev) => [
      ...prev,
      {
        id: `extra_${crypto.randomUUID()}`,
        name: found.name,
        price: found.price
      }
    ]);
    setSelectedExtraProcId('');
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Enviar orçamento para o balcão / cadastro do paciente
  const handleSendToReception = () => {
    if (onSyncTreatmentPlan) {
      onSyncTreatmentPlan(budgetedItems, totalBudget);
      setSyncFeedback(`Orçamento de R$ ${totalBudget.toFixed(2)} liberado para o balcão! A recepcionista já pode consultar.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. CARDS DE ORÇAMENTO EM TEMPO REAL (SOLICITAÇÃO PRINCIPAL DO USUÁRIO) */}
      <div className="bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Orçamento em Tempo Real da Consulta
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {budgetedItems.length} item(ns)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Valores calculados automaticamente pela tabela de preços da clínica para {patientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Previsto:
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {onSyncTreatmentPlan && budgetedItems.length > 0 && (
              <button
                type="button"
                onClick={handleSendToReception}
                className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                title="Salva no prontuário do paciente e disponibiliza imediatamente na tela de recebimento da recepção"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Liberar p/ Balcão</span>
                <span className="sm:hidden">Liberar</span>
              </button>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold p-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* 2. ADICIONAR PROCEDIMENTO GERAL DA TABELA (EX: PROFILAXIA, CLAREAMENTO) */}
        {procedurePricings.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
            <div className="relative flex-1">
              <select
                value={selectedExtraProcId}
                onChange={(e) => setSelectedExtraProcId(e.target.value)}
                className="w-full border border-emerald-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 bg-white focus:outline-emerald-500 cursor-pointer"
              >
                <option value="">+ Incluir procedimento geral da clínica (ex: Limpeza, Consulta, Clareamento)...</option>
                {procedurePricings
                  .filter((p) => p.active)
                  .map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.name} — R$ {proc.price.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!selectedExtraProcId}
              onClick={handleAddExtraProcedure}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 ${
                selectedExtraProcId
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar ao Orçamento</span>
            </button>
          </div>
        )}

        {/* 3. LISTAGEM ITEMIZADA DO ORÇAMENTO CALCULADO */}
        {budgetedItems.length > 0 ? (
          <div className="max-h-48 overflow-y-auto divide-y divide-emerald-100 bg-white/80 rounded-xl p-2.5 border border-emerald-200/60 text-xs">
            {budgetedItems.map((item) => (
              <div
                key={item.id}
                className="py-1.5 px-2 flex items-center justify-between hover:bg-white rounded transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.toothNumber ? (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] shrink-0 font-mono">
                      Dente {item.toothNumber}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                      Clínico
                    </span>
                  )}
                  <span className="font-semibold text-slate-800 truncate">
                    {item.procedureName}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-extrabold text-emerald-700">
                    R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {item.id.startsWith('extra_') && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExtraItem(item.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                      title="Remover procedimento"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2.5 text-xs text-slate-500 italic">
            Nenhum procedimento orçado nesta camada ainda. Conforme você clica nos dentes ou adiciona itens da tabela, o valor aparece aqui automaticamente.
          </div>
        )}
      </div>

      {/* 4. CARDS DE RESUMO E ACHADOS DO ODONTOGRAMA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <span>🦷</span> Resumo Anatômico ({activeLayer === 'INITIAL_STATE' ? 'Estado Inicial' : activeLayer === 'TREATMENT_PLAN' ? 'Plano de Tratamento' : 'Realizado'})
          </h4>
          <span className="text-[11px] text-slate-500 font-medium">
            {currentFindings.length} achado(s) anotado(s)
          </span>
        </div>

        {/* CARDS DE ESTATÍSTICA RÁPIDA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Dentes Acometidos</div>
            <div className="text-base font-extrabold text-slate-800">{uniqueTeeth.size}</div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
            <div className="text-[10px] text-red-700 font-bold uppercase">Cáries Ativas</div>
            <div className="text-base font-extrabold text-red-600">{cariesCount}</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
            <div className="text-[10px] text-blue-700 font-bold uppercase">Restaurações</div>
            <div className="text-base font-extrabold text-blue-600">{restorationsCount}</div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
            <div className="text-[10px] text-indigo-700 font-bold uppercase">Implantes / Endo</div>
            <div className="text-base font-extrabold text-indigo-600">{implantsCount + endodonticCount}</div>
          </div>
        </div>

        {/* LISTAGEM DETALHADA DOS DENTES COM BOTÃO DE EXCLUIR ACHADO */}
        {currentFindings.length > 0 && (
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
            {currentFindings.map((finding) => {
              const meta = DENTAL_CONDITIONS_META[finding.condition];
              return (
                <div
                  key={finding.id}
                  className="py-1.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: meta.colorHex }}
                    />
                    <span className="font-bold text-slate-800">
                      Dente {finding.toothNumber}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {finding.surface === 'GENERAL_TOOTH' ? '(Dente Inteiro)' : `Face ${finding.surface}`}
                    </span>
                    <span className="text-slate-700 font-medium text-[11px]">
                      {meta.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveFinding(finding.id)}
                    className="text-slate-400 hover:text-red-500 font-bold px-1 transition-colors cursor-pointer text-xs"
                    title="Remover achado do dente"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
