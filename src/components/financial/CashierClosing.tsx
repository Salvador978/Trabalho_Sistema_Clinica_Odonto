import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  Banknote,
  QrCode,
  CreditCard,
  Calendar,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  DollarSign
} from 'lucide-react';
import { Transaction } from './CashbookView';

export interface DailyClosingSummary {
  date: string;
  cashInDrawer: number;
  pixTotal: number;
  debitGross: number;
  debitNet: number;
  creditGross: number;
  creditNet: number;
  totalGross: number;
  totalNet: number;
  operator: string;
  notes?: string;
  closedAt: string;
}

interface CashierClosingProps {
  selectedDate: string; // Formato YYYY-MM-DD
  transactions?: Transaction[];
  operatorName?: string;
  clinicName?: string;
  dentistName?: string;
  dentistCro?: string;
  debitFee?: number;
  creditFee?: number;
  onOpenReceipt?: (tx: Transaction) => void;
}

export const CashierClosing: React.FC<CashierClosingProps> = ({
  selectedDate,
  transactions = [],
  operatorName = 'Mariana Costa (Recepção)',
  clinicName = 'Consultório Odontológico',
  dentistName = 'Dra. Juliana Mendes',
  dentistCro = 'CRO-SP 123.456',
  debitFee = 1.5,
  creditFee = 3.5,
  onOpenReceipt
}) => {
  // Filtragem dos recebimentos (entradas) do dia selecionado
  const dayIncomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'INCOME');
  }, [transactions]);

  // Cálculos dinâmicos por método de pagamento (zero por padrão caso não haja transações)
  const totals = useMemo(() => {
    let cash = 0;
    let pix = 0;
    let debGross = 0;
    let debNet = 0;
    let credGross = 0;
    let credNet = 0;

    dayIncomeTransactions.forEach((tx) => {
      // Se houver pagamentos fracionados explícitos (split payments do balcão)
      if (tx.payments && tx.payments.length > 0) {
        tx.payments.forEach((p) => {
          const m = (p.method || '').toLowerCase();
          const amt = Number(p.amount) || 0;
          const fee = p.feePercentage !== undefined ? p.feePercentage : (m.includes('débito') || m.includes('debito') || m.includes('debit') ? debitFee : m.includes('crédito') || m.includes('credito') || m.includes('credit') ? creditFee : 0);

          if (m.includes('dinheiro') || m === 'cash') {
            cash += amt;
          } else if (m.includes('pix')) {
            pix += amt;
          } else if (m.includes('débito') || m.includes('debito') || m.includes('debit')) {
            debGross += amt;
            debNet += amt * (1 - fee / 100);
          } else if (m.includes('crédito') || m.includes('credito') || m.includes('credit')) {
            credGross += amt;
            credNet += amt * (1 - fee / 100);
          } else {
            pix += amt;
          }
        });
      } else {
        // Fallback baseado no campo method
        const m = (tx.method || '').toLowerCase();
        const amt = Number(tx.amount) || 0;

        if (m.includes('dinheiro')) {
          cash += amt;
        } else if (m.includes('pix')) {
          pix += amt;
        } else if (m.includes('débito') || m.includes('debito')) {
          debGross += amt;
          debNet += amt * (1 - debitFee / 100);
        } else if (m.includes('crédito') || m.includes('credito')) {
          credGross += amt;
          credNet += amt * (1 - creditFee / 100);
        } else {
          pix += amt;
        }
      }
    });

    const totalGross = cash + pix + debGross + credGross;
    const totalNet = cash + pix + debNet + credNet;

    return {
      cashInDrawer: cash,
      pixTotal: pix,
      debitGross: debGross,
      debitNet: debNet,
      creditGross: credGross,
      creditNet: credNet,
      totalGross,
      totalNet
    };
  }, [dayIncomeTransactions, debitFee, creditFee]);

  // Formatação amigável da data
  const formattedDateTitle = useMemo(() => {
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const shortDateBR = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Persistência do fechamento por data específica no localStorage
  const storageKey = `cashier_closed_${selectedDate}`;
  const [closedInfo, setClosedInfo] = useState<{ closedAt: string; operator: string; notes: string } | null>(null);
  const [notes, setNotes] = useState('');

  // Atualizar quando trocar de data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`cashier_closed_${selectedDate}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setClosedInfo(parsed);
        setNotes(parsed.notes || '');
      } else {
        setClosedInfo(null);
        setNotes('');
      }
    } catch {
      setClosedInfo(null);
      setNotes('');
    }
  }, [selectedDate]);

  const isClosed = Boolean(closedInfo);

  const handleExecuteClosing = () => {
    const info = {
      closedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      operator: operatorName,
      notes: notes.trim()
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(info));
    } catch (e) {
      console.error(e);
    }
    setClosedInfo(info);
  };

  const handleReopenCashier = () => {
    if (window.confirm(`Deseja reabrir o fechamento de caixa do dia ${shortDateBR}?`)) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error(e);
      }
      setClosedInfo(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
      {/* CABEÇALHO DO FECHAMENTO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {isClosed ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Fechamento Diário de Caixa & Balcão
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                {formattedDateTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isClosed ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Fechado às {closedInfo?.closedAt}
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Imprimir Relatório de Fechamento"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Fechamento</span>
              </button>
              <button
                type="button"
                onClick={handleReopenCashier}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reabrir Caixa para Ajustes"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Caixa em Aberto
            </span>
          )}
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {shortDateBR}
          </span>
        </div>
      </div>

      {/* DISCRIMINAÇÃO POR MÉTODO DE PAGAMENTO (VALORES ZERADOS CASO NÃO HAJA ENTRADAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Dinheiro */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Dinheiro em Gaveta</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Banknote className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black ${totals.cashInDrawer > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
            R$ {totals.cashInDrawer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 block">Conferência física na gaveta</span>
        </div>

        {/* PIX */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">PIX Instantâneo</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <QrCode className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black ${totals.pixTotal > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
            R$ {totals.pixTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block">Creditado em conta corrente</span>
        </div>

        {/* Cartão de Débito */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Cartão de Débito</span>
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black ${totals.debitGross > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
            R$ {totals.debitGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Líquido: R$ {totals.debitNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (taxa {debitFee}%)
          </span>
        </div>

        {/* Cartão de Crédito */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Cartão de Crédito</span>
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black ${totals.creditGross > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
            R$ {totals.creditGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Líquido: R$ {totals.creditNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (taxa {creditFee}%)
          </span>
        </div>
      </div>

      {/* CONSOLIDAÇÃO TOTAL BRUTO VS LÍQUIDO */}
      <div className="bg-linear-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
            Total Consolidado do Dia ({shortDateBR})
          </span>
          <div className="flex items-baseline gap-4 flex-wrap">
            <div>
              <span className="text-xs text-slate-500">Total Bruto Cobrado:</span>
              <div className="text-2xl font-black text-slate-900">
                R$ {totals.totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="border-l border-blue-200 pl-4">
              <span className="text-xs text-emerald-700 font-bold">Líquido em Caixa:</span>
              <div className="text-2xl font-black text-emerald-600">
                R$ {totals.totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 block">
            Operador de caixa: <strong>{closedInfo?.operator || operatorName}</strong>
          </span>
        </div>

        <div>
          {!isClosed ? (
            <button
              type="button"
              onClick={handleExecuteClosing}
              className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Realizar Fechamento do Dia
            </button>
          ) : (
            <div className="bg-emerald-100 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fechamento Concluído às {closedInfo?.closedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* LISTA / HISTÓRICO DE RECEBIMENTOS DO DIA SELECIONADO */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recebimentos do Dia ({shortDateBR})
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {dayIncomeTransactions.length} {dayIncomeTransactions.length === 1 ? 'recebimento' : 'recebimentos'}
            </span>
          </div>
        </div>

        {dayIncomeTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Nenhum recebimento registrado em {shortDateBR}.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Os valores de fechamento de caixa deste dia estão zerados (R$ 0,00). Novos recebimentos feitos no balcão aparecerão aqui automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayIncomeTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {tx.patientName || tx.desc}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                        {tx.method}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                      {tx.time && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {tx.time}
                        </span>
                      )}
                      <span>•</span>
                      <span>{tx.category}</span>
                      {tx.desc && tx.patientName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">{tx.desc}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600">
                      R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {onOpenReceipt && (
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(tx)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Visualizar Recibo"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Recibo</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OBSERVAÇÕES / JUSTIFICATIVAS */}
      <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
        <label className="font-semibold text-slate-700 flex items-center justify-between">
          <span>Observações / Ocorrências de Caixa do Dia:</span>
          {isClosed && (
            <span className="text-[11px] text-slate-400 font-normal">
              Gravado no fechamento
            </span>
          )}
        </label>
        <textarea
          rows={2}
          value={notes}
          disabled={isClosed}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Diferença de troco, sangrias para pequenos gastos da clínica, fundo inicial de gaveta..."
          className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 bg-white disabled:bg-slate-50/80 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
        />
      </div>

      {/* ÁREA DE IMPRESSÃO (EXCLUSIVA PARA WINDOW.PRINT) */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-9999">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold">{clinicName}</h1>
          <p className="text-sm">{dentistName} - {dentistCro}</p>
          <h2 className="text-lg font-bold mt-2 uppercase tracking-wide">
            Relatório de Fechamento Diário de Caixa
          </h2>
          <p className="text-xs text-gray-600">
            Data de Referência: {shortDateBR} ({formattedDateTitle})
          </p>
          <p className="text-xs text-gray-600">
            Operador: {closedInfo?.operator || operatorName} | Fechado às: {closedInfo?.closedAt || 'Em Aberto'}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold border-b pb-1 mb-2">Totais por Forma de Pagamento</h3>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b">
                <td className="py-1">Dinheiro em Gaveta (Espécie):</td>
                <td className="py-1 text-right font-bold">R$ {totals.cashInDrawer.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">PIX Instantâneo:</td>
                <td className="py-1 text-right font-bold">R$ {totals.pixTotal.toFixed(2)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">Cartão de Débito (Bruto):</td>
                <td className="py-1 text-right font-bold">R$ {totals.debitGross.toFixed(2)} (Líq: R$ {totals.debitNet.toFixed(2)})</td>
              </tr>
              <tr className="border-b">
                <td className="py-1">Cartão de Crédito (Bruto):</td>
                <td className="py-1 text-right font-bold">R$ {totals.creditGross.toFixed(2)} (Líq: R$ {totals.creditNet.toFixed(2)})</td>
              </tr>
              <tr className="border-b font-bold text-sm bg-gray-100">
                <td className="py-2 px-1">TOTAL BRUTO RECEBIDO:</td>
                <td className="py-2 px-1 text-right">R$ {totals.totalGross.toFixed(2)}</td>
              </tr>
              <tr className="border-b font-bold text-sm bg-gray-100">
                <td className="py-2 px-1">TOTAL LÍQUIDO EM CAIXA:</td>
                <td className="py-2 px-1 text-right">R$ {totals.totalNet.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {dayIncomeTransactions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold border-b pb-1 mb-2">Discriminação dos Recebimentos ({dayIncomeTransactions.length})</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1">Hora</th>
                  <th className="py-1">Paciente / Descrição</th>
                  <th className="py-1">Forma</th>
                  <th className="py-1 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {dayIncomeTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b">
                    <td className="py-1 text-gray-600">{tx.time || '-'}</td>
                    <td className="py-1 font-medium">{tx.patientName || tx.desc}</td>
                    <td className="py-1">{tx.method}</td>
                    <td className="py-1 text-right font-bold">R$ {tx.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {notes && (
          <div className="mb-6">
            <h3 className="text-sm font-bold border-b pb-1 mb-1">Observações do Caixa</h3>
            <p className="text-xs italic bg-gray-50 p-2 rounded border border-gray-200">{notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-8 pt-10 mt-8 border-t text-center text-xs">
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold">{closedInfo?.operator || operatorName}</p>
            <p className="text-gray-500">Operador(a) do Caixa</p>
          </div>
          <div>
            <div className="border-t border-black w-48 mx-auto mb-1"></div>
            <p className="font-bold">{dentistName}</p>
            <p className="text-gray-500">Responsável Clínico - {dentistCro}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
