'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={Boolean(error)}
            className={cn(
              'w-full h-9 pl-3 pr-8 text-sm text-text-primary bg-surface border border-border rounded-btn transition-colors appearance-none cursor-pointer',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15',
              'disabled:bg-[#F0F4F8] disabled:text-text-muted disabled:cursor-not-allowed',
              error && 'border-critical focus:border-critical focus:ring-critical/15',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted pointer-events-none absolute right-2.5" />
        </div>
        {error ? (
          <p className="text-xs text-critical font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-text-secondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
