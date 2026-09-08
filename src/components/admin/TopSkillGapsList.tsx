'use client';

import React from 'react';
import { TopSkillGapItem } from '@/data/adminDashboard';
import { Badge } from '@/components/ui/Badge';
import { Users, AlertTriangle, ArrowRight } from 'lucide-react';

interface TopSkillGapsListProps {
  gaps: TopSkillGapItem[];
}

export function TopSkillGapsList({ gaps }: TopSkillGapsListProps) {
  const getPriorityBadge = (priority: TopSkillGapItem['priority']) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="critical" size="sm">Critical Shortage</Badge>;
      case 'High':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      case 'Moderate':
      default:
        return <Badge variant="info" size="sm">Moderate</Badge>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Top Organizational Skill Gaps
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Competencies with the largest workforce-level differentials requiring strategic capacity allocation
          </p>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Ranked by Gap Deficit
        </span>
      </div>

      {/* Ranked Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {gaps.map((skill, index) => (
          <div
            key={skill.id}
            className="p-4 rounded-xl border border-border bg-surface-elevated/40 hover:border-primary/40 hover:bg-surface-elevated transition-all space-y-3"
          >
            {/* Header: Rank + Name + Priority */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md bg-[#123B66] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-text-primary truncate">
                    {skill.name}
                  </h4>
                  <span className="text-[10px] text-text-muted uppercase font-medium tracking-wider">
                    {skill.category}
                  </span>
                </div>
              </div>

              {getPriorityBadge(skill.priority)}
            </div>

            {/* Progress Bars: Current vs Required */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary font-sans">
                  Workforce Proficiency: <strong className="text-text-primary">{skill.currentProficiency}%</strong>
                </span>
                <span className="text-text-muted font-sans">
                  Target: <strong>{skill.requiredProficiency}%</strong>
                </span>
              </div>

              {/* Stacked bar visualization */}
              <div className="w-full bg-border-light rounded-full h-2 overflow-hidden relative">
                {/* Target line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                  style={{ left: `${skill.requiredProficiency}%` }}
                />
                {/* Current progress */}
                <div
                  className="h-full rounded-full transition-all duration-700 bg-primary"
                  style={{ width: `${skill.currentProficiency}%` }}
                />
              </div>
            </div>

            {/* Footer: Gap and Affected Officials */}
            <div className="pt-2 border-t border-border-light flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Users className="w-3.5 h-3.5 text-text-muted" />
                <span className="font-mono font-semibold text-text-secondary">
                  {skill.affectedOfficials.toLocaleString()} Officials Affected
                </span>
              </div>

              <div className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900 text-xs">
                Gap: -{skill.gap}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
