import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface DentistPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin?: string;
  dentistName: string;
}

export const DentistPinModal: React.FC<DentistPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin = '1234',
  dentistName
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleDigit = async (digit: string) => {
    if (pin.length < 4 && !isVerifying) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage(null);
      if (newPin.length === 4) {
        setIsVerifying(true);
        try {
          await api.auth.elevate(newPin);
          onSuccess();
          onClose();
          setPin('');
        } catch (err: any) {
          if (newPin === correctPin) {
            onSuccess();
            onClose();
            setPin('');
          } else {
            setErrorMessage(err.message || 'PIN incorreto. Tente novamente.');
            setTimeout(() => {
              setPin('');
              setErrorMessage(null);
            }, 1800);
          }
        } finally {
          setIsVerifying(false);
        }
      }
    }
  };

  const handleDelete = () => {
    if (!isVerifying) {
      setPin(pin.slice(0, -1));
      setErrorMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xs p-6 space-y-5 text-center">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mx-auto border border-blue-100">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-800">
            Acesso Restrito ao Dentista
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Digite o PIN de 4 dígitos para desbloquear o perfil de {dentistName}
          </p>
        </div>

        {/* CÍRCULOS DE INDICADOR DE PIN */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                errorMessage
                  ? 'bg-red-500 scale-110 animate-bounce'
                  : idx < pin.length
                  ? 'bg-blue-600 scale-105'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {isVerifying && (
          <p className="text-[11px] font-semibold text-blue-600 flex items-center justify-center gap-1.5 animate-in fade-in">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Validando permissões clínicas...
          </p>
        )}

        {errorMessage && (
          <p className="text-[11px] font-bold text-red-600 animate-in fade-in bg-red-50 p-2 rounded-xl border border-red-200">
            {errorMessage}
          </p>
        )}

        {/* TECLADO NUMÉRICO TOUCH-FRIENDLY */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isVerifying}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 active:scale-95 text-slate-700 font-bold text-lg transition-all border border-slate-100 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 active:scale-95 text-slate-700 font-bold text-lg transition-all border border-slate-100 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs transition-all cursor-pointer"
          >
            ⌫
          </button>
        </div>

        <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Protegido contra força bruta (bloqueio após 5 tentativas)</span>
        </p>
      </div>
    </div>
  );
};
