import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-xl';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
  };

  const sizes = {
    sm: 'text-sm px-3 py-2 min-h-[44px] md:min-h-0', // Min 44px on mobile
    md: 'text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
      {children}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'children'> {
  icon: ReactNode;
}

export function IconButton({ icon, size = 'md', className = '', ...props }: IconButtonProps) {
  const sizes = {
    sm: 'p-2 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:w-8 md:h-8',
    md: 'p-2.5 min-h-[44px] min-w-[44px] md:w-10 md:h-10',
    lg: 'p-3 min-h-[48px] min-w-[48px] md:w-12 md:h-12',
  };

  return (
    <Button
      size={size}
      className={`rounded-full flex-shrink-0 !px-0 !py-0 ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
}
