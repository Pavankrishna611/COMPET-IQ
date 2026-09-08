import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'critical' | 'info' | 'teal' | 'ai' | 'neutral';
  size?: 'sm' | 'md';
  withDot?: boolean;
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    neutral: 'bg-[#F0F4F8] text-text-secondary border-border',
    success: 'bg-success-light text-success border-success/30',
    warning: 'bg-warning-light text-warning border-warning/30',
    critical: 'bg-critical-light text-critical border-critical/30',
    info: 'bg-primary-light text-primary border-primary/30',
    teal: 'bg-teal-light text-teal border-teal/30',
    ai: 'bg-ai-light text-ai-purple border-ai-purple/30',
  };

  const dotColors = {
    neutral: 'bg-text-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-critical',
    info: 'bg-primary',
    teal: 'bg-teal',
    ai: 'bg-ai-purple',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium leading-none tracking-wide select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      <span>{children}</span>
    </span>
  );
}
