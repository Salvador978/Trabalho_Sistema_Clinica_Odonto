import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Carregando módulo...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 text-slate-500 animate-in fade-in duration-200">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
