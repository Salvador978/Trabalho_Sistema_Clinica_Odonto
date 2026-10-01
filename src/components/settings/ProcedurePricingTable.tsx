import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  Pencil,
  Trash2,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Clock,
  Layers,
  Check,
  AlertCircle
} from 'lucide-react';
import { ProcedurePricing, ProcedureCategory, DEFAULT_PROCEDURES } from '../../types/settings';

interface ProcedurePricingTableProps {
  procedures: ProcedurePricing[];
  onUpdateProcedures: (newProcedures: ProcedurePricing[]) => void;
  isReadOnly?: boolean;
}

export const CATEGORY_LABELS: Record<ProcedureCategory, { label: string; color: string; bg: string }> = {
  PREVENTIVA: { label: 'Prevenção / Higiene', color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  DENTISTICA: { label: 'Dentística / Resinas', color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
  ENDODONTIA: { label: 'Endodontia (Canal)', color: 'text-purple-800', bg: 'bg-purple-50 border-purple-200' },
  PERIODONTIA: { label: 'Periodontia', color: 'text-teal-800', bg: 'bg-teal-50 border-teal-200' },
  CIRURGIA: { label: 'Cirurgia Oral / Sisos', color: 'text-red-800', bg: 'bg-red-50 border-red-200' },
  PROTESE: { label: 'Próteses & Coroas', color: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  IMPLANTE: { label: 'Implantodontia', color: 'text-indigo-800', bg: 'bg-indigo-50 border-indigo-200' },
  ORTODONTIA: { label: 'Ortodontia', color: 'text-cyan-800', bg: 'bg-cyan-50 border-cyan-200' },
  ESTETICA: { label: 'Estética / Clareamento', color: 'text-fuchsia-800', bg: 'bg-fuchsia-50 border-fuchsia-200' },
  OUTROS: { label: 'Geral / Outros', color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' }
};

export const ProcedurePricingTable: React.FC<ProcedurePricingTableProps> = ({
  procedures = DEFAULT_PROCEDURES,
  onUpdateProcedures,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<ProcedurePricing | null>(null);

  // Formulário do Modal de Procedimento
  const [formData, setFormData] = useState<Partial<ProcedurePricing>>({
    name: '',
    category: 'DENTISTICA',
    price: 200,
    estimatedDurationMin: 45,
    active: true,
    conditionKey: '',
    notes: ''
  });

  const [quickSaveFeedback, setQuickSaveFeedback] = useState<string | null>(null);

  // Filtragem dos procedimentos
  const filteredProcedures = useMemo(() => {
    return (procedures || []).filter((proc) => {
      const matchesSearch =
        proc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (proc.notes && proc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'ALL' || proc.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [procedures, searchTerm, selectedCategory]);

  // Edição rápida de preço inline
  const handleQuickPriceChange = (id: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    const updated = procedures.map((p) => (p.id === id ? { ...p, price: newPrice } : p));
    onUpdateProcedures(updated);
    setQuickSaveFeedback('Preço atualizado!');
    setTimeout(() => setQuickSaveFeedback(null), 2000);
  };

  // Alternar ativo/inativo
  const handleToggleActive = (id: string) => {
    if (isReadOnly) return;
    const updated = procedures.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    onUpdateProcedures(updated);
  };

  // Abrir modal para novo
  const handleOpenNew = () => {
    setEditingProcedure(null);
    setFormData({
      name: '',
      category: 'DENTISTICA',
      price: 180,
      estimatedDurationMin: 45,
      active: true,
      conditionKey: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para edição
  const handleOpenEdit = (proc: ProcedurePricing) => {
    setEditingProcedure(proc);
    setFormData({ ...proc });
    setIsModalOpen(true);
  };

  // Excluir procedimento
  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    const proc = procedures.find((p) => p.id === id);
    if (!proc) return;
    if (window.confirm(`Deseja realmente remover o procedimento "${proc.name}" da tabela de preços?`)) {
      onUpdateProcedures(procedures.filter((p) => p.id !== id));
    }
  };

  // Salvar procedimento (novo ou editado)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingProcedure) {
      const updated = procedures.map((p) =>
        p.id === editingProcedure.id
          ? ({ ...p, ...formData, price: Number(formData.price) || 0 } as ProcedurePricing)
          : p
      );
      onUpdateProcedures(updated);
    } else {
      const newProc: ProcedurePricing = {
        id: `proc_${crypto.randomUUID()}`,
        name: formData.name.trim(),
        category: (formData.category as ProcedureCategory) || 'DENTISTICA',
        price: Number(formData.price) || 0,
        estimatedDurationMin: Number(formData.estimatedDurationMin) || 45,
        active: formData.active ?? true,
        conditionKey: formData.conditionKey || undefined,
        notes: formData.notes?.trim() || undefined
      };
      onUpdateProcedures([newProc, ...procedures]);
    }

    setIsModalOpen(false);
  };

  // Restaurar tabela padrão
  const handleRestoreDefaults = () => {
    if (window.confirm('Deseja restaurar a tabela de procedimentos padrão de referência? Suas edições atuais serão substituídas.')) {
      onUpdateProcedures(DEFAULT_PROCEDURES);
    }
  };

  const totalActive = (procedures || []).filter((p) => p.active).length;

  return (
    <div className="space-y-4">
      {/* 1. HEADER DA TABELA DE PREÇOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Tabela de Procedimentos Clínicos & Preços (R$)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                {totalActive} ativos
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Defina os valores praticados pela clínica. Durante a consulta, o dentista marca os dentes e o sistema calcula o orçamento em tempo real para a recepcionista consultar e cobrar no balcão de forma independente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Restaurar valores de referência padrão"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tabela Padrão</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Procedimento</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. BARRA DE BUSCA E FILTROS POR CATEGORIA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar procedimento por nome ou código..."
              className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-blue-500 bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro por categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="PREVENTIVA">Prevenção / Higiene</option>
              <option value="DENTISTICA">Dentística / Resinas</option>
              <option value="ENDODONTIA">Endodontia (Canal)</option>
              <option value="CIRURGIA">Cirurgia Oral / Sisos</option>
              <option value="PROTESE">Próteses & Coroas</option>
              <option value="IMPLANTE">Implantodontia</option>
              <option value="ESTETICA">Estética / Clareamento</option>
              <option value="PERIODONTIA">Periodontia</option>
              <option value="ORTODONTIA">Ortodontia</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>
        </div>

        {quickSaveFeedback && (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {quickSaveFeedback}
          </div>
        )}
      </div>

      {/* 3. VISUALIZAÇÃO DESKTOP / TABLET (TABELA COMPLETA) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Procedimento Odontológico</th>
                <th className="py-3 px-4">Especialidade / Categoria</th>
                <th className="py-3 px-4 text-center">Duração</th>
                <th className="py-3 px-4 text-center">Vínculo Odontograma</th>
                <th className="py-3 px-4 text-right">Preço Padrão (R$)</th>
                <th className="py-3 px-4 text-center">Status</th>
                {!isReadOnly && <th className="py-3 px-4 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Nenhum procedimento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((proc) => {
                  const cat = CATEGORY_LABELS[proc.category] || CATEGORY_LABELS.OUTROS;
                  return (
                    <tr
                      key={proc.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !proc.active ? 'opacity-50 bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{proc.name}</div>
                        {proc.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {proc.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.color}`}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {proc.estimatedDurationMin ? `${proc.estimatedDurationMin} min` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {proc.conditionKey ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-2.5 h-2.5" />
                            Odontograma
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Geral / Clínico</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isReadOnly ? (
                          <span className="font-mono font-extrabold text-slate-900 text-sm">
                            R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <span className="text-slate-400 font-bold text-xs">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={proc.price}
                              onChange={(e) => handleQuickPriceChange(proc.id, parseFloat(e.target.value) || 0)}
                              className="w-24 border border-slate-300 rounded-lg px-2 py-1 text-right font-mono font-extrabold text-blue-700 text-xs focus:outline-blue-500 bg-white"
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleToggleActive(proc.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                            proc.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {proc.active ? '✓ Ativo' : 'Inativo'}
                        </button>
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(proc)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar procedimento"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(proc.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir procedimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. VISUALIZAÇÃO MOBILE (CARDS TOUCH-FRIENDLY PARA CELULARES) */}
      <div className="md:hidden space-y-2.5">
        {filteredProcedures.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Nenhum procedimento encontrado.
          </div>
        ) : (
          filteredProcedures.map((proc) => {
            const cat = CATEGORY_LABELS[proc.category] || CATEGORY_LABELS.OUTROS;
            return (
              <div
                key={proc.id}
                className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 ${
                  !proc.active ? 'opacity-60 bg-slate-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs leading-tight">
                      {proc.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      {proc.estimatedDurationMin && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {proc.estimatedDurationMin}m
                        </span>
                      )}
                      {proc.conditionKey && (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Odontograma
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleToggleActive(proc.id)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                      proc.active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {proc.active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>

                {proc.notes && (
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {proc.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">Preço Padrão:</span>
                    <span className="text-base font-extrabold text-blue-700 font-mono">
                      R$ {proc.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(proc)}
                        className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(proc.id)}
                        className="p-1.5 text-red-600 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL DE CADASTRO / EDIÇÃO DE PROCEDIMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90dvh] flex flex-col p-5 sm:p-6 shadow-2xl space-y-4 overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  {editingProcedure ? 'Editar Procedimento' : 'Novo Procedimento Clínico'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preencha as informações para compor o catálogo de preços
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome do Procedimento / Tratamento: *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Restauração Resina 2 Faces (MOD), Clareamento, etc."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Especialidade / Categoria: *
                  </label>
                  <select
                    value={formData.category || 'DENTISTICA'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProcedureCategory })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-500 bg-white"
                  >
                    <option value="PREVENTIVA">Prevenção / Higiene</option>
                    <option value="DENTISTICA">Dentística / Resinas</option>
                    <option value="ENDODONTIA">Endodontia (Canal)</option>
                    <option value="CIRURGIA">Cirurgia Oral / Sisos</option>
                    <option value="PROTESE">Próteses & Coroas</option>
                    <option value="IMPLANTE">Implantodontia</option>
                    <option value="ESTETICA">Estética / Clareamento</option>
                    <option value="PERIODONTIA">Periodontia</option>
                    <option value="ORTODONTIA">Ortodontia</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Preço Padrão Sugerido (R$): *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      R$
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="5"
                      value={formData.price ?? ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0,00"
                      className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-extrabold text-blue-700 focus:outline-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Duração Estimada na Cadeira:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={formData.estimatedDurationMin || 45}
                      onChange={(e) => setFormData({ ...formData, estimatedDurationMin: parseInt(e.target.value) || 30 })}
                      placeholder="Minutos"
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-blue-500 bg-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      minutos
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vínculo com Odontograma:
                  </label>
                  <select
                    value={formData.conditionKey || ''}
                    onChange={(e) => setFormData({ ...formData, conditionKey: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-blue-500 bg-white"
                  >
                    <option value="">Nenhum (Procedimento Geral)</option>
                    <option value="RESTORATION_RESIN">Restauração em Resina</option>
                    <option value="CARIES">Tratamento de Cárie</option>
                    <option value="RESTORATION_AMALGAM">Restauração em Amálgama</option>
                    <option value="ENDODONTIC_NEEDED">Tratamento de Canal Indicado</option>
                    <option value="EXTRACTION_INDICATED">Exodontia Indicada</option>
                    <option value="CROWN">Coroa / Prótese Fixa</option>
                    <option value="IMPLANT">Implante Dentário</option>
                    <option value="SEALANT">Selante de Fóssulas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observações Clínicas / Detalhes de Materiais:
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Incluso anestésico articaína, isolamento absoluto e fotos intraorais..."
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-blue-500 bg-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProcedure ? 'Salvar Alterações' : 'Cadastrar Procedimento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
