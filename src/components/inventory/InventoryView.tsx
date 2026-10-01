import React, { useState } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Minus,
  Search,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { InventoryItem } from './InventoryModal';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onNewItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export const getValidityStatus = (expStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(expStr);
  expDate.setHours(0, 0, 0, 0);
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      type: 'EXPIRED' as const,
      label: '⛔ Vencido',
      badge: 'bg-red-100 text-red-800 border-red-300 font-bold'
    };
  }
  if (diffDays <= 60) {
    return {
      type: 'EXPIRING_SOON' as const,
      label: `⚠️ Vence em ${diffDays} dias`,
      badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse'
    };
  }
  return {
    type: 'REGULAR' as const,
    label: `✓ Regular (${diffDays} dias)`,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onNewItem,
  onEditItem,
  onDeleteItem,
  onAdjustStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpiringOnly, setFilterExpiringOnly] = useState(false);

  const filteredInventory = inventory.filter((item) => {
    if (filterExpiringOnly) {
      const v = getValidityStatus(item.exp);
      if (v.type === 'REGULAR') return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.batch.toLowerCase().includes(term)
    );
  });

  const totalItems = inventory.length;
  const expiringCount = inventory.filter((i) => {
    const v = getValidityStatus(i.exp);
    return v.type === 'EXPIRED' || v.type === 'EXPIRING_SOON';
  }).length;
  const lowStockCount = inventory.filter((i) => i.qty <= (i.minStock || 2)).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
      {/* HEADER DO MÓDULO DE ESTOQUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Package className="w-4 h-4" />
            </div>
            Estoque de Insumos & Controle de Validades
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalItems} insumos cadastrados
            {expiringCount > 0 && ` • ⚠️ ${expiringCount} com atenção de validade`}
            {lowStockCount > 0 && ` • 🚨 ${lowStockCount} com estoque baixo`}
          </p>
        </div>

        <button
          type="button"
          onClick={onNewItem}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Insumo / Produto
        </button>
      </div>

      {/* BARRA DE PESQUISA & FILTRO DE VALIDADE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar insumo, categoria ou lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-xl py-2 pl-9 pr-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterExpiringOnly(!filterExpiringOnly)}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            filterExpiringOnly
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {filterExpiringOnly ? 'Mostrando Apenas Críticos' : `Filtrar Validade Crítica (${expiringCount})`}
        </button>
      </div>

      {/* MODO CARDS (VISÍVEL NO MOBILE / IPHONE) */}
      <div className="md:hidden space-y-3">
        {filteredInventory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum insumo encontrado. Clique em "+ Novo Insumo" para cadastrar.
          </div>
        ) : (
          filteredInventory.map((item) => {
            const validity = getValidityStatus(item.exp);
            const isLowStock = item.qty <= (item.minStock || 2);

            return (
              <div
                key={item.id}
                className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-800 block truncate">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-600">{item.category}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">Lote: {item.batch}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${validity.badge}`}>
                    {validity.label}
                  </span>
                </div>

                {isLowStock && (
                  <div className="text-[10px] px-2 py-1 rounded-lg font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                    <span>Estoque crítico (mínimo recomendado: {item.minStock || 2} {item.unit})</span>
                  </div>
                )}

                {/* Saldo e Ajuste de Quantidade com botões fáceis de tocar */}
                <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-200/80">
                  <div className="text-xs text-slate-600">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Saldo Atual</span>
                    <span className="font-extrabold text-sm text-slate-800">{item.qty} {item.unit}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAdjustStock(item.id, -1)}
                      title="Dar baixa em 1 unidade"
                      disabled={item.qty <= 0}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-extrabold transition-colors cursor-pointer active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-sm w-6 text-center text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustStock(item.id, 1)}
                      title="Adicionar 1 unidade"
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold transition-colors cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Validade e Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Vencimento: <strong className="text-slate-700">{item.exp}</strong></span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODO TABELA (VISÍVEL NO DESKTOP / IPAD GRANDE) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-3">Produto</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Lote</th>
              <th className="p-3">Quantidade & Ajuste (+ / -)</th>
              <th className="p-3">Validade</th>
              <th className="p-3 text-center">Status Validade</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Nenhum insumo encontrado.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const validity = getValidityStatus(item.exp);
                const isLowStock = item.qty <= (item.minStock || 2);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">
                      {item.name}
                      {isLowStock && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-extrabold bg-red-100 text-red-700 border border-red-200">
                          Estoque Baixo!
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{item.category}</td>
                    <td className="p-3 font-mono font-bold text-slate-600 uppercase">
                      {item.batch}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, -1)}
                          title="Dar baixa em 1 unidade"
                          disabled={item.qty <= 0}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-extrabold transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-extrabold text-sm w-7 text-center text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAdjustStock(item.id, 1)}
                          title="Adicionar 1 unidade"
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="text-[11px] text-slate-400 ml-1">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{item.exp}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${validity.badge}`}>
                        {validity.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar insumo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
