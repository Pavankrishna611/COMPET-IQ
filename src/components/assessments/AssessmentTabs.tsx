'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';

export type AssessmentTabKey = 'all' | 'available' | 'in_progress' | 'completed';

interface AssessmentTabsProps {
  activeTab: AssessmentTabKey;
  onTabChange: (tab: AssessmentTabKey) => void;
  counts: {
    all: number;
    available: number;
    in_progress: number;
    completed: number;
  };
}

export function AssessmentTabs({
  activeTab,
  onTabChange,
  counts,
}: AssessmentTabsProps) {
  const tabs: { key: AssessmentTabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All Assessments', count: counts.all },
    { key: 'available', label: 'Available', count: counts.available },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { key: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex border-b border-border-light overflow-x-auto scrollbar-none gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px outline-none ${
              isActive
                ? 'border-primary text-primary dark:text-primary-light font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                isActive
                  ? 'bg-primary text-white font-bold'
                  : 'bg-surface-elevated text-text-muted border border-border-light'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
