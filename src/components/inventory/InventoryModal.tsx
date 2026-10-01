import React, { useState, useEffect } from 'react';
import { Package, X, Check, Calendar, AlertTriangle, Layers, Tag } from 'lucide-react';

export type InventoryCategory =
  | 'Restaurador'
  | 'Anestésico'
  | 'Adesivo'
  | 'Descartável'
  | 'Endodôntico'
  | 'Ortodôntico'
  | 'Cirúrgico'
  | 'EPI';

export type InventoryUnit =
  | 'Seringa'
  | 'Caixa 50un'
  | 'Frasco'
  | 'Pacote'
  | 'Unidade'
  | 'Tubo';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  batch: string;
  qty: number;
  unit: InventoryUnit;
  exp: string; // Formato YYYY-MM-DD
  minStock: number;
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  itemToEdit?: InventoryItem | null;
}

export const CANONICAL_CATEGORIES: InventoryCategory[] = [
  'Restaurador',
  'Anestésico',
  'Adesivo',
  'Descartável',
  'Endodôntico',
  'Ortodôntico',
  'Cirúrgico',
  'EPI'
];

export const CANONICAL_UNITS: InventoryUnit[] = [
  'Seringa',
  'Caixa 50un',
  'Frasco',
  'Pacote',
  'Unidade',
  'Tubo'
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Restaurador');
  const [batch, setBatch] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [unit, setUnit] = useState<InventoryUnit>('Seringa');
  const [exp, setExp] = useState('');
  const [minStock, setMinStock] = useState<number>(2);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setCategory(itemToEdit.category);
        setBatch(itemToEdit.batch);
        setQty(itemToEdit.qty);
        setUnit(itemToEdit.unit);
        setExp(itemToEdit.exp);
        setMinStock(itemToEdit.minStock || 2);
      } else {
        setName('');
        setCategory('Restaurador');
        setBatch(`L-${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`);
        setQty(3);
        setUnit('Seringa');
        // Data padrão 1 ano à frente
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setExp(nextYear.toISOString().split('T')[0]);
        setMinStock(2);
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome do insumo.');
      return;
    }
    if (!batch.trim()) {
      alert('Informe o código do lote para rastreabilidade ANVISA.');
      return;
    }
    if (!exp) {
      alert('Informe a data de validade.');
      return;
    }

    const saved: InventoryItem = {
      id: itemToEdit ? itemToEdit.id : `inv_${crypto.randomUUID()}`,
      name: name.trim(),
      category,
      batch: batch.trim().toUpperCase(),
      qty: Math.max(0, qty),
      unit,
      exp,
      minStock: Math.max(1, minStock)
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {itemToEdit ? 'Editar Insumo / Lote' : 'Cadastrar Novo Insumo / Lote'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Controle de Validades e Rastreabilidade Sanitária (ANVISA)
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Nome do Produto */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nome do Produto / Insumo Odontológico:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Resina Filtek Z350 XT A2 (3M)"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold bg-white"
              required
            />
          </div>

          {/* Categoria & Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Categoria Canônica:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
              >
                {CANONICAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Código do Lote do Fabricante:
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="Ex: LT-8841 ou 2026A"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 uppercase bg-white"
                required
              />
            </div>
          </div>

          {/* Quantidade, Unidade e Estoque Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Quantidade Atual:
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Unidade de Medida:
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
              >
                {CANONICAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Estoque Mínimo (Alerta):
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 1)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                required
              />
            </div>
          </div>

          {/* Data de Validade */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Data de Validade (Vencimento):
            </label>
            <input
              type="date"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 bg-white"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              * O sistema alertará automaticamente quando faltarem menos de 60 dias para o vencimento.
            </p>
          </div>
        </div>

        {/* FOOTER & AÇÕES */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {itemToEdit ? 'Atualizar Insumo' : 'Salvar no Estoque'}
          </button>
        </div>

      </form>

    </div>
  </div>
);
};
