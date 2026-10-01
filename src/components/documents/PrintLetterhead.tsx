import React from 'react';

interface PrintLetterheadProps {
  clinicName?: string;
  dentistName?: string;
  cro?: string;
  address?: string;
  phone?: string;
  documentTitle: string;
}

export const PrintLetterhead: React.FC<PrintLetterheadProps> = ({
  clinicName = "Consultório Odontológico Gerencia Odonto",
  dentistName = "Dr. Titular Responsável",
  cro = "CRO-SP 123.456",
  address = "Rua Central, 100 - Sala 12 - Centro",
  phone = "(11) 98765-4321",
  documentTitle
}) => {
  return (
    <header className="print-header border-b-2 border-slate-800 pb-4 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦷</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">{clinicName}</h1>
          </div>
          <p className="text-sm font-semibold text-slate-700 mt-1">
            {dentistName} • <span className="text-blue-700">{cro}</span>
          </p>
          <p className="text-xs text-slate-500">{address} | Tel/WhatsApp: {phone}</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 border border-slate-300 font-bold rounded text-xs uppercase tracking-wider">
            {documentTitle}
          </span>
        </div>
      </div>
    </header>
  );
};
