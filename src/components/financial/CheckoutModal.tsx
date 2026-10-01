import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  QrCode,
  Banknote,
  UserCheck,
  X,
  Check,
  Calculator,
  AlertTriangle,
  ShieldAlert,
  User,
  FileText,
  Sparkles
} from 'lucide-react';
import { PatientTreatmentItem } from '../../types/patient';

export interface PaymentSplit {
  method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH';
  amount: number;
  feePercentage: number;
}

export interface CheckoutResult {
  idempotencyKey: string;
  patientName: string;
  patientCpf: string;
  payerName: string;
  payerCpf: string;
  grossTotal: number;
  netTotal: number;
  payments: PaymentSplit[];
  description: string;
  timestamp: string;
}

export interface PatientFiscalOption {
  name: string;
  cpf?: string;
  phone?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf: string;
  totalDue?: number;
  procedureSummary?: string;
  treatmentItems?: PatientTreatmentItem[]; // Procedimentos orçados na cadeira clínica
  isAlreadyPaid?: boolean; // Bloqueio de concorrência / duplicidade
  isStandalone?: boolean; // Aberto avulso pelo botão geral da aba Financeiro
  patientsList?: PatientFiscalOption[];
  defaultDebitFee?: number;
  defaultCreditFee?: number;
  pixKey?: string;
  onPaymentCompleted: (result: CheckoutResult) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  totalDue = 500.0,
  procedureSummary = 'Restauração Resina Dente 16 + Profilaxia',
  treatmentItems = [],
  isAlreadyPaid = false,
  isStandalone = false,
  patientsList = [],
  defaultDebitFee = 1.2,
  defaultCreditFee = 2.8,
  pixKey = '45.123.789/0001-10',
  onPaymentCompleted
}) => {
  // Chave única de idempotência gerada por tentativa de cobrança para prevenir duplicidade de transações
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados locais para permitir edição quando aberto de forma avulsa
  const [currentPatientName, setCurrentPatientName] = useState(patientName);
  const [currentPatientCpf, setCurrentPatientCpf] = useState(patientCpf);
  const [currentTotalDue, setCurrentTotalDue] = useState<number>(totalDue);
  const [currentProcedure, setCurrentProcedure] = useState(procedureSummary);

  // Procedimentos selecionados para pagamento (vindos do orçamento do dentista)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Dados fiscais: Paciente vs Pagador (DMED / Carnê-Leão)
  const [isSamePayer, setIsSamePayer] = useState(true);
  const [payerName, setPayerName] = useState(patientName);
  const [payerCpf, setPayerCpf] = useState(patientCpf);

  // Múltiplos métodos de pagamento (Split Payment)
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { method: 'PIX', amount: 200.0, feePercentage: 0.0 },
    { method: 'CREDIT_CARD', amount: 300.0, feePercentage: 2.8 }
  ]);

  // Inicializa chave de idempotência e dados ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(`pay_${crypto.randomUUID()}`);
      setIsSubmitting(false);

      const initialName = isStandalone && patientsList.length > 0 ? patientsList[0].name : patientName;
      const initialCpf = isStandalone && patientsList.length > 0 ? (patientsList[0].cpf || '000.000.000-00') : patientCpf;

      setCurrentPatientName(initialName);
      setCurrentPatientCpf(initialCpf);

      let effectiveTotal = totalDue;
      let effectiveSummary = isStandalone ? 'Procedimento Clínico / Tratamento Odontológico' : procedureSummary;

      if (treatmentItems && treatmentItems.length > 0) {
        setSelectedItemIds(treatmentItems.map((i) => i.id));
        effectiveTotal = Math.round(treatmentItems.reduce((acc, i) => acc + (i.price || 0), 0) * 100) / 100;
        effectiveSummary = treatmentItems.map((i) => i.toothNumber ? `${i.name} (D.${i.toothNumber})` : i.name).join(' + ');
      } else {
        setSelectedItemIds([]);
      }

      setCurrentTotalDue(effectiveTotal);
      setCurrentProcedure(effectiveSummary);

      setIsSamePayer(true);
      setPayerName(initialName);
      setPayerCpf(initialCpf);

      // Inicializa parcelas correspondentes ao totalDue
      if (effectiveTotal <= 300) {
        setPayments([{ method: 'PIX', amount: effectiveTotal, feePercentage: 0.0 }]);
      } else {
        const half = Math.round((effectiveTotal / 2) * 100) / 100;
        const rest = Math.round((effectiveTotal - half) * 100) / 100;
        setPayments([
          { method: 'PIX', amount: half, feePercentage: 0.0 },
          { method: 'CREDIT_CARD', amount: rest, feePercentage: defaultCreditFee }
        ]);
      }
    }
  }, [isOpen, patientName, patientCpf, totalDue, procedureSummary, treatmentItems, isStandalone, patientsList, defaultCreditFee]);

  // Alterna seleção de item do orçamento
  const handleToggleTreatmentItem = (item: PatientTreatmentItem) => {
    const isSelected = selectedItemIds.includes(item.id);
    const newSelectedIds = isSelected
      ? selectedItemIds.filter((id) => id !== item.id)
      : [...selectedItemIds, item.id];

    setSelectedItemIds(newSelectedIds);

    const activeItems = (treatmentItems || []).filter((i) => newSelectedIds.includes(i.id));
    const newTotal = Math.round(activeItems.reduce((acc, i) => acc + (i.price || 0), 0) * 100) / 100;
    setCurrentTotalDue(newTotal);

    const desc = activeItems.length > 0
      ? activeItems.map((i) => i.toothNumber ? `${i.name} (D.${i.toothNumber})` : i.name).join(' + ')
      : 'Procedimentos Odontológicos';
    setCurrentProcedure(desc);

    if (newTotal <= 300) {
      setPayments([{ method: 'PIX', amount: newTotal, feePercentage: 0.0 }]);
    } else {
      const half = Math.round((newTotal / 2) * 100) / 100;
      const rest = Math.round((newTotal - half) * 100) / 100;
      setPayments([
        { method: 'PIX', amount: half, feePercentage: 0.0 },
        { method: 'CREDIT_CARD', amount: rest, feePercentage: defaultCreditFee }
      ]);
    }
  };

  if (!isOpen) return null;

  // Cálculos Síncronos Rigorosos do Split Payment
  const totalPaid = Math.round(payments.reduce((acc, p) => acc + (p.amount || 0), 0) * 100) / 100;
  const remainingDue = Math.round((currentTotalDue - totalPaid) * 100) / 100;

  // Regra de Validação: O botão SÓ é habilitado se o saldo restante for rigorosamente R$ 0,00
  const isBalanceZero = Math.abs(remainingDue) < 0.01;

  // Cálculo de taxas de maquininha para apuração líquida do Livro Caixa
  const totalNet = Math.round(
    payments.reduce((acc, p) => {
      const feeAmount = ((p.amount || 0) * (p.feePercentage || 0)) / 100;
      return acc + ((p.amount || 0) - feeAmount);
    }, 0) * 100
  ) / 100;

  // Adiciona nova linha de parcela
  const handleAddPaymentRow = () => {
    const nextAmount = remainingDue > 0 ? remainingDue : 0;
    setPayments((prev) => [
      ...prev,
      { method: 'CASH', amount: nextAmount, feePercentage: 0.0 }
    ]);
  };

  // Auto-Balanceamento da última linha com 1 clique
  const handleAutoBalanceLastRow = () => {
    if (payments.length === 0) return;
    const lastIndex = payments.length - 1;
    const otherRowsSum = payments
      .slice(0, lastIndex)
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const correctedLastAmount = Math.max(
      0,
      Math.round((currentTotalDue - otherRowsSum) * 100) / 100
    );

    setPayments((prev) =>
      prev.map((p, i) => (i === lastIndex ? { ...p, amount: correctedLastAmount } : p))
    );
  };

  // Atualização Atômica Reativa do Split Payment (Corrige o bug de select travado)
  const handleUpdatePayment = (index: number, updates: Partial<PaymentSplit>) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  // Remove linha de parcela
  const handleRemovePaymentRow = (index: number) => {
    if (payments.length > 1) {
      setPayments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Alteração do paciente no modo avulso
  const handleStandalonePatientChange = (name: string) => {
    setCurrentPatientName(name);
    const found = patientsList.find((p) => p.name === name);
    const cpfVal = found?.cpf || '000.000.000-00';
    setCurrentPatientCpf(cpfVal);
    if (isSamePayer) {
      setPayerName(name);
      setPayerCpf(cpfVal);
    }
  };

  const handleConfirmCheckout = () => {
    if (!isBalanceZero || isSubmitting || isAlreadyPaid) return;

    setIsSubmitting(true);

    const result: CheckoutResult = {
      idempotencyKey,
      patientName: currentPatientName,
      patientCpf: currentPatientCpf,
      payerName: isSamePayer ? currentPatientName : payerName,
      payerCpf: isSamePayer ? currentPatientCpf : payerCpf,
      grossTotal: totalPaid,
      netTotal: totalNet,
      payments,
      description: currentProcedure,
      timestamp: new Date().toISOString()
    };

    onPaymentCompleted(result);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Balcão de Recebimento & Split Payment
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {isStandalone
                  ? 'Recebimento Avulso de Balcão (Livro Caixa & DMED)'
                  : `Atendimento: ${currentPatientName} (${currentPatientCpf})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* CENÁRIO CRÍTICO: BLOQUEIO DE CONCORRÊNCIA / DUPLICIDADE */}
          {isAlreadyPaid && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-2.5 text-red-900 text-xs">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Bloqueio de Duplicidade (Concorrência Ativa):</strong>
              Este atendimento já consta como faturado e pago no sistema por outro operador. Uma nova cobrança foi bloqueada para evitar duplicidade.
            </div>
          </div>
        )}

        {/* MODO AVULSO: SELEÇÃO DE PACIENTE & EDIÇÃO DE VALOR / PROCEDIMENTO */}
        {isStandalone ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Paciente Atendido:
                </label>
                <select
                  value={currentPatientName}
                  onChange={(e) => handleStandalonePatientChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800 bg-white"
                >
                  {patientsList.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} {p.cpf ? `(${p.cpf})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  CPF do Paciente:
                </label>
                <input
                  type="text"
                  value={currentPatientCpf}
                  onChange={(e) => {
                    setCurrentPatientCpf(e.target.value);
                    if (isSamePayer) setPayerCpf(e.target.value);
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Descrição do Tratamento / Procedimento:
                </label>
                <input
                  type="text"
                  value={currentProcedure}
                  onChange={(e) => setCurrentProcedure(e.target.value)}
                  placeholder="Ex: Consulta + Profilaxia + Restauração"
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Total da Fatura (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={currentTotalDue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCurrentTotalDue(val);
                    }}
                    className="w-full border border-slate-300 rounded-xl pl-8 pr-2 py-2 text-xs font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESUMO FIXO / DINÂMICO DO VALOR DEVIDO */
          <div className="space-y-3">
            {/* LISTA DISCRIMINADA DE PROCEDIMENTOS ORÇADOS PELO DENTISTA (SE HOUVER) */}
            {treatmentItems && treatmentItems.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Procedimentos Orçados na Consulta ({selectedItemIds.length}/{treatmentItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItemIds.length === treatmentItems.length) {
                        setSelectedItemIds([]);
                        setCurrentTotalDue(0);
                        setPayments([{ method: 'PIX', amount: 0, feePercentage: 0.0 }]);
                      } else {
                        const allIds = treatmentItems.map((i) => i.id);
                        setSelectedItemIds(allIds);
                        const allSum = Math.round(treatmentItems.reduce((acc, i) => acc + (i.price || 0), 0) * 100) / 100;
                        setCurrentTotalDue(allSum);
                        if (allSum <= 300) {
                          setPayments([{ method: 'PIX', amount: allSum, feePercentage: 0.0 }]);
                        } else {
                          const half = Math.round((allSum / 2) * 100) / 100;
                          const rest = Math.round((allSum - half) * 100) / 100;
                          setPayments([
                            { method: 'PIX', amount: half, feePercentage: 0.0 },
                            { method: 'CREDIT_CARD', amount: rest, feePercentage: defaultCreditFee }
                          ]);
                        }
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    {selectedItemIds.length === treatmentItems.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {treatmentItems.map((item) => {
                    const isChecked = selectedItemIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-blue-200 text-slate-800 shadow-2xs'
                            : 'bg-slate-100/70 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTreatmentItem(item)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold block truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500">
                              {item.toothNumber ? `Dente ${item.toothNumber}${item.surface ? ` (${item.surface})` : ''}` : 'Clínico'}
                            </span>
                          </div>
                        </div>
                        <span className={`font-mono font-bold shrink-0 ml-2 ${isChecked ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                          R$ {item.price.toFixed(2)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase block">
                  Total da Fatura (Procedimento):
                </span>
                <span className="text-xs text-slate-600 font-medium">{currentProcedure}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-800">
                  R$ {currentTotalDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* IDENTIFICAÇÃO FISCAL (DMED / RECEITA FEDERAL) */}
        <div className="space-y-3 p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-2xl text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Responsável Financeiro (Para DMED / Declaração IR)
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={isSamePayer}
                onChange={(e) => {
                  setIsSamePayer(e.target.checked);
                  if (e.target.checked) {
                    setPayerName(currentPatientName);
                    setPayerCpf(currentPatientCpf);
                  }
                }}
                className="rounded text-blue-600"
              />
              O próprio paciente é o pagador
            </label>
          </div>

          {!isSamePayer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">
                  Nome do Responsável / Pagador:
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Ex: Nome da mãe, pai ou cônjuge"
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-0.5">
                  CPF do Responsável / Pagador:
                </label>
                <input
                  type="text"
                  value={payerCpf}
                  onChange={(e) => setPayerCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* FORMAS DE PAGAMENTO COMPOSTAS (SPLIT PAYMENT DESBLOQUEADO E REATIVO) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-600" />
              Parcelas do Pagamento (Split Payment)
            </span>
            <div className="flex items-center gap-2">
              {!isBalanceZero && (
                <button
                  type="button"
                  onClick={handleAutoBalanceLastRow}
                  className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                >
                  ⚡ Ajustar para R$ 0,00
                </button>
              )}
              <button
                type="button"
                onClick={handleAddPaymentRow}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Adicionar Parcela
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {payments.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                
                {/* SELECT REATIVO DE MÉTODO DE PAGAMENTO */}
                <select
                  value={p.method}
                  onChange={(e) => {
                    const m = e.target.value as PaymentSplit['method'];
                    const defaultFee =
                      m === 'CREDIT_CARD' ? defaultCreditFee : m === 'DEBIT_CARD' ? defaultDebitFee : 0.0;
                    handleUpdatePayment(idx, {
                      method: m,
                      feePercentage: defaultFee
                    });
                  }}
                  className="border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 bg-white"
                >
                  <option value="PIX">⚡ PIX (0% taxa)</option>
                  <option value="CASH">💵 Dinheiro (0% taxa)</option>
                  <option value="DEBIT_CARD">💳 Cartão de Débito ({defaultDebitFee}% taxa)</option>
                  <option value="CREDIT_CARD">💳 Cartão de Crédito ({defaultCreditFee}% taxa)</option>
                </select>

                {/* VALOR DA PARCELA */}
                <div className="flex-1 relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={p.amount}
                    onChange={(e) =>
                      handleUpdatePayment(idx, {
                        amount: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg pl-8 pr-2 py-2 text-xs font-bold text-slate-800 bg-white"
                  />
                </div>

                {/* TAXA DA OPERADORA CONFIGURÁVEL */}
                {(p.method === 'CREDIT_CARD' || p.method === 'DEBIT_CARD') && (
                  <div
                    className="w-24 shrink-0 flex items-center gap-1 text-[11px] text-slate-500"
                    title="Taxa da maquininha de cartão"
                  >
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={p.feePercentage}
                      onChange={(e) =>
                        handleUpdatePayment(idx, {
                          feePercentage: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-12 border border-slate-300 rounded-lg p-1.5 text-center text-xs font-bold text-slate-700 bg-white"
                    />
                    <span>% taxa</span>
                  </div>
                )}

                {/* REMOVER LINHA */}
                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePaymentRow(idx)}
                    className="text-slate-400 hover:text-red-500 font-bold px-1.5 py-1 rounded-md"
                    title="Remover parcela"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* CHAVE PIX OFICIAL DO CONSULTÓRIO (SELECIONADO NO CHECKOUT) */}
          {payments.some((p) => p.method === 'PIX') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-800">Chave PIX Oficial: </span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-900">
                    {pixKey}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pixKey);
                  alert('Chave PIX copiada para a área de transferência!');
                }}
                className="self-end sm:self-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Copiar Chave
              </button>
            </div>
          )}
        </div>

        {/* CENÁRIO CRÍTICO: VALIDAÇÃO SÍNCRONA DE SALDO RESTANTE */}
        <div className="space-y-2">
          {remainingDue > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Saldo Restante a Pagar: R$ {remainingDue.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={handleAutoBalanceLastRow}
                className="text-[11px] text-amber-800 font-bold underline cursor-pointer"
              >
                Auto-Balancear Parcela
              </button>
            </div>
          )}

          {remainingDue < 0 && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between text-xs text-red-900">
              <span className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Valor Excedente: R$ {Math.abs(remainingDue).toFixed(2)} acima do total!
              </span>
              <span className="text-[11px] text-red-700 font-semibold">
                Reduza as parcelas para conferir com a fatura
              </span>
            </div>
          )}

          {isBalanceZero && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span className="flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                Soma das Parcelas Conferida: R$ {totalPaid.toFixed(2)} (Saldo Restante = R$ 0,00)
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">
                Pronto para quitação
              </span>
            </div>
          )}
        </div>

          {/* APURAÇÃO BRUTO VS LÍQUIDO LIVRO CAIXA */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Valor Bruto Cobrado do Paciente: R$ {totalPaid.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                Líquido Creditado no Livro Caixa do Dentista:
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-700">
                R$ {totalNet.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER & AÇÕES COM TRAVA SÍNCRONA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 text-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmCheckout}
            disabled={!isBalanceZero || isSubmitting || isAlreadyPaid}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title={!isBalanceZero ? 'Ajuste as parcelas para que a soma seja exatamente igual ao total devido' : ''}
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Processando Quitação...' : 'Confirmar e Emitir Recibo CRO'}
          </button>
        </div>

      </div>
    </div>
  );
};
