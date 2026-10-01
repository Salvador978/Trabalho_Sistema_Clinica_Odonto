import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Package, 
  CreditCard 
} from 'lucide-react';
import { Patient } from '../../types/patient';
import { AppointmentItem } from '../schedule/AppointmentModal';
import { Transaction } from '../financial/CashbookView';
import { InventoryItem } from '../inventory/InventoryModal';

interface DashboardViewProps {
  patients: Patient[];
  appointments: AppointmentItem[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  dentistName: string;
  clinicName: string;
}

export function DashboardView({
  patients,
  appointments,
  transactions,
  inventory,
  dentistName,
  clinicName
}: DashboardViewProps) {
  const [period, setPeriod] = useState<'ALL' | 'MONTH' | 'TODAY'>('MONTH');

  // Cálculos financeiros
  const metrics = useMemo(() => {
    const incomeTxs = transactions.filter((t) => t.type === 'INCOME');
    const expenseTxs = transactions.filter((t) => t.type === 'EXPENSE');

    const totalIncome = incomeTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = expenseTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Métodos de pagamento
    const paymentMethods: Record<string, number> = {
      PIX: 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0,
      Dinheiro: 0
    };

    incomeTxs.forEach((t) => {
      const m = (t.method || '').toUpperCase();
      if (m.includes('PIX')) paymentMethods['PIX'] += t.amount || 0;
      else if (m.includes('CRÉD') || m.includes('CRED')) paymentMethods['Cartão de Crédito'] += t.amount || 0;
      else if (m.includes('DÉB') || m.includes('DEB')) paymentMethods['Cartão de Débito'] += t.amount || 0;
      else paymentMethods['Dinheiro'] += t.amount || 0;
    });

    // Taxa de comparecimento na agenda
    const completedApps = appointments.filter((a) => a.status === 'COMPLETED').length;
    const cancelledApps = appointments.filter((a) => a.status === 'CANCELLED').length;
    const totalFinished = completedApps + cancelledApps;
    const attendanceRate = totalFinished > 0 ? Math.round((completedApps / totalFinished) * 100) : 100;

    // Procedimentos frequentes
    const procedureCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      if (a.procedure) {
        const key = a.procedure.split(',')[0].trim();
        procedureCounts[key] = (procedureCounts[key] || 0) + 1;
      }
    });

    const topProcedures = Object.entries(procedureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Alertas de estoque crítico ou próximo do vencimento
    const now = new Date();
    const lowStockItems = inventory.filter((i) => i.qty <= (i.minStock || 5));
    const expiringSoonItems = inventory.filter((i) => {
      if (!i.exp) return false;
      const exp = new Date(i.exp);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    });

    return {
      totalIncome,
      totalExpense,
      netProfit,
      paymentMethods,
      completedApps,
      attendanceRate,
      topProcedures,
      lowStockCount: lowStockItems.length,
      expiringCount: expiringSoonItems.length
    };
  }, [patients, appointments, transactions, inventory]);

  return (
    <div className="space-y-6">
      {/* Header com Boas-Vindas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Activity size={14} /> Painel Analítico da Clínica
          </span>
          <h1 className="text-2xl font-bold text-slate-800">
            Métricas de Desempenho Clínico & Financeiro
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {clinicName} • Responsável: <strong className="text-slate-700">{dentistName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setPeriod('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === 'TODAY' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriod('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === 'MONTH' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setPeriod('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Geral
          </button>
        </div>
      </div>

      {/* Cards de Indicadores Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Faturamento Bruto</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              R$ {metrics.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-emerald-500" /> Lucro Líquido: R$ {metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Pacientes Cadastrados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Base de Pacientes</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{patients.length}</h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <Users size={12} className="text-blue-500" /> Pacientes registrados
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        {/* Atendimentos Concluídos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultas Realizadas</p>
            <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{metrics.completedApps}</h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} className="text-indigo-500" /> Taxa de presença: {metrics.attendanceRate}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* Alertas de Insumos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas de Estoque</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${metrics.lowStockCount + metrics.expiringCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {metrics.lowStockCount + metrics.expiringCount}
            </h3>
            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <AlertTriangle size={12} className="text-amber-500" /> {metrics.lowStockCount} estoque baixo / {metrics.expiringCount} a vencer
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Gráficos e Seções Analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Método de Pagamento */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" /> Receita por Forma de Pagamento
            </h2>
            <span className="text-xs text-slate-400">Total: R$ {metrics.totalIncome.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.paymentMethods).map(([method, amount]) => {
              const percentage = metrics.totalIncome > 0 ? Math.round((amount / metrics.totalIncome) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{method}</span>
                    <span>R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Procedimentos Mais Realizados */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> Top Procedimentos na Cadeira
            </h2>
            <span className="text-xs text-slate-400">Mais frequentes</span>
          </div>

          {metrics.topProcedures.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum procedimento registrado ainda na agenda.
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.topProcedures.map(([proc, count], idx) => (
                <div key={proc} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-800 truncate max-w-xs">{proc}</span>
                  </div>
                  <span className="text-xs font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                    {count} {count === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
