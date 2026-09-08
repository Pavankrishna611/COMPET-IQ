import React from 'react';
import { cn } from '@/lib/utils';
import { LearningPathItem as LearningPathItemType } from '@/types';
import { CheckCircle2, CircleDot, Lock, Clock, BookOpen, ClipboardCheck, Award } from 'lucide-react';

export interface LearningPathItemProps {
  item: LearningPathItemType;
  isLast?: boolean;
  onSelect?: (itemId: string) => void;
  className?: string;
}

export function LearningPathItem({
  item,
  isLast = false,
  onSelect,
  className,
}: LearningPathItemProps) {
  const statusIcons = {
    completed: <CheckCircle2 className="w-5 h-5 text-success" />,
    in_progress: <CircleDot className="w-5 h-5 text-teal" />,
    locked: <Lock className="w-4 h-4 text-text-muted" />,
  };

  const typeIcons = {
    course: <BookOpen className="w-4 h-4 text-primary" />,
    assessment: <ClipboardCheck className="w-4 h-4 text-teal" />,
    case_study: <Award className="w-4 h-4 text-warning" />,
    milestone: <CheckCircle2 className="w-4 h-4 text-success" />,
  };

  return (
    <div className={cn('relative flex items-start gap-4', className)}>
      {/* Step line connector */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 bottom-0 -mb-4',
            item.status === 'completed' ? 'bg-success' : 'bg-border'
          )}
        />
      )}

      {/* Step Circle Indicator */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border transition-colors',
          item.status === 'completed'
            ? 'bg-success-light border-success/40'
            : item.status === 'in_progress'
            ? 'bg-teal-light border-teal shadow-sm ring-4 ring-teal/10'
            : 'bg-[#F0F4F8] border-border'
        )}
      >
        {statusIcons[item.status]}
      </div>

      {/* Content Box */}
      <div
        onClick={() => item.status !== 'locked' && onSelect?.(item.id)}
        className={cn(
          'flex-1 p-3.5 mb-4 border rounded-btn bg-surface transition-all',
          item.status === 'in_progress'
            ? 'border-teal/40 shadow-sm'
            : item.status === 'completed'
            ? 'border-border-light'
            : 'border-border-light/60 opacity-75',
          item.status !== 'locked' && 'hover:border-primary/40 cursor-pointer'
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            {typeIcons[item.type]}
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Step {item.stepOrder} • {item.type.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.duration}
            </span>
            {item.score !== undefined && (
              <span className="text-[11px] font-bold text-success bg-success-light px-1.5 py-0.2 rounded">
                {item.score}%
              </span>
            )}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-text-primary leading-snug">
          {item.title}
        </h4>
      </div>
    </div>
  );
}
