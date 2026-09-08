import React from 'react';
import { cn } from '@/lib/utils';
import { SkillGap } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export interface SkillGapCardProps {
  skillGap: SkillGap;
  onAddressGap?: (gap: SkillGap) => void;
  className?: string;
}

export function SkillGapCard({ skillGap, onAddressGap, className }: SkillGapCardProps) {
  const priorityVariants: Record<string, 'critical' | 'warning' | 'info'> = {
    critical: 'critical',
    moderate: 'warning',
    low: 'info',
  };

  return (
    <Card hoverable className={cn('p-5 flex flex-col justify-between', className)}>
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant={priorityVariants[skillGap.priority] || 'warning'} size="sm" withDot>
            {skillGap.priority.toUpperCase()} PRIORITY
          </Badge>
          <span className="text-xs text-text-muted">{skillGap.domain}</span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-text-primary mb-2.5 leading-snug">
          {skillGap.competencyName}
        </h4>

        {/* Level Differential Comparison */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F8FC] border border-border-light rounded-btn mb-3 text-center">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">
              Current
            </span>
            <span className="text-base font-bold text-text-primary">
              L{skillGap.currentLevel}
            </span>
          </div>
          <div className="border-x border-border-light">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">
              Required
            </span>
            <span className="text-base font-bold text-primary">
              L{skillGap.requiredLevel}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block">
              Gap
            </span>
            <span className="text-base font-bold text-critical">
              -{skillGap.gap} Lvl
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-2.5 border-t border-border-light flex items-center justify-between">
        {skillGap.impactScore && (
          <span className="text-xs text-text-muted">
            Impact: <strong className="text-text-primary">{skillGap.impactScore}/100</strong>
          </span>
        )}
        <Button
          size="sm"
          variant="secondary"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={() => onAddressGap?.(skillGap)}
        >
          Address Gap
        </Button>
      </div>
    </Card>
  );
}
