import React from 'react';

interface PrintFooterProps {
  hashSha256?: string;
  dentistName?: string;
  cro?: string;
}

export const PrintFooter: React.FC<PrintFooterProps> = ({
  hashSha256,
  dentistName = "Cirurgião-Dentista Responsável",
  cro = "CRO-SP 123.456"
}) => {
  return (
    <footer className="mt-12 pt-6 border-t border-slate-300 print-avoid-break text-xs text-slate-600">
      <div className="flex justify-between items-end mb-6">
        <div className="w-1/2">
          {hashSha256 && (
            <div className="space-y-1">
              <p className="font-semibold text-slate-700">Autenticidade e Integridade (LGPD):</p>
              <p className="font-mono text-[9px] text-slate-500 break-all bg-slate-50 p-1 border rounded">
                SHA-256: {hashSha256}
              </p>
              <p className="text-[10px] text-slate-400">Assinado digitalmente via terminal de atendimento.</p>
            </div>
          )}
        </div>
        <div className="text-center w-64">
          <div className="border-t border-slate-700 pt-1 mb-1"></div>
          <p className="font-semibold text-slate-900">{dentistName}</p>
          <p className="text-slate-500">{cro}</p>
        </div>
      </div>
      <p className="text-[9px] text-center text-slate-400">
        Documento gerado pelo sistema Gerencia Odonto em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
      </p>
    </footer>
  );
};
