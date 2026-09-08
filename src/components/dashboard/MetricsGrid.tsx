'use client';

import React from 'react';
import { StatCard } from '@/components/domain/StatCard';
import { TrendingUp, AlertTriangle, Clock, GraduationCap } from 'lucide-react';
import { learnerKeyMetrics } from '@/data/dashboard';

export function MetricsGrid() {
  const getIcon = (name: string) => {
    switch (name) {
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5" />;
      case 'AlertTriangle':
        return <AlertTriangle className="w-5 h-5" />;
      case 'Clock':
        return <Clock className="w-5 h-5" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {learnerKeyMetrics.map((metric) => (
        <StatCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          trend={metric.trend}
          icon={getIcon(metric.iconName)}
          accent={metric.accent}
          className="transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover"
        />
      ))}
    </div>
  );
}
