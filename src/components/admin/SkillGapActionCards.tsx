'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SkillGapRecommendation } from '@/data/adminSkillGaps';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Users, TrendingUp, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SkillGapActionCardsProps {
  recommendations: SkillGapRecommendation[];
}

export function SkillGapActionCards({ recommendations }: SkillGapActionCardsProps) {
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>({});

  const handleAction = (id: string) => {
    setActiveActions((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setActiveActions((prev) => ({ ...prev, [id]: false }));
    }, 4000);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Targeted Skill Gap Intervention Recommendations
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            High-impact administrative actions formulated to resolve cadre competency deficits
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted">
          {recommendations.length} Actionable Tracks
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((rec) => {
          const isTriggered = activeActions[rec.id];

          return (
            <div
              key={rec.id}
              className="bg-surface-raised border border-border rounded-xl p-4 flex flex-col justify-between space-y-3 hover:shadow-sm hover:border-primary/40 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <Badge
                    variant={
                      rec.impactLevel === 'Critical'
                        ? 'critical'
                        : rec.impactLevel === 'High'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  >
                    {rec.impactLevel} Priority
                  </Badge>
                  <span className="text-[10px] font-mono text-text-muted">
                    {rec.category}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-text-primary leading-snug">
                  {rec.title}
                </h4>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {rec.recommendation}
                </p>

                <div className="pt-2 border-t border-border-light text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted flex items-center gap-1">
                      <Users className="w-3 h-3" /> Affected Cadre:
                    </span>
                    <strong className="text-text-primary">
                      {rec.affectedOfficials.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-teal" /> Potential Uplift:
                    </span>
                    <strong className="text-teal font-bold">
                      {rec.expectedImprovement}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {isTriggered ? (
                  <div className="p-2 bg-teal-light text-teal border border-teal/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Plan Initiated
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction(rec.id)}
                    className="w-full text-xs gap-1.5 justify-center font-semibold"
                  >
                    {rec.ctaText}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
