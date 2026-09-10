'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailedCompetency, CompetencyStatus } from '@/data/competencies';
import { Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export interface CompetencyCardProps {
  competency: DetailedCompetency;
  onViewDetails: (competency: DetailedCompetency) => void;
}

export function CompetencyCard({ competency, onViewDetails }: CompetencyCardProps) {
  const getStatusBadge = (status: CompetencyStatus) => {
    switch (status) {
      case 'Strong':
        return (
          <Badge variant="success" size="sm" withDot>
            Strong
          </Badge>
        );
      case 'Developing':
        return (
          <Badge variant="info" size="sm" withDot>
            Developing
          </Badge>
        );
      case 'Moderate Gap':
        return (
          <Badge variant="warning" size="sm" withDot>
            Moderate Gap
          </Badge>
        );
      case 'Critical Gap':
      default:
        return (
          <Badge variant="critical" size="sm" withDot>
            Critical Gap
          </Badge>
        );
    }
  };

  const currentPct = (competency.currentLevel / 5) * 100;
  const requiredPct = (competency.requiredLevel / 5) * 100;
  const isGap = competency.gap > 0;

  return (
    <Card className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover bg-surface">
      <div>
        {/* Top Header: Domain & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Badge variant="neutral" size="sm">
            {competency.domain}
          </Badge>
          {getStatusBadge(competency.status)}
        </div>

        {/* Competency Name */}
        <h3 className="text-base font-bold text-text-primary mb-1 line-clamp-1">
          {competency.name}
        </h3>

        <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2 min-h-[32px]">
          {competency.description}
        </p>

        {/* Level Comparison Metric Box */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F8FC] border border-border-light rounded-btn mb-4 text-center">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Current
            </span>
            <span className="text-sm font-bold text-text-primary font-mono">
              {competency.currentLevel.toFixed(1)} / 5
            </span>
          </div>

          <div className="border-x border-border-light">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Required
            </span>
            <span className="text-sm font-bold text-primary font-mono">
              {competency.requiredLevel.toFixed(1)} / 5
            </span>
          </div>

          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Gap
            </span>
            <span
              className={`text-sm font-bold font-mono ${competency.gap > 1.0
                ? 'text-critical'
                : competency.gap > 0
                  ? 'text-warning'
                  : 'text-success'
                }`}
            >
              {competency.gap > 0 ? `-${competency.gap.toFixed(1)}` : 'Met'}
            </span>
          </div>
        </div>

        {/* Visual Comparison Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between items-center text-[10px] text-text-muted">
            <span>Visual Benchmark Alignment</span>
            <span className="font-mono font-semibold text-text-secondary">
              L{competency.currentLevel} → L{competency.requiredLevel}
            </span>
          </div>

          {/* Dual bar: current fill vs required target indicator */}
          <div className="relative w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-primary/20"
              style={{ width: `${requiredPct}%` }}
              title={`Required Level: ${competency.requiredLevel}`}
            />
            <div
              className={`h-full rounded-full transition-all duration-300 ${competency.gap > 1.0
                ? 'bg-critical'
                : competency.gap > 0
                  ? 'bg-warning'
                  : 'bg-success'
                }`}
              style={{ width: `${currentPct}%` }}
              title={`Current Level: ${competency.currentLevel}`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-text-muted">
            <span>Current ({competency.currentLevel})</span>
            <span>Target ({competency.requiredLevel})</span>
          </div>
        </div>

        {/* Confidence & Last Assessed Meta */}
        <div className="flex items-center justify-between text-[11px] text-text-muted pb-3 border-b border-border-light">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal" />
            Confidence: <strong className="text-text-secondary font-medium">{competency.confidence}</strong>
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-text-muted" />
            {competency.lastAssessed}
          </span>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 flex items-center justify-end">
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          onClick={() => onViewDetails(competency)}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}
