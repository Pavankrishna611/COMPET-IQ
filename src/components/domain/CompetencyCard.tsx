import React from 'react';
import { cn } from '@/lib/utils';
import { Competency } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calendar, CheckCircle2 } from 'lucide-react';

export interface CompetencyCardProps {
  competency: Competency;
  onSelect?: (competency: Competency) => void;
  className?: string;
}

export function CompetencyCard({ competency, onSelect, className }: CompetencyCardProps) {
  const isTargetAchieved = competency.currentLevel >= competency.requiredLevel;

  return (
    <Card hoverable className={cn('p-5 flex flex-col justify-between', className)}>
      <div>
        {/* Top meta */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="neutral" size="sm">
            {competency.category}
          </Badge>
          <span className="text-[11px] font-mono font-medium text-text-muted">
            {competency.code}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-text-primary mb-1.5 leading-snug">
          {competency.name}
        </h4>

        {/* Description */}
        <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
          {competency.description}
        </p>

        {/* Level Scale Visualizer (1 to 5) */}
        <div className="bg-[#F5F8FC] border border-border-light p-3 rounded-btn mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
            <span className="text-text-secondary">Current Level:</span>
            <span className="font-bold text-text-primary">
              Level {competency.currentLevel} of 5
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isFilled = lvl <= competency.currentLevel;
              const isTarget = lvl === competency.requiredLevel;

              return (
                <div key={lvl} className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'w-full h-2 rounded-full transition-colors',
                      isFilled
                        ? 'bg-teal'
                        : lvl <= competency.requiredLevel
                          ? 'bg-[#CBD5E1]'
                          : 'bg-[#E2E8F0]'
                    )}
                  />
                  {isTarget && (
                    <span className="text-[9px] font-bold text-primary tracking-tighter">
                      Req
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2.5 border-t border-border-light flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Calendar className="w-3.5 h-3.5" />
          <span>Assessed: {competency.lastAssessed || 'Pending'}</span>
        </div>

        {isTargetAchieved ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success-light px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3 h-3" /> Target Met
          </span>
        ) : (
          <span className="text-[11px] font-bold text-warning bg-warning-light px-2 py-0.5 rounded">
            Gap: {competency.requiredLevel - competency.currentLevel} lvl
          </span>
        )}
      </div>
    </Card>
  );
}
