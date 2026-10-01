import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  showClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  showClose = true
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-[95vw] sm:h-[95vh]'
  };

  const isFullScreenClass = size === 'full' ? 'h-full sm:h-auto' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className={`relative w-full ${sizes[size]} ${isFullScreenClass} bg-white flex flex-col rounded-2xl shadow-xl animate-in zoom-in-95 duration-200 max-h-full`}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-start justify-between px-4 py-4 sm:px-6 border-b border-slate-100 flex-shrink-0">
            <div className="pr-4">
              {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {showClose && (
              <IconButton
                icon={<X className="w-5 h-5" />}
                variant="ghost"
                onClick={onClose}
                aria-label="Fechar"
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[100px]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-4 sm:px-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
