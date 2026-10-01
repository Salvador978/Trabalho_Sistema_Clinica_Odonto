import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  History,
  Layers,
  Banknote,
  QrCode,
  CreditCard
} from 'lucide-react';
import { CashierClosing } from './CashierClosing';
import { normalizeDateToYMD, formatYMDToBR } from '../../utils/dateUtils';

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  desc: string;
  amount: number;
  method: string;
  dmed: boolean;
  patientName?: string;
  patientCpf?: string;
  payerCpf?: string;
  payments?: { method: string; amount: number; feePercentage?: number }[];
  time?: string;
}

export interface CashbookViewProps {
  transactions: Transaction[];
  currentUserRole: 'DENTIST' | 'RECEPTIONIST';
  onAddTransaction?: (tx: Transaction) => void;
  onOpenNewCheckout: () => void;
  dentistName?: string;
  dentistCro?: string;
  receptionistName?: string;
  clinicName?: string;
  debitFee?: number;
  creditFee?: number;
  onOpenReceipt?: (tx: Transaction) => void;
}

export const CashbookView: React.FC<CashbookViewProps> = ({
  transactions,
  currentUserRole,
  onAddTransaction,
  onOpenNewCheckout,
  dentistName = 'Dra. Juliana Mendes',
  dentistCro = 'CRO-SP 123.456',
  receptionistName = 'Mariana Costa',
  clinicName = 'Consultório Odontológico',
  debitFee = 1.5,
  creditFee = 3.5,
  onOpenReceipt
}) => {
  // Data selecionada para navegação (inicializa com hoje)
  const todayYMD = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [viewMode, setViewMode] = useState<'DAY' | 'ALL'>('DAY');

  // Aba ativa: Livro Caixa ou Fechamento Diário
  const [financeSubTab, setFinanceSubTab] = useState<'CASHBOOK' | 'CLOSING'>('CLOSING');

  // Filtros de busca no histórico
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  // Modal para lançamento de nova despesa
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseDate, setExpenseDate] = useState(selectedDate);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Dental / Insumos');
  const [expenseMethod, setExpenseMethod] = useState('PIX');

  // Navegação de datas (Estilo Agenda)
  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
    setViewMode('DAY');
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
    setViewMode('DAY');
  };

  const handleToday = () => {
    setSelectedDate(todayYMD);
    setViewMode('DAY');
  };

  // Formatação de data amigável em português
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
    return formatYMDToBR(selectedDate);
  }, [selectedDate]);

  const isToday = selectedDate === todayYMD;

  // Lançamentos filtrados do dia selecionado
  const dayTransactions = useMemo(() => {
    return transactions.filter((t) => normalizeDateToYMD(t.date) === selectedDate);
  }, [transactions, selectedDate]);

  // Contadores do dia selecionado
  const dayIncomeTotal = useMemo(() => {
    return dayTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [dayTransactions]);

  const dayExpenseTotal = useMemo(() => {
    return dayTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [dayTransactions]);

  // Lançamentos exibidos (respeitando modo Dia vs Todos os Dias e filtros)
  const displayedTransactions = useMemo(() => {
    const baseList = viewMode === 'DAY' ? dayTransactions : transactions;

    return baseList.filter((t) => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;

      if (filterMethod !== 'ALL') {
        const m = (t.method || '').toLowerCase();
        if (filterMethod === 'DINHEIRO' && !m.includes('dinheiro')) return false;
        if (filterMethod === 'PIX' && !m.includes('pix')) return false;
        if (filterMethod === 'DEBITO' && !m.includes('débito') && !m.includes('debito')) return false;
        if (filterMethod === 'CREDITO' && !m.includes('crédito') && !m.includes('credito')) return false;
        if (filterMethod === 'BOLETO' && !m.includes('boleto')) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (t.desc || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const patMatch = (t.patientName || '').toLowerCase().includes(q);
        const dateMatch = (t.date || '').toLowerCase().includes(q);
        const methodMatch = (t.method || '').toLowerCase().includes(q);
        return descMatch || catMatch || patMatch || dateMatch || methodMatch;
      }

      return true;
    });
  }, [viewMode, dayTransactions, transactions, filterType, filterMethod, searchQuery]);

  // Totais consolidados da visualização ativa
  const activeIncomeTotal = useMemo(() => {
    return displayedTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [displayedTransactions]);

  const activeExpenseTotal = useMemo(() => {
    return displayedTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [displayedTransactions]);

  const activeNetBalance = activeIncomeTotal - activeExpenseTotal;

  // Exportação oficial para Carnê-Leão e DMED em CSV
  const handleExportCarneLeao = () => {
    const exportList = viewMode === 'DAY' ? dayTransactions : transactions;
    const headers = [
      'Data',
      'Hora',
      'Tipo_Operacao',
      'Categoria',
      'Paciente',
      'Descricao',
      'Forma_Pagamento',
      'Valor_Bruto_RS',
      'Declaravel_DMED',
      'Profissional_CRO'
    ];

    const rows = exportList.map((tx) => [
      `"${tx.date}"`,
      `"${tx.time || ''}"`,
      `"${tx.type === 'INCOME' ? 'Receita Tributável' : 'Despesa Dedutível'}"`,
      `"${tx.category}"`,
      `"${(tx.patientName || '').replace(/"/g, '""')}"`,
      `"${tx.desc.replace(/"/g, '""')}"`,
      `"${tx.method}"`,
      (Number(tx.amount) || 0).toFixed(2),
      tx.dmed ? '"SIM"' : '"NAO"',
      `"${dentistCro}"`
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateSuffix = viewMode === 'DAY' ? selectedDate : `completo_${new Date().toISOString().split('T')[0]}`;
    link.download = `financeiro_carne_leao_${dateSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc.trim() || !expenseAmount) return;

    const val = parseFloat(expenseAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const formattedDate = formatYMDToBR(expenseDate);
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newTx: Transaction = {
      id: `tx_${crypto.randomUUID()}`,
      date: formattedDate,
      time: nowTime,
      type: 'EXPENSE',
      category: expenseCategory,
      desc: expenseDesc.trim(),
      amount: val,
      method: expenseMethod,
      dmed: false
    };

    if (onAddTransaction) {
      onAddTransaction(newTx);
    }
    setExpenseDesc('');
    setExpenseAmount('');
    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* 1. NAVEGADOR DE DATAS & HEADER FINANCEIRO (IDÊNTICO À AGENDA) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs border border-emerald-100 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
                {viewMode === 'DAY' ? formattedDateTitle : 'Histórico Geral Completo'}
              </h2>
              {viewMode === 'DAY' && isToday && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Hoje
                </span>
              )}
              {viewMode === 'ALL' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                  Todos os Dias
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap mt-0.5">
              {viewMode === 'DAY' ? (
                <>
                  <span className="text-emerald-700 font-bold">
                    R$ {dayIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebidos
                  </span>
                  <span>•</span>
                  <span className="text-red-600 font-medium">
                    R$ {dayExpenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} despesas
                  </span>
                  <span>•</span>
                  <span>{dayTransactions.length} lançamentos no dia</span>
                </>
              ) : (
                <>
                  <span>Exibindo todos os {transactions.length} lançamentos históricos da clínica</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Controles de Navegação de Dias e Ações Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navegador ◀ Hoje ▶ */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Seletor de Data Direto */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setViewMode('DAY');
            }}
            className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 font-medium focus:outline-blue-500 cursor-pointer"
            title="Selecionar Data Específica"
          />

          {/* Alternador Dia Selecionado vs Todos os Dias */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'DAY' ? 'ALL' : 'DAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              viewMode === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={viewMode === 'DAY' ? 'Ver todo o histórico de transações' : 'Voltar para o dia selecionado'}
          >
            {viewMode === 'DAY' ? (
              <>
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Ver Todo Histórico</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5 text-white" />
                <span>Ver Dia Selecionado</span>
              </>
            )}
          </button>

          {/* Botão de Recebimento no Balcão */}
          <button
            type="button"
            onClick={onOpenNewCheckout}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto sm:ml-0 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Recebimento no Balcão</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVEGAÇÃO DAS TELAS FINANCEIRAS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFinanceSubTab('CLOSING')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all text-center cursor-pointer flex items-center gap-1.5 ${
              financeSubTab === 'CLOSING'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Fechamento Diário de Caixa</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {shortDateBR}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFinanceSubTab('CASHBOOK')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all text-center cursor-pointer flex items-center gap-1.5 ${
              financeSubTab === 'CASHBOOK'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Livro Caixa & Histórico de Lançamentos</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">
              {viewMode === 'DAY' ? dayTransactions.length : transactions.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentUserRole === 'DENTIST' && (
            <button
              type="button"
              onClick={() => {
                setExpenseDate(selectedDate);
                setIsExpenseModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-red-600" />
              <span>Lançar Despesa</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCarneLeao}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Exportar planilha formatada para importação no Carnê-Leão da Receita Federal / DMED"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar CSV (DMED)</span>
          </button>
        </div>
      </div>

      {/* 3. CONTEÚDO DA ABA 1: FECHAMENTO DIÁRIO DE CAIXA */}
      {financeSubTab === 'CLOSING' && (
        <CashierClosing
          selectedDate={selectedDate}
          transactions={dayTransactions}
          operatorName={currentUserRole === 'DENTIST' ? dentistName : `${receptionistName} (Recepção)`}
          clinicName={clinicName}
          dentistName={dentistName}
          dentistCro={dentistCro}
          debitFee={debitFee}
          creditFee={creditFee}
          onOpenReceipt={onOpenReceipt}
        />
      )}

      {/* 4. CONTEÚDO DA ABA 2: LIVRO CAIXA & HISTÓRICO DE PAGAMENTOS */}
      {financeSubTab === 'CASHBOOK' && (
        <div className="space-y-4">
          {/* CARDS DE RESUMO FINANCEIRO (DO PERÍODO ATIVO) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Recebimentos (Entradas)</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                R$ {activeIncomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {viewMode === 'DAY' ? `Entradas em ${shortDateBR}` : 'Total histórico acumulado'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Despesas Operacionais</span>
                <span className="p-1.5 rounded-lg bg-red-100 text-red-700">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-red-600">
                R$ {activeExpenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {viewMode === 'DAY' ? `Despesas em ${shortDateBR}` : 'Total histórico acumulado'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Saldo Líquido</span>
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className={`text-2xl font-black ${activeNetBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                R$ {activeNetBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {viewMode === 'DAY' ? `Resultado do dia ${shortDateBR}` : 'Saldo operacional global'}
              </span>
            </div>
          </div>

          {/* BARRA DE FILTROS & PESQUISA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por paciente, procedimento, categoria ou forma de pagamento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Filtro de Tipo (Entrada/Saída) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterType === 'ALL' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('INCOME')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterType === 'INCOME' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Entradas (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('EXPENSE')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterType === 'EXPENSE' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Saídas (-)
                </button>
              </div>

              {/* Filtro de Forma de Pagamento */}
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shrink-0 cursor-pointer"
              >
                <option value="ALL">Todas Formas</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="DEBITO">Cartão de Débito</option>
                <option value="CREDITO">Cartão de Crédito</option>
                <option value="BOLETO">Boleto</option>
              </select>
            </div>

            {/* Aviso de Modo Ativo */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
              <span>
                Exibindo <strong>{displayedTransactions.length}</strong> registro(s) {viewMode === 'DAY' ? `no dia ${shortDateBR}` : 'no histórico geral'}.
              </span>
              {viewMode === 'DAY' && (
                <button
                  type="button"
                  onClick={() => setViewMode('ALL')}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  Clique aqui para navegar por todos os dias
                </button>
              )}
            </div>
          </div>

          {/* TABELA / CARDS DE LANÇAMENTOS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* MODO CARDS (VISÍVEL NO MOBILE / IPHONE) */}
            <div className="md:hidden space-y-2.5">
              {displayedTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </div>
              ) : (
                displayedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/70 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {tx.patientName || tx.desc}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span className="font-semibold text-slate-700">{tx.date}</span>
                          {tx.time && (
                            <>
                              <span>•</span>
                              <span>{tx.time}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="text-slate-600">{tx.category}</span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-extrabold shrink-0 ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'} R$ {(Number(tx.amount) || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'INCOME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.type === 'INCOME' ? 'Receita' : 'Despesa'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 text-[10px] font-semibold">
                          {tx.method}
                        </span>
                        {tx.dmed && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            DMED
                          </span>
                        )}
                      </div>

                      {tx.type === 'INCOME' && onOpenReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(tx)}
                          className="px-2 py-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Recibo</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MODO TABELA (VISÍVEL NO DESKTOP / IPAD) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Paciente / Descrição</th>
                    <th className="p-3">Forma de Pagamento</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Nenhum lançamento registrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    displayedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{tx.date}</div>
                          {tx.time && <div className="text-[10px] text-slate-400">{tx.time}</div>}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.type === 'INCOME'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.type === 'INCOME' ? 'Receita (+)' : 'Despesa (-)'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{tx.category}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{tx.patientName || tx.desc}</div>
                          {tx.patientName && tx.desc && (
                            <div className="text-[11px] text-slate-500">{tx.desc}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {tx.method}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-bold whitespace-nowrap ${
                            tx.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {tx.type === 'INCOME' ? '+' : '-'} R$ {(Number(tx.amount) || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {tx.type === 'INCOME' && onOpenReceipt ? (
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(tx)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Visualizar Recibo Oficial"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Recibo</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA LANÇAR NOVA DESPESA */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Lançar Despesa do Consultório
              </h3>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Data da Despesa
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descrição da Despesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dental Cremer - Resinas e Luvas"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-red-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Categoria Contábil (Carnê-Leão)
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Dental / Insumos">Dental / Insumos Odontológicos</option>
                  <option value="Protético">Serviços de Laboratório Protético</option>
                  <option value="Aluguel / Condomínio">Aluguel / Condomínio do Consultório</option>
                  <option value="Água / Energia / Internet">Água / Energia / Internet</option>
                  <option value="Manutenção de Equipamentos">Manutenção de Autoclave e Cadeira</option>
                  <option value="Impostos / CRO">Taxas CRO / Alvará / Vigilância</option>
                  <option value="Outros">Outras Despesas Operacionais</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
