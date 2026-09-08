import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  accent?: 'blue' | 'teal' | 'warning' | 'critical' | 'ai';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'blue',
  className,
}: StatCardProps) {
  const iconAccents = {
    blue: 'bg-primary-light text-primary',
    teal: 'bg-teal-light text-teal',
    warning: 'bg-warning-light text-warning',
    critical: 'bg-critical-light text-critical',
    ai: 'bg-ai-light text-ai-purple',
  };

  return (
    <Card className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {title}
          </span>
          <span className="text-2xl font-bold text-text-primary tracking-tight">
            {value}
          </span>
        </div>
        {icon && (
          <div
            className={cn(
              'w-10 h-10 rounded-btn flex items-center justify-center shrink-0',
              iconAccents[accent]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-border-light flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold',
                trend.direction === 'up'
                  ? 'text-success'
                  : trend.direction === 'down'
                  ? 'text-critical'
                  : 'text-text-muted'
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-text-muted truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
