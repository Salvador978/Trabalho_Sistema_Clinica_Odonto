import React, { useState, useEffect } from 'react';
import { SignaturePad, SignatureData } from './SignaturePad';
import { HeartPulse, Check, X, ShieldAlert, Sparkles, CheckCircle2, Wifi, WifiOff, Save } from 'lucide-react';
import { generateSha256Hash } from '../../hooks/useSignature';

export interface AnamnesisAnswers {
  hypertension: boolean;
  diabetes: boolean;
  anticoagulant: boolean;
  allergyPenicillin: boolean;
  allergyAnesthetic: boolean;
  allergyDipirona: boolean;
  pregnant: boolean;
  cardiacPacemaker: boolean;
  observations: string;
  signature?: SignatureData;
  hashSha256?: string;
  cachedOffline?: boolean;
}

interface ReceptionAnamnesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName: string;
  patientCpf: string;
  onSaveAnamnesis: (answers: AnamnesisAnswers) => void;
}

export const ReceptionAnamnesisModal: React.FC<ReceptionAnamnesisModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientCpf,
  onSaveAnamnesis
}) => {
  const cacheKey = `anamnesis_draft_${patientCpf.replace(/\D/g, '')}`;

  const [answers, setAnswers] = useState<AnamnesisAnswers>(() => {
    // Tenta restaurar do cache local caso tenha ocorrido queda de Wi-Fi prévia
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignora erro de parsing
    }
    return {
      hypertension: false,
      diabetes: false,
      anticoagulant: false,
      allergyPenicillin: false,
      allergyAnesthetic: false,
      allergyDipirona: false,
      pregnant: false,
      cardiacPacemaker: false,
      observations: ''
    };
  });

  const [step, setStep] = useState<'FORM' | 'SIGNATURE' | 'DONE'>('FORM');
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasRestoredFromCache, setHasRestoredFromCache] = useState(false);
  const [lastAutoSavedTime, setLastAutoSavedTime] = useState<string>('');

  // Monitora conectividade de rede (Wi-Fi online/offline)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifica se restaurou do cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHasRestoredFromCache(true);
      }
    } catch {}

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [cacheKey]);

  // Auto-Save contínuo no localStorage a cada alteração (Blindagem contra queda de Wi-Fi ou fechamento acidental)
  useEffect(() => {
    if (!isOpen) return;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(answers));
      const now = new Date();
      setLastAutoSavedTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Falha ao gravar cache offline da anamnese:', e);
    }
  }, [answers, isOpen, cacheKey]);

  if (!isOpen) return null;

  const handleFinish = async (signature: SignatureData) => {
    setSignatureData(signature);
    setStep('DONE');

    let hashSha256 = '';
    try {
      const payloadToHash = {
        patientId,
        patientName,
        patientCpf,
        answers: {
          hypertension: answers.hypertension,
          diabetes: answers.diabetes,
          anticoagulant: answers.anticoagulant,
          allergyPenicillin: answers.allergyPenicillin,
          allergyAnesthetic: answers.allergyAnesthetic,
          allergyDipirona: answers.allergyDipirona,
          pregnant: answers.pregnant,
          cardiacPacemaker: answers.cardiacPacemaker,
          observations: answers.observations
        },
        signatureTimestamp: signature.timestamp,
        signatureIp: signature.ipAddress
      };
      hashSha256 = await generateSha256Hash(payloadToHash);
    } catch (e) {
      console.error('Erro ao calcular hash SHA-256:', e);
    }

    const finalData: AnamnesisAnswers = {
      ...answers,
      signature,
      hashSha256,
      cachedOffline: !isOnline
    };

    // Remove do cache de rascunho apenas após a confirmação final
    try {
      localStorage.removeItem(cacheKey);
    } catch {}

    onSaveAnamnesis(finalData);
  };

  const handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {}
    setAnswers({
      hypertension: false,
      diabetes: false,
      anticoagulant: false,
      allergyPenicillin: false,
      allergyAnesthetic: false,
      allergyDipirona: false,
      pregnant: false,
      cardiacPacemaker: false,
      observations: ''
    });
    setHasRestoredFromCache(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* HEADER MODAL TABLET COM STATUS DE CONEXÃO & AUTO-SAVE */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-linear-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full">
                  Tablet Recepção
                </span>
                {/* Indicador de Wi-Fi & Cache */}
                {isOnline ? (
                  <span className="text-[10px] font-semibold text-emerald-200 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Wifi className="w-3 h-3 text-emerald-300" />
                    Online
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-200 flex items-center gap-1 bg-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                    <WifiOff className="w-3 h-3 text-amber-300" />
                    Wi-Fi Instável (Cache Ativo)
                  </span>
                )}
              </div>
              <h2 className="text-base font-extrabold mt-0.5">
                Questionário de Saúde & Anamnese
              </h2>
              <p className="text-xs text-blue-100">
                Paciente: <strong>{patientName}</strong> ({patientCpf})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE RESILIÊNCIA OFFLINE / CACHE RESTAURADO */}
        {hasRestoredFromCache && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <span className="flex items-center gap-1.5">
              <Save className="w-4 h-4 text-amber-600" />
              <strong>Proteção Anti-Queda de Wi-Fi:</strong> Respostas anteriores recuperadas automaticamente do tablet.
            </span>
            <button
              type="button"
              onClick={handleClearCacheAndReset}
              className="text-[11px] text-amber-700 underline font-semibold hover:text-amber-900"
            >
              Recomeçar do zero
            </button>
          </div>
        )}

        {/* CORPO DO FORMULÁRIO TABLET */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {step === 'FORM' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs">
                <span>👋 <strong>Olá, {patientName}!</strong> Por favor responda com sinceridade para sua segurança clínica.</span>
                {lastAutoSavedTime && (
                  <span className="text-[10px] text-blue-600 shrink-0 font-medium ml-2">
                    ✓ Salvo localmente {lastAutoSavedTime}
                  </span>
                )}
              </div>

              {/* LISTA DE PERGUNTAS COM BOTÕES GRANDES DE TOQUE (MIN 44PX) */}
              <div className="space-y-3">
                {[
                  { field: 'hypertension' as const, label: 'Você tem Pressão Alta (Hipertensão)?', desc: 'Controlada ou não com medicamentos.' },
                  { field: 'diabetes' as const, label: 'Você tem Diabetes?', desc: 'Importante para cicatrização e anestesia.' },
                  { field: 'anticoagulant' as const, label: 'Toma anticoagulantes ou remédios para afinar o sangue?', desc: 'Ex: AAS, Aspirina, Marevan, Xarelto, Clopidogrel.' },
                  { field: 'allergyPenicillin' as const, label: 'Tem alergia a Amoxicilina ou Penicilina?', desc: 'Antibióticos comuns.' },
                  { field: 'allergyAnesthetic' as const, label: 'Já teve reação alérgica a anestesia odontológica?', desc: 'Inchaço, vermelhidão ou falta de ar em consultório.' },
                  { field: 'allergyDipirona' as const, label: 'Tem alergia a Dipirona ou Anti-inflamatórios?', desc: 'Analgésicos para dor.' },
                  { field: 'cardiacPacemaker' as const, label: 'Possui marca-passo ou problema cardíaco?', desc: 'Cuidados com aparelhos de ultrassom dental.' },
                  { field: 'pregnant' as const, label: 'Está grávida ou amamentando?', desc: 'Para mulheres.' }
                ].map((item) => {
                  const isYes = answers[item.field];
                  return (
                    <div
                      key={item.field}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
                        isYes
                          ? 'border-red-300 bg-red-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {isYes && <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
                          {item.label}
                        </div>
                        <p className="text-xs text-slate-600">{item.desc}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.field]: false }))}
                          className={`min-h-[44px] min-w-[64px] px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer ${
                            !isYes
                              ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-900'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          Não
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [item.field]: true }))}
                          className={`min-h-[44px] min-w-[64px] px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center cursor-pointer ${
                            isYes
                              ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-600'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          Sim
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Observações de Doenças ou Medicações de Uso Contínuo */}
                <div className="space-y-1.5 pt-2">
                  <label className="font-bold text-slate-900 text-sm">
                    Toma algum remédio contínuo ou tem outra doença a declarar?
                  </label>
                  <textarea
                    rows={2}
                    value={answers.observations}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, observations: e.target.value }))}
                    placeholder="Ex: Tomo Losartana 50mg todos os dias pela manhã..."
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA DE ASSINATURA DIGITAL NO TABLET */}
          {step === 'SIGNATURE' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
                ✍️ <strong>Para finalizar:</strong> Por favor, assine no campo abaixo declarando que todas as informações prestadas são verdadeiras.
              </div>

              <SignaturePad
                signerName={patientName}
                signerCpf={patientCpf}
                onConfirm={handleFinish}
                onCancel={() => setStep('FORM')}
              />
            </div>
          )}

          {/* ETAPA DE CONCLUSÃO */}
          {step === 'DONE' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Anamnese Digital Preenchida e Assinada!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto mt-1">
                  Os dados foram salvos com sucesso e os alertas de saúde já foram transmitidos para a tela da Dra. Juliana Mendes na cadeira odontológica.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-8 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Concluir e Devolver Tablet
              </button>
            </div>
          )}
        </div>

        {/* FOOTER TABLET */}
        {step === 'FORM' && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setStep('SIGNATURE')}
              className="min-h-[44px] px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Avançar para Assinatura</span>
              <span>➔</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
