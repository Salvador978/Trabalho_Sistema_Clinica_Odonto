import React, { useState } from 'react';
import {
  FileText,
  Printer,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  User
} from 'lucide-react';
import { openWhatsAppDirect } from '../../utils/whatsapp';
import { PrintLetterhead } from '../documents/PrintLetterhead';
import { PrintFooter } from '../documents/PrintFooter';

export interface PrescribedDrug {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  duration: string;
  category: 'ANTIBIOTIC' | 'ANALGESIC' | 'ANTI_INFLAMMATORY' | 'ANTISEPTIC' | 'CORTICOID' | 'OTHER';
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf: string;
  patientPhone: string;
  patientAllergies?: string[];
  dentistName?: string;
  dentistCro?: string;
  dentistCpf?: string;
  clinicAddress?: string;
  onPrescriptionSaved?: (prescription: { patientName: string; drugs: PrescribedDrug[]; date: string }) => void;
}

// POSOLOGIAS PRÉ-CONFIGURADAS DE ALTA FREQUÊNCIA NO CONSULTÓRIO
export const PRECONFIGURED_PRESCRIPTIONS: Omit<PrescribedDrug, 'id'>[] = [
  {
    name: 'Amoxicilina 500mg',
    dosage: '1 cápsula via oral a cada 8 horas',
    instructions: 'Tomar com água antes ou após as refeições. Não interromper o tratamento antes do prazo.',
    duration: '7 dias (21 cápsulas)',
    category: 'ANTIBIOTIC'
  },
  {
    name: 'Dipirona Sódica 500mg',
    dosage: '1 comprimido via oral a cada 6 horas',
    instructions: 'Tomar somente em caso de dor persistente ou febre. Intervalo mínimo de 6 horas.',
    duration: '3 dias ou se houver dor',
    category: 'ANALGESIC'
  },
  {
    name: 'Paracetamol 750mg',
    dosage: '1 comprimido via oral a cada 8 horas',
    instructions: 'Tomar em caso de dor leve a moderada. Alternativa recomendada para alérgicos a dipirona.',
    duration: '3 dias ou se houver dor',
    category: 'ANALGESIC'
  },
  {
    name: 'Ibuprofeno 600mg',
    dosage: '1 comprimido via oral a cada 12 horas',
    instructions: 'Tomar preferencialmente após as principais refeições para proteção gástrica.',
    duration: '3 a 5 dias (Anti-inflamatório)',
    category: 'ANTI_INFLAMMATORY'
  },
  {
    name: 'Digluconato de Clorexidina 0,12%',
    dosage: 'Bochechar 15ml (1 colher de sopa) por 1 minuto a cada 12 horas',
    instructions: 'Usar após escovação dental. Não engolir e evitar comer ou beber por 30 minutos após o bochecho.',
    duration: '7 dias (Solução bucal antisséptica)',
    category: 'ANTISEPTIC'
  },
  {
    name: 'Dexametasona 4mg',
    dosage: '1 comprimido via oral em dose única',
    instructions: 'Tomar 1 hora antes do procedimento cirúrgico para prevenção de edema excessivo pós-operatório.',
    duration: 'Dose única pré-operatória',
    category: 'CORTICOID'
  }
];

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  patientPhone,
  patientAllergies = [],
  dentistName = 'Dra. Juliana Mendes',
  dentistCro = 'CRO-SP 123.456',
  dentistCpf = '123.456.789-00',
  clinicAddress = 'Av. Paulista, 1000 - Sala 42, Bela Vista, São Paulo - SP',
  onPrescriptionSaved
}) => {
  const [prescribedDrugs, setPrescribedDrugs] = useState<PrescribedDrug[]>([
    {
      id: 'rx_1',
      name: 'Amoxicilina 500mg',
      dosage: '1 cápsula via oral a cada 8 horas',
      instructions: 'Tomar com água antes ou após as refeições. Não interromper o tratamento antes do prazo.',
      duration: '7 dias (21 cápsulas)',
      category: 'ANTIBIOTIC'
    },
    {
      id: 'rx_2',
      name: 'Ibuprofeno 600mg',
      dosage: '1 comprimido via oral a cada 12 horas',
      instructions: 'Tomar preferencialmente após as refeições.',
      duration: '3 a 5 dias',
      category: 'ANTI_INFLAMMATORY'
    }
  ]);

  // Medicamento avulso / customizado
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  if (!isOpen) return null;

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  // Adiciona receita pré-configurada
  const handleAddPreconfigured = (item: Omit<PrescribedDrug, 'id'>) => {
    // Validação de segurança de alergia
    const isPenicillin = item.name.toLowerCase().includes('amoxicilina');
    const isDipirone = item.name.toLowerCase().includes('dipirona');

    const hasPenicillinAllergy = patientAllergies.some((a) => a.toLowerCase().includes('penicilina'));
    const hasDipironeAllergy = patientAllergies.some((a) => a.toLowerCase().includes('dipirona'));

    if (isPenicillin && hasPenicillinAllergy) {
      if (!confirm('⚠️ ALERTA DE SEGURANÇA:\nO paciente possui ALERGIA registrada a Penicilina / Amoxicilina!\nDeseja prescrever mesmo assim sob sua responsabilidade clínica?')) {
        return;
      }
    }

    if (isDipirone && hasDipironeAllergy) {
      if (!confirm('⚠️ ALERTA DE SEGURANÇA:\nO paciente possui ALERGIA registrada a Dipirona!\nDeseja prescrever mesmo assim sob sua responsabilidade clínica?')) {
        return;
      }
    }

    const newDrug: PrescribedDrug = {
      ...item,
      id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    };

    setPrescribedDrugs([...prescribedDrugs, newDrug]);
  };

  const handleRemoveDrug = (id: string) => {
    setPrescribedDrugs(prescribedDrugs.filter((d) => d.id !== id));
  };

  const handleAddCustomDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newDrug: PrescribedDrug = {
      id: `rx_${Date.now()}`,
      name: customName.trim(),
      dosage: customDosage.trim() || 'Tomar conforme orientação',
      instructions: customInstructions.trim(),
      duration: customDuration.trim() || 'Uso contínuo',
      category: 'OTHER'
    };

    setPrescribedDrugs([...prescribedDrugs, newDrug]);
    setCustomName('');
    setCustomDosage('');
    setCustomInstructions('');
    setCustomDuration('');
    setShowCustomForm(false);
  };

  // Texto formatado para WhatsApp
  const textoReceitaWhatsApp = `💊 *RECEITUÁRIO ODONTOLÓGICO*
*${dentistName}*
CRO: ${dentistCro} | CPF: ${dentistCpf}
${clinicAddress}

Paciente: *${patientName}* (CPF: ${patientCpf})
Data: ${dataAtual}

*MEDICAMENTOS PRESCRITOS:*
${prescribedDrugs
  .map(
    (d, i) => `
