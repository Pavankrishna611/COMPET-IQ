'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { detailedPriorityGaps, DetailedPriorityGap } from '@/data/skillGaps';
import { ArrowRight, AlertTriangle, Briefcase, BookOpen, Layers } from 'lucide-react';

export function PriorityGapDetailedCard({ gap }: { gap: DetailedPriorityGap }) {
  const isCritical = gap.priority === 'CRITICAL';
  const currentPct = (gap.currentLevel / 5) * 100;
  const requiredPct = (gap.requiredLevel / 5) * 100;

  return (
    <Card className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover bg-surface">
      <div>
        {/* Header: Priority & Impact */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={isCritical ? 'critical' : 'warning'} size="sm" withDot>
            {gap.priority} PRIORITY
          </Badge>
          <span className="text-[11px] font-semibold text-text-muted">
            Cadre Impact: <strong className="text-text-primary">{gap.impact}</strong>
          </span>
        </div>

        {/* Competency Name */}
        <h3 className="text-base font-bold text-text-primary mb-2">
          {gap.competency}
        </h3>

        {/* Level Stats Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F8FC] border border-border-light rounded-btn mb-3.5 text-center">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Current
            </span>
            <span className="text-sm font-bold text-text-primary font-mono">
              {gap.currentLevel.toFixed(1)} / 5
            </span>
          </div>
          <div className="border-x border-border-light">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Required
            </span>
            <span className="text-sm font-bold text-primary font-mono">
              {gap.requiredLevel.toFixed(1)} / 5
            </span>
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Gap
            </span>
            <span
              className={`text-sm font-bold font-mono ${isCritical ? 'text-critical' : 'text-warning'
                }`}
            >
              -{gap.gap.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Visual Benchmark Bar */}
        <div className="space-y-1 mb-4">
          <div className="relative w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-primary/25"
              style={{ width: `${requiredPct}%` }}
            />
            <div
              className={`h-full rounded-full ${isCritical ? 'bg-critical' : 'bg-warning'
                }`}
              style={{ width: `${currentPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>Current ({gap.currentLevel})</span>
            <span>Target ({gap.requiredLevel})</span>
          </div>
        </div>

        {/* Why this matters */}
        <div className="p-3 bg-[#F8FAFC] border border-border-light rounded-btn mb-3.5">
          <span className="text-[11px] font-bold text-text-primary block mb-1">
            Why This Matters
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">
            {gap.whyMatters}
          </p>
        </div>

        {/* Affected Work */}
        <div className="mb-3">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-text-muted" />
            Affected Workflows
          </span>
          <div className="flex flex-wrap gap-1.5">
            {gap.affectedWork.map((item) => (
              <Badge key={item} variant="neutral" size="sm">
                {item}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recommended Learning */}
        <div className="mb-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-teal" />
            Recommended Curriculum
          </span>
          <div className="flex flex-wrap gap-1.5">
            {gap.recommendedLearning.map((item) => (
              <span
                key={item}
                className="text-[11px] font-medium bg-teal-light/40 text-teal-dark px-2 py-0.5 rounded border border-teal/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border-light">
        <Link href={gap.ctaHref} className="w-full block">
          <Button
            size="sm"
            variant="primary"
            className="w-full"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {gap.ctaText}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function PriorityGapsSection() {
  return (
    <div className="space-y-3.5">
      <div>
        <h2 className="text-base sm:text-lg font-bold text-text-primary">
          Priority Skill Gap Profiles
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          In-depth diagnostics on highest-impact competency deficits affecting official duties
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {detailedPriorityGaps.map((gap) => (
          <PriorityGapDetailedCard key={gap.id} gap={gap} />
        ))}
      </div>
    </div>
  );
}
