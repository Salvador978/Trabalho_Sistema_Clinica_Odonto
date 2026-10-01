import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertTriangle,
  Search,
  CheckCircle2
} from 'lucide-react';
import { LabOrder, LabOrderStatus } from './LabOrderModal';

interface LabViewProps {
  labOrders: LabOrder[];
  onNewLabOrder: () => void;
  onEditLabOrder: (order: LabOrder) => void;
  onDeleteLabOrder: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: LabOrderStatus) => void;
}

export const isTryInUrgent = (tryInDateStr: string, status: LabOrderStatus): boolean => {
  if (status === 'COMPLETED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tryIn = new Date(tryInDateStr);
  tryIn.setHours(0, 0, 0, 0);
  const diffTime = tryIn.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
};

export const LabView: React.FC<LabViewProps> = ({
  labOrders,
  onNewLabOrder,
  onEditLabOrder,
  onDeleteLabOrder,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredOrders = labOrders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.patientName.toLowerCase().includes(term) ||
      order.tooth.toLowerCase().includes(term) ||
      order.labName.toLowerCase().includes(term) ||
      order.material.toLowerCase().includes(term)
    );
  });

  const total = labOrders.length;
  const inProduction = labOrders.filter((o) => o.status === 'IN_PRODUCTION').length;
  const tryInStage = labOrders.filter((o) => o.status === 'TRY_IN_STAGE').length;
  const urgentCount = labOrders.filter((o) => isTryInUrgent(o.tryInDate, o.status)).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
      {/* HEADER DO MÓDULO DE PROTÉTICOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
              <Layers className="w-4 h-4" />
            </div>
            Ordens de Serviço Laboratorial (Protéticos)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} trabalhos registrados • {inProduction} em produção • {tryInStage} na etapa de prova
            {urgentCount > 0 && ` • ⚠️ ${urgentCount} com prova nos próximos 2 dias`}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewLabOrder}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova O.S.
        </button>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por paciente, dente, material ou laboratório..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_PRODUCTION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'IN_PRODUCTION'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Produção ({inProduction})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('TRY_IN_STAGE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'TRY_IN_STAGE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Prova ({tryInStage})
          </button>
        </div>
      </div>

      {/* GRID DE CARDS DE O.S. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-400 text-xs">
            Nenhuma ordem de serviço encontrada. Clique em "+ Nova O.S." para registrar um trabalho laboratorial.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isUrgent = isTryInUrgent(order.tryInDate, order.status);

            return (
              <div
                key={order.id}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3 hover:shadow-xs transition-shadow"
              >
                <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">
                      {order.patientName}
                    </span>
                    <span className="text-[11px] font-bold text-blue-700">
                      {order.tooth}
                    </span>
                  </div>

                  <div className="flex flex-row xs:flex-col items-center xs:items-end justify-between xs:justify-start gap-1">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        onUpdateStatus(order.id, e.target.value as LabOrderStatus)
                      }
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border bg-white ${
                        order.status === 'IN_PRODUCTION'
                          ? 'border-amber-300 text-amber-800'
                          : order.status === 'TRY_IN_STAGE'
                          ? 'border-blue-300 text-blue-800'
                          : order.status === 'ADJUSTMENT_REQUESTED'
                          ? 'border-purple-300 text-purple-800'
                          : 'border-emerald-300 text-emerald-800'
                      }`}
                    >
                      <option value="IN_PRODUCTION">Em Produção</option>
                      <option value="TRY_IN_STAGE">Prova Próxima (Chegou)</option>
                      <option value="ADJUSTMENT_REQUESTED">Ajuste Solicitado</option>
                      <option value="COMPLETED">Concluído / Instalado</option>
                    </select>

                    {isUrgent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        ⚠️ Prova Próxima (Urgente)!
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Material:</span>
                    <span className="font-semibold text-slate-700">{order.material}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Escala / Cor:</span>
                    <span className="font-bold text-blue-600">{order.shade}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Laboratório:</span>
                    <span className="text-slate-700 font-medium">{order.labName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data Prevista da Prova:</span>
                    <span className="font-bold text-amber-800">{order.tryInDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data de Envio:</span>
                    <span className="text-slate-600">{order.sentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Custo Laboratorial:</span>
                    <span className="font-bold text-slate-800">R$ {order.cost.toFixed(2)}</span>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => onEditLabOrder(order)}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar Detalhes
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteLabOrder(order.id)}
                    className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Cancelar O.S.
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
