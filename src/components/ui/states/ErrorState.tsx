import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '../Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to Load Intelligence Data',
  message = 'An unexpected error occurred while communicating with the statistical service. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'w-full py-10 px-6 flex flex-col items-center justify-center text-center bg-critical-light/40 border border-critical/20 rounded-card',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-critical-light text-critical flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-critical mb-1">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Retry Request
        </Button>
      )}
    </div>
  );
}
