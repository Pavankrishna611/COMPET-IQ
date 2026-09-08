'use client';

import React from 'react';
import { EmergingSkillItem } from '@/data/workforceInsights';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, TrendingUp, Zap, ShieldCheck } from 'lucide-react';

interface EmergingSkillsDemandProps {
  skills: EmergingSkillItem[];
}

export function EmergingSkillsDemand({ skills }: EmergingSkillsDemandProps) {
  const getTrendBadge = (trend: EmergingSkillItem['trend']) => {
    switch (trend) {
      case 'High Demand':
        return <Badge variant="critical" size="sm">High Demand</Badge>;
      case 'Growing':
        return <Badge variant="warning" size="sm">Growing Rapidly</Badge>;
      case 'Emerging':
      default:
        return <Badge variant="ai" size="sm">Emerging Wave</Badge>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Emerging Competency Demand
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Forward-looking digital and computational competencies essential for next-generation statistical surveys
          </p>
        </div>
        <span className="text-xs font-mono text-text-muted">
          Future MoSPI Capabilities
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((item) => (
          <div
            key={item.skill}
            className="p-4 bg-surface-raised border border-border rounded-xl space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                  {item.domain}
                </span>
                {getTrendBadge(item.trend)}
              </div>

              <h4 className="text-sm font-bold text-text-primary leading-tight">
                {item.skill}
              </h4>

              <p className="text-xs text-text-secondary leading-relaxed">
                {item.strategicNeed}
              </p>
            </div>

            {/* Readiness vs Future Importance */}
            <div className="space-y-2 pt-2 border-t border-border-light text-xs font-mono">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Current Cadre Readiness:</span>
                  <strong className={item.readiness < 40 ? 'text-rose-600' : 'text-text-primary'}>
                    {item.readiness}%
                  </strong>
                </div>
                <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.readiness < 40 ? 'bg-rose-500' : 'bg-primary'}`}
                    style={{ width: `${item.readiness}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Future Strategic Weight:</span>
                  <strong className="text-teal font-bold">{item.futureImportance}%</strong>
                </div>
                <div className="w-full bg-border-light rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal"
                    style={{ width: `${item.futureImportance}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