${i + 1}. *${d.name}*
• Posologia: ${d.dosage}
• Instruções: ${d.instructions}
• Duração: ${d.duration}`
  )
  .join('\n')}

_Dúvidas sobre efeitos ou reações, contate imediatamente o consultório._`;

  const handleSendWhatsApp = () => {
    openWhatsAppDirect(patientPhone, textoReceitaWhatsApp);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSavePrescription = () => {
    if (onPrescriptionSaved) {
      onPrescriptionSaved({
        patientName,
        drugs: prescribedDrugs,
        date: dataAtual
      });
    }
    alert('Receituário registrado com sucesso no prontuário do paciente!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:block" role="dialog">
      <div className="print-document-container bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none print:overflow-visible">
        
        {/* HEADER DO MODAL (OCULTO NA IMPRESSÃO) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Receituário Clínico Ágil
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Paciente: <strong>{patientName}</strong> (CPF: {patientCpf})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DOCUMENTO TIMBRADO EXCLUSIVO PARA IMPRESSÃO A4 */}
        <div className="hidden print:block p-4 space-y-4">
          <PrintLetterhead
            documentTitle="Receituário Odontológico"
            dentistName={dentistName}
            cro={dentistCro}
            address={clinicAddress}
          />
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
            <span className="font-bold text-slate-900">Paciente:</span> {patientName} • <span className="font-bold text-slate-900">CPF:</span> {patientCpf} • <span className="font-bold text-slate-900">Data:</span> {dataAtual}
          </div>
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">Uso Medicamentoso / Prescrição:</h3>
            {prescribedDrugs.map((drug, index) => (
              <div key={drug.id} className="print-avoid-break pl-3 border-l-2 border-slate-700 py-1 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{index + 1}. {drug.name}</div>
                <div className="text-slate-800 font-medium text-xs">• Posologia: {drug.dosage}</div>
                <div className="text-slate-600 text-xs">• Instruções: {drug.instructions}</div>
                <div className="text-slate-700 font-semibold text-xs">• Duração: {drug.duration}</div>
              </div>
            ))}
          </div>
          <PrintFooter
            dentistName={dentistName}
            cro={dentistCro}
          />
        </div>

        {/* SCROLLABLE BODY (OCULTO NA IMPRESSÃO) */}
        <div className="no-print p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* ALERTA DE ALERGIAS CRÍTICAS DO PACIENTE */}
          {patientAllergies.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-900 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Atenção às Alergias do Paciente:</strong> {patientAllergies.join(', ')}
            </span>
          </div>
        )}

        {/* CHIPS DE POSOLOGIAS PRÉ-CONFIGURADAS (+ 1 CLIQUE) */}
        <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Posologias Pré-Configuradas Rápidas (+ 1 Clique):
          </span>

          <div className="flex flex-wrap gap-2 pt-1">
            {PRECONFIGURED_PRESCRIPTIONS.map((preset) => {
              const isPenicillin = preset.name.toLowerCase().includes('amoxicilina');
              const isDipirone = preset.name.toLowerCase().includes('dipirona');
              const isRisk =
                (isPenicillin && patientAllergies.some((a) => a.toLowerCase().includes('penicilina'))) ||
                (isDipirone && patientAllergies.some((a) => a.toLowerCase().includes('dipirona')));

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPreconfigured(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRisk
                      ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 line-through'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 shadow-xs'
                  }`}
                  title={isRisk ? 'Paciente alérgico a este medicamento!' : preset.instructions}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  {preset.name}
                  {isRisk && <span className="text-[10px] text-red-600 font-extrabold">(Alérgico)</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTAGEM DE MEDICAMENTOS DA RECEITA ATUAL */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Medicamentos Incluídos na Receita ({prescribedDrugs.length}):
            </span>
            <button
              type="button"
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              {showCustomForm ? 'Fechar Personalizado' : '+ Outro Medicamento'}
            </button>
          </div>

          {/* FORMULÁRIO DE MEDICAMENTO PERSONALIZADO */}
          {showCustomForm && (
            <form onSubmit={handleAddCustomDrug} className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Medicamento e Concentração"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Posologia (ex: 1 comprimido a cada 8h)"
                  value={customDosage}
                  onChange={(e) => setCustomDosage(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Instruções adicionais de uso"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                />
                <input
                  type="text"
                  placeholder="Duração (ex: 5 dias)"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                Adicionar à Receita
              </button>
            </form>
          )}

          {/* ITENS DA RECEITA */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {prescribedDrugs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                Nenhum medicamento adicionado à receita. Clique nos botões acima para incluir.
              </div>
            ) : (
              prescribedDrugs.map((drug, index) => (
                <div
                  key={drug.id}
                  className="p-3 bg-white border border-slate-200 rounded-2xl flex items-start justify-between gap-3 shadow-xs hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <strong className="text-slate-800 text-sm">{drug.name}</strong>
                    </div>
                    <p className="text-slate-700 font-medium pl-7">
                      • <strong>Posologia:</strong> {drug.dosage}
                    </p>
                    <p className="text-slate-500 pl-7 text-[11px]">
                      • <strong>Instruções:</strong> {drug.instructions}
                    </p>
                    <p className="text-indigo-700 font-semibold pl-7 text-[11px]">
                      • <strong>Duração:</strong> {drug.duration}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDrug(drug.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Remover item da receita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRÉVIA FORMATADA EM PAPEL TIMBRADO (CRO) */}
        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-700 block">{dentistName} - {dentistCro}</span>
            <span className="text-slate-400">Emissão Digital: {dataAtual}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
            ✓ Padrão CFO / CFM
          </span>
        </div>
      </div>

      {/* FOOTER & BOTÕES DE DISPARO RÁPIDO (OCULTO NA IMPRESSÃO) */}
      <div className="no-print p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={prescribedDrugs.length === 0}
          className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 border border-emerald-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          WhatsApp do Paciente
        </button>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={prescribedDrugs.length === 0}
            className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>

          <button
            type="button"
            onClick={handleSavePrescription}
            disabled={prescribedDrugs.length === 0}
            className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Check className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>

    </div>
  </div>
);
};
