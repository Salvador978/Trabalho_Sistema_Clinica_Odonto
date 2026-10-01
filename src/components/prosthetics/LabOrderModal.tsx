import React, { useState, useEffect } from 'react';
import { Layers, X, Check, Calendar, DollarSign, User, ShieldAlert } from 'lucide-react';

export type LabOrderStatus = 'IN_PRODUCTION' | 'TRY_IN_STAGE' | 'ADJUSTMENT_REQUESTED' | 'COMPLETED';

export interface LabOrder {
  id: string;
  patientName: string;
  tooth: string;
  material: string;
  shade: string;
  labName: string;
  sentDate: string;
  tryInDate: string;
  cost: number;
  status: LabOrderStatus;
  notes?: string;
}

interface LabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: LabOrder) => void;
  orderToEdit?: LabOrder | null;
  patientNames: string[];
}

export const CANONICAL_MATERIALS = [
  'Dissilicato de Lítio (E-Max)',
  'Zircônia Monolítica Translúcida',
  'Metalocerâmica Clássica',
  'Resina PMMA Provisória',
  'Prótese Total Mucossuportada',
  'Placa Miorrelaxante de Bruxismo'
];

export const CANONICAL_SHADES = [
  'A1 (VITA)',
  'A2 (VITA)',
  'A3 (VITA)',
  'A3.5 (VITA)',
  'B1 (VITA)',
  'Bleach 1 (Ultra Claro)',
  'Bleach 2 (Clareado)',
  'Transparente (Placa)'
];

export const CANONICAL_LABS = [
  'Laboratório Dental Precision',
  'Art & Dente Próteses',
  'Master Lab Próteses Odontológicas',
  'Outro Laboratório'
];

export const LabOrderModal: React.FC<LabOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  patientNames
}) => {
  const [patientName, setPatientName] = useState('');
  const [tooth, setTooth] = useState('');
  const [material, setMaterial] = useState(CANONICAL_MATERIALS[0]);
  const [shade, setShade] = useState(CANONICAL_SHADES[1]); // A2
  const [labName, setLabName] = useState(CANONICAL_LABS[0]);
  const [customLab, setCustomLab] = useState('');
  const [sentDate, setSentDate] = useState('');
  const [tryInDate, setTryInDate] = useState('');
  const [cost, setCost] = useState<number>(350);
  const [status, setStatus] = useState<LabOrderStatus>('IN_PRODUCTION');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (orderToEdit) {
        setPatientName(orderToEdit.patientName);
        setTooth(orderToEdit.tooth);
        setMaterial(orderToEdit.material);
        setShade(orderToEdit.shade);
        if (CANONICAL_LABS.includes(orderToEdit.labName)) {
          setLabName(orderToEdit.labName);
          setCustomLab('');
        } else {
          setLabName('Outro Laboratório');
          setCustomLab(orderToEdit.labName);
        }
        setSentDate(orderToEdit.sentDate);
        setTryInDate(orderToEdit.tryInDate);
        setCost(orderToEdit.cost);
        setStatus(orderToEdit.status);
        setNotes(orderToEdit.notes || '');
      } else {
        setPatientName(patientNames[0] || '');
        setTooth('Dente 21');
        setMaterial(CANONICAL_MATERIALS[0]);
        setShade(CANONICAL_SHADES[1]);
        setLabName(CANONICAL_LABS[0]);
        setCustomLab('');
        // Data de hoje e prova em 7 dias
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        setSentDate(today.toLocaleDateString('en-CA'));
        setTryInDate(nextWeek.toLocaleDateString('en-CA'));
        setCost(350);
        setStatus('IN_PRODUCTION');
        setNotes('');
      }
    }
  }, [isOpen, orderToEdit, patientNames]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      alert('Selecione ou informe o nome do paciente.');
      return;
    }
    if (!tooth.trim()) {
      alert('Informe o(s) elemento(s) dentário(s). Ex: Dente 21.');
      return;
    }
    if (!tryInDate) {
      alert('Informe a data prevista da prova clínica.');
      return;
    }

    const finalLab = labName === 'Outro Laboratório' ? customLab.trim() : labName;
    if (!finalLab) {
      alert('Informe o nome do laboratório protético.');
      return;
    }

    const saved: LabOrder = {
      id: orderToEdit ? orderToEdit.id : `lab_${crypto.randomUUID()}`,
      patientName: patientName.trim(),
      tooth: tooth.trim(),
      material,
      shade,
      labName: finalLab,
      sentDate,
      tryInDate,
      cost: Math.max(0, cost),
      status,
      notes: notes.trim()
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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                {orderToEdit ? 'Editar Ordem de Serviço Protética' : 'Nova Ordem de Serviço (O.S.) Protética'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Controle de Coroas, Facetas, Próteses e Prazos de Prova
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
          
          {/* Paciente & Elemento Dentário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Paciente:
              </label>
              <select
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold bg-white"
                required
              >
                {patientNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Elemento(s) Dentário(s) (FDI):
              </label>
              <input
                type="text"
                value={tooth}
                onChange={(e) => setTooth(e.target.value)}
                placeholder="Ex: Dente 21 ou Dentes 14 a 16"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 bg-white"
                required
              />
            </div>
          </div>

          {/* Material & Escala de Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Material Protético:
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
              >
                {CANONICAL_MATERIALS.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Escala / Cor:
              </label>
              <select
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-blue-600 bg-white"
              >
                {CANONICAL_SHADES.map((sh) => (
                  <option key={sh} value={sh}>
                    {sh}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Laboratório Protético */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-semibold">
              Laboratório / Protético Responsável:
            </label>
            <select
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
            >
              {CANONICAL_LABS.map((lab) => (
                <option key={lab} value={lab}>
                  {lab}
                </option>
              ))}
            </select>

            {labName === 'Outro Laboratório' && (
              <input
                type="text"
                value={customLab}
                onChange={(e) => setCustomLab(e.target.value)}
                placeholder="Digite o nome do laboratório parceiro..."
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                required
              />
            )}
          </div>

          {/* Datas de Envio e Prova Clínica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Data de Envio ao Laboratório:
              </label>
              <input
                type="date"
                value={sentDate}
                onChange={(e) => setSentDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Data Prevista da Prova Clínica:
              </label>
              <input
                type="date"
                value={tryInDate}
                onChange={(e) => setTryInDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-amber-800 bg-white"
                required
              />
            </div>
          </div>

          {/* Custo Laboratorial & Status Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Custo Laboratorial (Despesa R$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Status da Ordem de Serviço:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LabOrderStatus)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-semibold bg-white"
              >
                <option value="IN_PRODUCTION">Em Produção</option>
                <option value="TRY_IN_STAGE">Prova Próxima (Chegou)</option>
                <option value="ADJUSTMENT_REQUESTED">Ajuste Solicitado</option>
                <option value="COMPLETED">Concluído / Instalado</option>
              </select>
            </div>
          </div>

          {/* Observações / Instruções Clínicas */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Instruções Clínicas ao Protético (Opcional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cimentação adesiva com resina dual, borda incisal translúcida..."
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 bg-white resize-none"
            />
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
            {orderToEdit ? 'Salvar O.S.' : 'Emitir Ordem de Serviço'}
          </button>
        </div>

      </form>

    </div>
  </div>
);
};
