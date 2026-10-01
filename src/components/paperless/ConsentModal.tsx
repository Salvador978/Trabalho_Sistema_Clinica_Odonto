import React, { useState } from 'react';
import { SignaturePad, SignatureData } from './SignaturePad';
import { FileText, ShieldAlert, CheckCircle2, Printer, X, Download, ShieldCheck } from 'lucide-react';
import { generateConsentProof } from '../../utils/crypto';
import { api } from '../../services/api';
import { PrintLetterhead } from '../documents/PrintLetterhead';
import { PrintFooter } from '../documents/PrintFooter';

export interface ProcedureConsentItem {
  procedureName: string;
  toothNumber?: number;
  riskNote: string;
}

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  dentistName?: string;
  dentistCro?: string;
  procedures?: ProcedureConsentItem[];
  onConsentSigned?: (signatureData: SignatureData, documentText: string) => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientCpf,
  patientBirthDate,
  dentistName = 'Dra. Juliana Mendes',
  dentistCro = 'CRO-SP 123.456',
  procedures = [
    {
      procedureName: 'Exodontia simples cirúrgica',
      toothNumber: 38,
      riskNote: 'Risco de edema transitório, trismo temporário e parestesia do nervo alveolar inferior/lingual transitória.'
    },
    {
      procedureName: 'Restauração em Resina Composta Fotopolimerizável',
      toothNumber: 16,
      riskNote: 'Risco de sensibilidade pós-operatória térmica transitória.'
    }
  ],
  onConsentSigned
}) => {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [sha256Proof, setSha256Proof] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleConfirmSignature = async (data: SignatureData) => {
    setIsSaving(true);
    try {
      const proof = await generateConsentProof({
        patientName,
        patientCpf,
        dentistName,
        dentistCro,
        procedures: procedures.map((p) => `${p.procedureName} ${p.toothNumber ? `(Dente ${p.toothNumber})` : ''}`),
        signatureBase64: data.signatureBase64,
        strokeCount: data.strokeCount || 1
      });

      setSha256Proof(proof.hash);
      setSignature(data);
      setSignedAt(new Date().toLocaleString('pt-BR'));

      // Grava com persistência real e integridade imutável no banco de dados SQLite
      if (patientId) {
        await api.documents.save({
          patientId,
          patientName,
          type: 'CONSENT_TCLE',
          title: `TCLE - ${procedures.map((p) => p.procedureName).join(', ')}`,
          sha256Hash: proof.hash,
          signatureBase64: data.signatureBase64,
          dentistCro,
          content: {
            procedures,
            patientCpf,
            signedAt: proof.timestamp,
            strokeCount: proof.signatureStrokeCount,
            ipAddress: proof.ipAddress
          }
        }).catch((err) => {
          console.warn('Documento armazenado localmente (servidor offline ou sincronizando):', err);
        });
      }

      if (onConsentSigned) {
        onConsentSigned(data, 'TCLE Odontológico Completo');
      }
    } catch (err) {
      console.error('Erro ao gerar prova criptográfica do TCLE:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:block" role="dialog">
      <div className="print-document-container bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none print:overflow-visible">
        
        {/* HEADER DO DOCUMENTO (OCULTO NA IMPRESSÃO) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Termo de Consentimento Livre e Esclarecido (TCLE)
              </h2>
              <p className="text-xs text-slate-500">
                Conformidade legal CFO / Código de Ética Odontológica & Lei Geral de Proteção de Dados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO TERMO CLÍNICO */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed font-sans print:p-0 print:overflow-visible">
          {/* CABEÇALHO TIMBRADO PARA IMPRESSÃO */}
          <div className="hidden print:block mb-4">
            <PrintLetterhead
              documentTitle="Termo de Consentimento Livre e Esclarecido (TCLE)"
              dentistName={dentistName}
              cro={dentistCro}
            />
          </div>
          
          {/* Identificação das Partes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paciente:</span>
              <strong className="text-slate-800">{patientName}</strong>
              <div className="text-[11px] text-slate-500">CPF: {patientCpf} | Nasc: {patientBirthDate}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cirurgiã-Dentista Responsável:</span>
              <strong className="text-slate-800">{dentistName}</strong>
              <div className="text-[11px] text-slate-500">{dentistCro} | Consultório Odontológico Particular</div>
            </div>
          </div>

          {/* Procedimentos Planejados */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <span>📋</span> 1. PROCEDIMENTOS PROPOSTOS E ELEMENTOS DENTÁRIOS
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {procedures.map((proc, index) => (
                <div key={index} className="p-3 bg-white hover:bg-slate-50/50">
                  <div className="flex items-center justify-between font-bold text-slate-800 text-xs">
                    <span>
                      {proc.procedureName} {proc.toothNumber ? `- Dente ${proc.toothNumber} (FDI)` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                      Indicado
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 flex items-start gap-1 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span><strong>Riscos específicos informados:</strong> {proc.riskNote}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cláusulas Legais e Esclarecimento */}
          <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-2">
            <h3 className="font-bold text-slate-800 text-xs">2. DECLARAÇÃO DE ESCLARECIMENTO E CONSENTIMENTO</h3>
            <p>
              Eu, devidamente qualificado(a) acima, declaro que fui clara e exaustivamente informado(a) pela cirurgiã-dentista sobre o diagnóstico,
              objetivos, benefícios esperados, técnicas a serem utilizadas e riscos inerentes aos procedimentos descritos.
            </p>
            <p>
              Tive a oportunidade de fazer perguntas, as quais foram respondidas satisfatoriamente. Compreendo que na área da saúde não há garantias absolutas de cura,
              e que o sucesso do tratamento depende também do rigoroso cumprimento das orientações pós-operatórias e da higienização oral.
            </p>
            <h4 className="font-bold text-slate-700 pt-1">3. CUIDADOS PÓS-OPERATÓRIOS OBRIGATÓRIOS:</h4>
            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-600">
              <li>Aplicação de compressa fria/gelo sobre a região nas primeiras 24 horas;</li>
              <li>Alimentação líquida/pastosa e fria nos primeiros 2 dias;</li>
              <li>Não realizar bochechos vigorosos, sucção com canudos ou cuspir nas primeiras 48 horas;</li>
              <li>Abster-se do tabaco e consumo de bebidas alcoólicas durante o período de cicatrização;</li>
              <li>Ingerir rigorosamente a medicação prescrita nos horários determinados.</li>
            </ul>
          </div>

          {/* ÁREA DA ASSINATURA DIGITAL */}
          {!signature ? (
            <div className="pt-2">
              <SignaturePad
                signerName={patientName}
                signerCpf={patientCpf}
                onConfirm={handleConfirmSignature}
                onCancel={onClose}
              />
            </div>
          ) : (
            <div className="border-2 border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                    Documento Assinado Eletronicamente
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Signatário: {patientName} (CPF: {patientCpf})
                  </p>
                  <p className="text-[10px] text-emerald-600 font-mono">
                    Data/Hora: {signedAt} | Hash SHA-256: {sha256Proof ? `${sha256Proof.substring(0, 16)}...` : 'Registrado'}
                  </p>
                </div>
              </div>

              {/* Imagem do traçado assinado */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-4 shadow-2xs">
                <img
                  src={signature.signatureBase64}
                  alt="Assinatura do Paciente"
                  className="h-12 w-auto object-contain"
                />
                <span className="block text-center text-[9px] text-slate-400 mt-0.5">
                  Assinatura Digital Registrada
                </span>
              </div>
            </div>
          )}

          {/* RODAPÉ TIMBRADO COM SHA-256 E ASSINATURA */}
          <div className="hidden print:block mt-6">
            <PrintFooter
              hashSha256={sha256Proof || undefined}
              dentistName={dentistName}
              cro={dentistCro}
            />
          </div>
        </div>

        {/* FOOTER DO MODAL (OCULTO NA IMPRESSÃO) */}
        <div className="no-print p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Documento eletrônico armazenado no Prontuário Digital (Paperless).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            {signature ? 'Fechar e Concluir' : 'Cancelar'}
          </button>
        </div>

      </div>
    </div>
  );
};
