'use client';

import React from 'react';
import { StatCard } from '@/components/domain/StatCard';
import { skillGapSummaryStats } from '@/data/skillGaps';
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

export function SkillGapSummary({ stats }: { stats?: typeof skillGapSummaryStats }) {
  const displayStats = stats && stats.length > 0 ? stats : skillGapSummaryStats;
  const getIcon = (accent: string) => {
    switch (accent) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'teal':
        return <TrendingUp className="w-5 h-5" />;
      case 'success':
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat) => (
        <StatCard
          key={stat.id}
          title={stat.title}
          value={stat.count}
          subtitle={stat.description}
          accent={
            stat.accent === 'critical'
              ? 'critical'
              : stat.accent === 'warning'
              ? 'warning'
              : stat.accent === 'teal'
              ? 'teal'
              : 'blue'
          }
          icon={getIcon(stat.accent)}
          className="transition-all duration-200 hover:shadow-card-hover"
        />
      ))}
    </div>
  );
}
