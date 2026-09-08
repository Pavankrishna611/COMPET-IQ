'use client';

import React from 'react';
import Link from 'next/link';
import { RelatedCompetencyInfo } from '@/data/assistant';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Target, ArrowRight, TrendingUp } from 'lucide-react';

interface RelatedCompetencyCardProps {
  competency: RelatedCompetencyInfo;
}

export function RelatedCompetencyCard({ competency }: RelatedCompetencyCardProps) {
  const getBadgeVariant = (status: RelatedCompetencyInfo['status']) => {
    switch (status) {
      case 'Critical Gap':
        return 'critical';
      case 'High Priority':
        return 'warning';
      case 'Moderate Gap':
        return 'info';
      case 'Proficient':
      default:
        return 'success';
    }
  };

  return (
    <div className="p-4 bg-surface-elevated/70 border border-border rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Related Competency
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-text-primary">
              {competency.name}
            </h4>
          </div>
        </div>

        <Badge variant={getBadgeVariant(competency.status)} size="sm">
          {competency.status}
        </Badge>
      </div>

      {/* Competency Metric comparison */}
      <div className="grid grid-cols-3 gap-2 text-center p-2.5 bg-surface rounded-lg border border-border-light text-xs font-mono">
        <div>
          <span className="text-[10px] text-text-muted block font-sans">Current</span>
          <span className="font-bold text-text-secondary">{competency.currentLevel.toFixed(1)} / 5</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block font-sans">Required</span>
          <span className="font-bold text-text-primary">{competency.requiredLevel.toFixed(1)} / 5</span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block font-sans">Gap</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            -{competency.gap.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-1">
        <Link href={competency.link || '/learner/skill-gaps'}>
          <Button
            size="sm"
            variant="secondary"
            rightIcon={<ArrowRight className="w-3 h-3" />}
            className="text-[11px] h-7 px-2.5 font-semibold"
          >
            View Skill Gap
          </Button>
        </Link>
      </div>
    </div>
  );
}
