'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'critical' | 'info';
  onClose?: () => void;
  className?: string;
}

export function Toast({
  title,
  message,
  type = 'info',
  onClose,
  className,
}: ToastProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    critical: <AlertCircle className="w-5 h-5 text-critical shrink-0" />,
    info: <Info className="w-5 h-5 text-primary shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-success border-border',
    warning: 'border-l-4 border-l-warning border-border',
    critical: 'border-l-4 border-l-critical border-border',
    info: 'border-l-4 border-l-primary border-border',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-3.5 bg-surface border rounded-btn shadow-card min-w-[280px] max-w-sm transition-all',
        borders[type],
        className
      )}
    >
      {icons[type]}
      <div className="flex-1 pr-2">
        <h4 className="text-xs font-semibold text-text-primary leading-tight">{title}</h4>
        {message && <p className="text-xs text-text-secondary mt-0.5 leading-snug">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss toast"
          className="text-text-muted hover:text-text-primary p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
