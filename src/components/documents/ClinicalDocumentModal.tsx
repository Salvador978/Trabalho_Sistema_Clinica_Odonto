import React, { useState } from 'react';
import {
  FileText,
  Printer,
  MessageSquare,
  X,
  Check,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  User,
  DollarSign
} from 'lucide-react';
import { openWhatsAppDirect } from '../../utils/whatsapp';
import { PrintLetterhead } from './PrintLetterhead';
import { PrintFooter } from './PrintFooter';

interface ClinicalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientCpf: string;
  patientPhone: string;
  dentistName: string;
  dentistCro: string;
  clinicAddress: string;
}

export const ClinicalDocumentModal: React.FC<ClinicalDocumentModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientCpf,
  patientPhone,
  dentistName,
  dentistCro,
  clinicAddress
}) => {
  const [docType, setDocType] = useState<'CERTIFICATE' | 'BUDGET'>('CERTIFICATE');

  // Dados do Atestado
  const [restDays, setRestDays] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [isHourOnly, setIsHourOnly] = useState(false);
  const [includeCid, setIncludeCid] = useState(false);
  const [cidCode, setCidCode] = useState('K04.0 (Pulpite Irreversível)');
  const [notes, setNotes] = useState('Necessita repouso e cuidados pós-operatórios.');

  // Dados do Orçamento
  const [budgetItems, setBudgetItems] = useState([
    { procedure: 'Exodontia simples cirúrgica do 38', tooth: '38', value: 450.0 },
    { procedure: 'Restauração Resina Composta (MOD)', tooth: '16', value: 320.0 }
  ]);
  const [discountPercent, setDiscountPercent] = useState(5);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [validityDays, setValidityDays] = useState(30);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('pt-BR');

  // Cálculos do orçamento
  const subtotal = budgetItems.reduce((acc, i) => acc + i.value, 0);
  const discountVal = (subtotal * discountPercent) / 100;
  const cashTotal = subtotal - discountVal;
  const installmentValue = subtotal / installmentCount;

  // Impressão nativa limpa
  const handlePrint = () => {
    window.print();
  };

  // Envio no WhatsApp
  const handleSendWhatsApp = () => {
    let msg = '';
    if (docType === 'CERTIFICATE') {
      msg = `*ATESTADO ODONTOLÓGICO*\n\n` +
        `Atesto para os devidos fins que *${patientName}* (CPF: ${patientCpf}) esteve sob meus cuidados odontológicos em *${todayStr}*.\n\n` +
        (isHourOnly
          ? `Período do atendimento: das *${startTime}* às *${endTime}*.\n`
          : `Necessitando de repouso por *${restDays} dia(s)* a contar desta data.\n`) +
        (includeCid ? `CID-10: ${cidCode} (Autorizado pelo paciente).\n` : '') +
        `\n*${dentistName}*\n${dentistCro}\n${clinicAddress}`;
    } else {
      msg = `*ORÇAMENTO ODONTOLÓGICO - ${dentistName}*\n\n` +
        `Paciente: *${patientName}*\nData: *${todayStr}*\nValidade da Proposta: *${validityDays} dias*\n\n` +
        `*Tratamentos Planejados:*\n` +
        budgetItems.map((item) => `• ${item.procedure} (${item.tooth}): R$ ${item.value.toFixed(2)}`).join('\n') +
        `\n\n*Total:* R$ ${subtotal.toFixed(2)}` +
        `\n• *À vista (PIX/Dinheiro - ${discountPercent}% desc.):* R$ ${cashTotal.toFixed(2)}` +
        `\n• *Cartão de Crédito:* ${installmentCount}x de R$ ${installmentValue.toFixed(2)} sem juros.` +
        `\n\nQualquer dúvida estamos à disposição!`;
    }
    openWhatsAppDirect(patientPhone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto print:p-0 print:bg-white print:static print:block" role="dialog">
      <div className="print-document-container bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:overflow-visible">
        {/* HEADER DO MODAL (OCULTO NA IMPRESSÃO) */}
        <div className="no-print bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Emissão de Documentos Clínicos Oficiais
              </h3>
              <p className="text-xs text-slate-300">
                Atestados odontológicos com CRO e Orçamentos formais detalhados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELETOR DE DOCUMENTO (OCULTO NA IMPRESSÃO) */}
        <div className="no-print flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDocType('CERTIFICATE')}
            className={`py-2 px-4 text-xs font-bold border-b-2 rounded-t-xl transition-all cursor-pointer ${
              docType === 'CERTIFICATE'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Atestado Odontológico
          </button>
          <button
            type="button"
            onClick={() => setDocType('BUDGET')}
            className={`py-2 px-4 text-xs font-bold border-b-2 rounded-t-xl transition-all cursor-pointer ${
              docType === 'BUDGET'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 Orçamento Detalhado
          </button>
        </div>

        {/* CONTEÚDO CONFIGURÁVEL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs print:p-0 print:overflow-visible">
          {/* VISUALIZAÇÃO PRÉVIA (ESTILO FOLHA TIMBRADA) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner print:border-none print:shadow-none print:p-0 print:bg-white">
            {/* CABEÇALHO TIMBRADO PARA IMPRESSÃO */}
            <div className="hidden print:block mb-4">
              <PrintLetterhead
                documentTitle={docType === 'CERTIFICATE' ? 'Atestado Odontológico' : 'Orçamento Odontológico'}
                dentistName={dentistName}
                cro={dentistCro}
                address={clinicAddress}
              />
            </div>

            <div className="no-print text-center border-b border-slate-200 pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                {dentistName}
              </h4>
              <p className="text-[11px] font-bold text-blue-700">{dentistCro}</p>
              <p className="text-[10px] text-slate-500">{clinicAddress}</p>
            </div>

            {docType === 'CERTIFICATE' ? (
              <div className="space-y-3 text-slate-700 leading-relaxed font-serif text-[13px] bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-center font-bold tracking-widest text-slate-900 font-sans text-xs uppercase mb-3">
                  ATESTADO ODONTOLÓGICO
                </div>
                <p>
                  Atesto para os devidos fins que o(a) paciente <strong>{patientName}</strong>, portador(a) do CPF nº <strong>{patientCpf}</strong>, esteve sob meus cuidados profissionais no dia <strong>{todayStr}</strong>.
                </p>
                {isHourOnly ? (
                  <p>
                    O atendimento ocorreu no período das <strong>{startTime}</strong> às <strong>{endTime}</strong>.
                  </p>
                ) : (
                  <p>
                    Necessitando o(a) mesmo(a) de <strong>{restDays} dia(s)</strong> de repouso e afastamento de suas atividades habituais a contar desta data, por motivo de intervenção odontológica.
                  </p>
                )}
                {includeCid && (
                  <p className="text-xs text-slate-500 font-sans">
                    Diagnóstico / CID-10: <strong>{cidCode}</strong> <em>(Divulgação autorizada pelo paciente conforme Resolução CFO e Art. 11 LGPD)</em>.
                  </p>
                )}
                <div className="pt-8 text-center space-y-1">
                  <div className="w-56 border-t border-slate-400 mx-auto" />
                  <p className="font-bold text-slate-800 text-xs font-sans">{dentistName}</p>
                  <p className="text-[10px] text-slate-500 font-sans">{dentistCro} • Cirurgião-Dentista</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-center font-bold tracking-widest text-slate-900 text-xs uppercase mb-2">
                  PROPOSTA DE TRATAMENTO & ORÇAMENTO
                </div>
                <p className="text-slate-600">
                  Paciente: <strong className="text-slate-800">{patientName}</strong> | Data: {todayStr} | Validade: {validityDays} dias
                </p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold">
                      <tr>
                        <th className="p-2 text-left">Procedimento</th>
                        <th className="p-2 text-center">Elemento</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {budgetItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{item.procedure}</td>
                          <td className="p-2 text-center text-blue-600 font-bold">{item.tooth}</td>
                          <td className="p-2 text-right font-bold">R$ {item.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>Total da Proposta:</span>
                    <span className="text-sm text-blue-700">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                    <span>À vista (PIX / Transferência - {discountPercent}% desc.):</span>
                    <span>R$ {cashTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Cartão de Crédito Parcelado:</span>
                    <span>{installmentCount}x de R$ {installmentValue.toFixed(2)} sem juros</span>
                  </div>
                </div>
              </div>
            )}

            {/* RODAPÉ TIMBRADO COM ASSINATURA */}
            <div className="hidden print:block mt-6">
              <PrintFooter
                dentistName={dentistName}
                cro={dentistCro}
              />
            </div>
          </div>

          {/* CAMPOS DE CONFIGURAÇÃO DO DOCUMENTO (OCULTO NA IMPRESSÃO) */}
          <div className="no-print space-y-4">
          {docType === 'CERTIFICATE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hourOnlyCheck"
                  checked={isHourOnly}
                  onChange={(e) => setIsHourOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <label htmlFor="hourOnlyCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Apenas declaração de comparecimento (Horas)
                </label>
              </div>

              {!isHourOnly ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dias de Afastamento / Repouso
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={restDays}
                    onChange={(e) => setRestDays(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-blue-600"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Início</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Término</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cidCheck"
                  checked={includeCid}
                  onChange={(e) => setIncludeCid(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <label htmlFor="cidCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Incluir CID-10 no documento (Consentimento expresso do paciente)
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Desconto à Vista (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Parcelas no Cartão
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Validade da Proposta (Dias)
                </label>
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>
            </div>
          )}
          </div>
        </div>

        {/* RODAPÉ DE AÇÕES (OCULTO NA IMPRESSÃO) */}
        <div className="no-print p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Enviar no WhatsApp
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir (A4 / A5)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
