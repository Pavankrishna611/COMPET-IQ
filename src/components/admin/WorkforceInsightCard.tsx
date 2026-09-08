'use client';

import React from 'react';
import Link from 'next/link';
import { WorkforceInsightItem } from '@/data/adminDashboard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight, Building2, TrendingUp, CheckCircle2 } from 'lucide-react';

interface WorkforceInsightCardProps {
  insight: WorkforceInsightItem;
}

export function WorkforceInsightCard({ insight }: WorkforceInsightCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant={insight.badgeVariant} size="sm" className="font-semibold">
            {insight.badgeText}
          </Badge>
          <span className="text-[10px] font-mono text-text-muted">
            {insight.impactOrTrend}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h4 className="text-base font-bold text-text-primary leading-snug">
            {insight.title}
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed mt-1.5">
            {insight.description}
          </p>
        </div>

        {/* Affected Departments */}
        <div className="space-y-1 pt-2 border-t border-border-light text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <Building2 className="w-3 h-3 text-primary" />
            Affected Departments
          </span>
          <div className="flex flex-wrap gap-1">
            {insight.affectedDepartments.map((dept) => (
              <span
                key={dept}
                className="text-[10px] font-medium bg-surface-elevated text-text-secondary px-2 py-0.5 rounded-md border border-border-light"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Action */}
        <div className="p-3 bg-primary-light/40 border border-primary/20 rounded-xl text-xs space-y-1">
          <span className="font-bold text-[10px] uppercase tracking-wider text-primary block">
            Recommended Strategic Action
          </span>
          <p className="text-text-secondary leading-snug">
            {insight.recommendedAction}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <Link href={insight.actionUrl}>
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="w-full justify-center text-xs font-semibold"
          >
            {insight.actionButtonText}
          </Button>
        </Link>
      </div>
    </div>
  );
}
