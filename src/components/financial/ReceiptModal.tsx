import React, { useState } from 'react';
import { Printer, Copy, Check, X, FileCheck, Share2 } from 'lucide-react';
import { CheckoutResult } from './CheckoutModal';
import { openWhatsAppDirect } from '../../utils/whatsapp';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutData: CheckoutResult | null;
  patientPhone?: string;
  dentistName?: string;
  dentistCro?: string;
  dentistCpf?: string;
  clinicAddress?: string;
}

// Helper para converter valor numérico em extenso básico em português
function valorPorExtenso(valor: number): string {
  const inteiros = Math.floor(valor);
  const centavos = Math.round((valor - inteiros) * 100);

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  // Para valores comuns de consultas odontológicas particulares (até 9.999)
  let texto = '';
  if (inteiros === 100) texto = 'cem reais';
  else if (inteiros < 10) texto = `${unidades[inteiros]} reais`;
  else if (inteiros < 20) {
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    texto = `${especiais[inteiros - 10]} reais`;
  } else if (inteiros < 100) {
    const d = Math.floor(inteiros / 10);
    const u = inteiros % 10;
    texto = `${dezenas[d]}${u > 0 ? ` e ${unidades[u]}` : ''} reais`;
  } else if (inteiros < 1000) {
    const c = Math.floor(inteiros / 100);
    const resto = inteiros % 100;
    if (resto === 0) texto = `${centenas[c]} reais`;
    else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      texto = `${centenas[c]} e ${dezenas[d]}${u > 0 ? ` e ${unidades[u]}` : ''} reais`;
    }
  } else {
    texto = `${valor.toFixed(2)} reais`;
  }

  if (centavos > 0) {
    texto += ` e ${centavos} centavos`;
  }

  return texto;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  checkoutData,
  patientPhone,
  dentistName = 'Dra. Juliana Mendes',
  dentistCro = 'CRO-SP 123.456',
  dentistCpf = '123.456.789-00',
  clinicAddress = 'Av. Paulista, 1000 - Sala 42, Bela Vista, São Paulo - SP'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !checkoutData) return null;

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const valorExtenso = valorPorExtenso(checkoutData.grossTotal);

  const textoReciboWhatsApp = `🦷 *RECIBO ODONTOLÓGICO - ${dentistName}*
CRO: ${dentistCro} | CPF: ${dentistCpf}

Recebi de: *${checkoutData.payerName}* (CPF: ${checkoutData.payerCpf})
A quantia de: *R$ ${checkoutData.grossTotal.toFixed(2)}* (${valorExtenso})
Referente a serviços odontológicos prestados a: *${checkoutData.patientName}*
Tratamento: ${checkoutData.description}
Data: ${dataAtual}

_Válido para fins de declaração no Imposto de Renda (DMED / Carnê-Leão)._`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(textoReciboWhatsApp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Recibo de Quitação Odontológica (Profissional Autônomo)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Padrão CFO e Receita Federal para comprovação na DMED / IRPF
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

        {/* SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ÁREA VISUAL DO RECIBO (FORMATO PAPEL Timbrado) */}
          <div className="border-2 border-slate-300 rounded-2xl p-4 sm:p-6 bg-slate-50/60 font-serif text-slate-800 space-y-4 sm:space-y-5 shadow-2xs print:border-none print:p-0">
            
            {/* Cabeçalho do Consultório */}
            <div className="text-center border-b border-slate-300 pb-3 sm:pb-4 space-y-0.5">
              <h2 className="text-base font-bold tracking-wide uppercase font-sans text-slate-900">
                {dentistName}
              </h2>
              <p className="text-xs font-sans text-slate-600 font-medium">
                Cirurgiã-Dentista | {dentistCro} | CPF: {dentistCpf}
              </p>
              <p className="text-[10px] font-sans text-slate-400">
                {clinicAddress}
              </p>
            </div>

            {/* Destaque do Valor */}
            <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 px-4 font-sans">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recibo Odontológico
              </span>
              <span className="text-lg font-black text-slate-900 font-mono">
                VALOR: R$ {checkoutData.grossTotal.toFixed(2)}
              </span>
            </div>

            {/* Texto de Quitação */}
            <div className="text-xs leading-relaxed text-slate-700 space-y-3 font-sans">
              <p className="text-justify">
                Recebi de <strong>{checkoutData.payerName}</strong>, inscrito(a) no CPF sob o nº <strong>{checkoutData.payerCpf}</strong>,
                a quantia de <strong>R$ {checkoutData.grossTotal.toFixed(2)} ({valorExtenso})</strong>,
                referente aos serviços profissionais de odontologia prestados a{' '}
                <strong>{checkoutData.patientName}</strong>, correspondente a:{' '}
                <em>{checkoutData.description}</em>.
              </p>

              <p className="text-[11px] text-slate-500 italic">
                * Por ser a expressão da verdade e para fins de comprovação perante a Receita Federal do Brasil (DMED / Carnê-Leão), firmo o presente recibo.
              </p>
            </div>

            {/* Data e Assinatura */}
            <div className="pt-4 sm:pt-6 border-t border-slate-200 text-center font-sans space-y-1">
              <p className="text-xs text-slate-600">
                São Paulo, {dataAtual}.
              </p>
              <div className="pt-3 sm:pt-4">
                <div className="w-48 sm:w-56 border-b border-slate-400 mx-auto" />
                <span className="block text-xs font-bold text-slate-800 mt-1">
                  {dentistName}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {dentistCro}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const phone = patientPhone || '(11) 98765-4321';
                openWhatsAppDirect(phone, textoReciboWhatsApp);
              }}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              WhatsApp
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Concluir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
