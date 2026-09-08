import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'teal' | 'blue' | 'success' | 'warning' | 'critical';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'teal',
  size = 'md',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const variants = {
    teal: 'bg-teal',
    blue: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-critical',
  };

  const heights = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={cn('w-full flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn('w-full bg-[#E4ECF4] rounded-full overflow-hidden', heights[size])}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-text-primary min-w-[36px] text-right">
          {percentage}%
        </span>
      )}
    </div>
  );
}
