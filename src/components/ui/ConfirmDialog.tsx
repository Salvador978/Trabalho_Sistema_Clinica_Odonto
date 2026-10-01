import React, { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
  icon
}: ConfirmDialogProps) {
  
  const variants = {
    danger: {
      buttonVariant: 'danger' as const,
      iconClass: 'text-red-600 bg-red-100',
      DefaultIcon: AlertCircle
    },
    warning: {
      buttonVariant: 'primary' as const, // Or a specific warning variant if we had one
      iconClass: 'text-amber-600 bg-amber-100',
      DefaultIcon: AlertTriangle
    },
    info: {
      buttonVariant: 'primary' as const,
      iconClass: 'text-blue-600 bg-blue-100',
      DefaultIcon: Info
    }
  };

  const config = variants[variant];
  const IconComponent = config.DefaultIcon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showClose={false}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${config.iconClass}`}>
          {icon || <IconComponent className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        
        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            fullWidth
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
