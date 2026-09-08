import React from 'react';
import { cn } from '@/lib/utils';
import { FileQuestion } from 'lucide-react';
import { Button } from '../Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-surface border border-dashed border-border rounded-card',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
