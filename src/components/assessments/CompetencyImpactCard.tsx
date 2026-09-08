'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface CompetencyImpactCardProps {
  competency: string;
  before: number;
  after: number;
  improvement: number;
  explanation: string;
}

export function CompetencyImpactCard({
  competency,
  before,
  after,
  improvement,
  explanation,
}: CompetencyImpactCardProps) {
  const beforePercent = Math.round((before / 5) * 100);
  const afterPercent = Math.round((after / 5) * 100);

  return (
    <Card className="p-6 border-border bg-gradient-to-br from-surface via-surface to-primary-light/20 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-light text-teal flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Cadre Progression
            </span>
            <h3 className="text-base font-bold text-text-primary">
              Competency Impact
            </h3>
          </div>
        </div>

        <Badge variant="teal" size="sm" className="font-mono font-bold">
          +{improvement.toFixed(1)} Cadre Gain
        </Badge>
      </div>

      {/* Target Competency Banner */}
      <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-xl border border-border">
        <span className="text-xs font-bold text-text-primary">{competency}</span>
        <span className="text-xs font-mono text-text-secondary">Level Scale: 1.0 – 5.0</span>
      </div>

      {/* Before vs After Visual Delta */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        {/* Before */}
        <div className="p-3.5 bg-surface rounded-xl border border-border text-center space-y-1">
          <span className="text-[10px] font-semibold text-text-muted uppercase block">
            Before Assessment
          </span>
          <div className="text-xl font-bold font-mono text-text-secondary">
            {before.toFixed(1)} <span className="text-xs font-normal text-text-muted">/ 5</span>
          </div>
          <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-text-muted h-full rounded-full transition-all duration-700"
              style={{ width: `${beforePercent}%` }}
            />
          </div>
        </div>

        {/* Transition arrow & gain */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-2 rounded-full bg-teal-light text-teal mb-1">
            <ArrowRight className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold font-mono text-teal">
            +{improvement.toFixed(1)} Points
          </span>
          <span className="text-[10px] text-text-muted">Verified Jump</span>
        </div>

        {/* After */}
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-center space-y-1 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
            After Assessment
          </span>
          <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {after.toFixed(1)} <span className="text-xs font-normal text-emerald-600/70">/ 5</span>
          </div>
          <div className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${afterPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-text-secondary leading-relaxed bg-surface-elevated/70 p-3 rounded-xl border border-border-light flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>{explanation}</span>
      </p>
    </Card>
  );
}
