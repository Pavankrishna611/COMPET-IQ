'use client';

import React from 'react';
import { SkillGapRankingItem } from '@/data/adminSkillGaps';
import { Badge } from '@/components/ui/Badge';
import { Award, AlertTriangle, Users } from 'lucide-react';

interface SkillGapRankingProps {
  rankings: SkillGapRankingItem[];
}

export function SkillGapRanking({ rankings }: SkillGapRankingProps) {
  const getPriorityBadge = (priority: SkillGapRankingItem['priority']) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="critical" size="sm">Critical Deficit</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      case 'Moderate':
      default:
        return <Badge variant="info" size="sm">Moderate</Badge>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Highest Priority Competency Gaps
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Ranked organizational competency deficits by workforce severity and affected cadre size
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted">
          Ranked 1 to {rankings.length}
        </span>
      </div>

      {/* Ranked Skill Cards */}
      <div className="space-y-4">
        {rankings.map((item) => (
          <div
            key={item.skill}
            className="p-4 bg-surface-raised border border-border rounded-xl space-y-2.5 hover:border-primary/40 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  {item.rank}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {item.skill}
                  </h4>
                  <span className="text-[11px] text-text-muted">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1 text-xs text-text-secondary font-mono bg-surface px-2.5 py-1 rounded-lg border border-border">
                  <Users className="w-3.5 h-3.5 text-text-muted" />
                  <strong>{item.affectedOfficials.toLocaleString()}</strong> officials
                </span>
                {getPriorityBadge(item.priority)}
              </div>
            </div>

            {/* Dual Comparison Bars */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary">
                  Current: <strong className="text-text-primary">{item.currentProficiency}%</strong>
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Deficit Gap: {item.gap}%
                </span>
                <span className="text-teal font-medium">
                  Target: {item.requiredProficiency}%
                </span>
              </div>

              <div className="w-full bg-border-light rounded-full h-3 overflow-hidden relative">
                {/* Target milestone bar (translucent) */}
                <div
                  className="h-full bg-teal/25 absolute left-0 top-0"
                  style={{ width: `${item.requiredProficiency}%` }}
                />
                {/* Current level bar */}
                <div
                  className={`h-full rounded-full relative z-10 transition-all ${
                    item.priority === 'Critical'
                      ? 'bg-rose-500'
                      : item.priority === 'High'
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${item.currentProficiency}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
