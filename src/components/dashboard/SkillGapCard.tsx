'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PrioritySkillGapItem, prioritySkillGaps } from '@/data/dashboard';
import { ArrowRight, AlertTriangle, TrendingDown } from 'lucide-react';

export interface DashboardSkillGapCardProps {
  gapItem: PrioritySkillGapItem;
}

export function DashboardSkillGapCard({ gapItem }: DashboardSkillGapCardProps) {
  const isCritical = gapItem.priority === 'CRITICAL';
  const currentPct = (gapItem.currentLevel / 5) * 100;
  const requiredPct = (gapItem.requiredLevel / 5) * 100;

  return (
    <Card className="p-5 flex flex-col justify-between transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover border-border">
      <div>
        {/* Top Priority Badge & Domain */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant={isCritical ? 'critical' : 'warning'}
            size="sm"
            withDot
          >
            {gapItem.priority} PRIORITY
          </Badge>
          <span className="text-[11px] font-medium text-text-muted">
            {gapItem.domain}
          </span>
        </div>

        {/* Skill Name */}
        <h3 className="text-base font-bold text-text-primary mb-2">
          {gapItem.skillName}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-secondary leading-relaxed mb-4">
          {gapItem.description}
        </p>

        {/* Level Differential Numerical Metric Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F5F8FC] border border-border-light rounded-btn mb-4 text-center">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Current
            </span>
            <span className="text-sm font-bold text-text-primary font-mono">
              {gapItem.currentLevel.toFixed(1)} / 5
            </span>
          </div>

          <div className="border-x border-border-light">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Required
            </span>
            <span className="text-sm font-bold text-primary font-mono">
              {gapItem.requiredLevel.toFixed(1)} / 5
            </span>
          </div>

          <div>
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-0.5">
              Gap Delta
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                isCritical ? 'text-critical' : 'text-warning'
              }`}
            >
              -{gapItem.gap.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Visual Progress Comparison Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-text-muted">Competency Benchmark Attainment</span>
            <span className="font-semibold text-text-secondary">
              {Math.round(currentPct)}% of L5
            </span>
          </div>

          {/* Dual bar: current fill vs required marker */}
          <div className="relative w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            {/* Required Level target marker / background indicator */}
            <div
              className="absolute top-0 bottom-0 bg-primary/20"
              style={{ width: `${requiredPct}%` }}
              title={`Required Level: ${gapItem.requiredLevel} (${requiredPct}%)`}
            />
            {/* Current Level fill */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? 'bg-critical' : 'bg-warning'
              }`}
              style={{ width: `${currentPct}%` }}
              title={`Current Level: ${gapItem.currentLevel} (${currentPct}%)`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCritical ? 'bg-critical' : 'bg-warning'
                }`}
              />
              Current ({gapItem.currentLevel})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Target ({gapItem.requiredLevel})
            </span>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-border-light flex items-center justify-between">
        <span className="text-[11px] text-text-muted flex items-center gap-1">
          <TrendingDown className="w-3.5 h-3.5 text-text-muted" />
          Requires Intervention
        </span>

        <Link href="/learner/skill-gaps">
          <Button
            size="sm"
            variant="secondary"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Gap
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function SkillGapsSection() {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            AI-Identified Skill Gaps
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Competencies requiring focused development based on your current role.
          </p>
        </div>

        <Link href="/learner/skill-gaps">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            View All Skill Gaps
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prioritySkillGaps.map((gap: PrioritySkillGapItem) => (
          <DashboardSkillGapCard key={gap.id} gapItem={gap} />
        ))}
      </div>
    </div>
  );
}
