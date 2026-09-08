'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import {
  AlertTriangle,
  Flame,
  Users,
  Percent,
  ShieldCheck,
  Building2,
  TrendingDown,
} from 'lucide-react';
import {
  SkillGapHeatmap,
  SkillGapRanking,
  SkillGapDepartmentChart,
  SkillGapTrendChart,
  SkillGapActionCards,
} from '@/components/admin';
import {
  mockSkillGapSummary,
  mockHeatmapRows,
  mockSkillGapRankings,
  mockDepartmentGapComparisons,
  mockSkillGapTrend,
  mockSkillGapRecommendations,
} from '@/data/adminSkillGaps';

export default function AdminSkillGapsPage() {
  return (
    <AppShell
      title="Organization Skill Gaps"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Administration' },
        { label: 'Organization Skill Gaps' },
      ]}
      defaultRole="admin"
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-600 text-white">
                <AlertTriangle className="w-3.5 h-3.5" />
                Deficit Surveillance
              </span>
              <span className="text-[11px] font-medium text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded-full border border-border">
                National Institutional Readiness
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Organization Skill Gaps
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Identify critical competency gaps across departments and workforce roles to steer high-impact capacity development.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-btn border border-rose-200 dark:border-rose-900/50">
              5,130 Officials in Deficit Scope
            </span>
          </div>
        </div>

        {/* 1. Skill Gap Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Critical Skills"
            value={mockSkillGapSummary.criticalSkills}
            subtitle="Deficit gap >= 25%"
            accent="critical"
            icon={<Flame className="w-5 h-5" />}
            trend={{ value: 'Immediate NSSTA focus', direction: 'down' }}
          />

          <StatCard
            title="High Priority Skills"
            value={mockSkillGapSummary.highPrioritySkills}
            subtitle="Deficit gap 20–24%"
            accent="warning"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: 'Targeted pathway needed', direction: 'neutral' }}
          />

          <StatCard
            title="Affected Officials"
            value={mockSkillGapSummary.affectedOfficials.toLocaleString()}
            subtitle="40.9% of active statistical cadre"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: 'Across all 6 wings', direction: 'neutral' }}
          />

          <StatCard
            title="Average Deficit Gap"
            value={`${mockSkillGapSummary.averageGap}%`}
            subtitle="Benchmark max target: 15%"
            accent="teal"
            icon={<Percent className="w-5 h-5" />}
            trend={{ value: '-6% reduction in 6 mos', direction: 'down' }}
          />
        </div>

        {/* 2. Skill Gap Heatmap (Visual Centerpiece) */}
        <SkillGapHeatmap data={mockHeatmapRows} />

        {/* 3. Top Skill Gap Ranking */}
        <SkillGapRanking rankings={mockSkillGapRankings} />

        {/* 4 & 5. Department Skill Gap Comparison & Skill Gap Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex flex-col">
            <SkillGapDepartmentChart data={mockDepartmentGapComparisons} />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <SkillGapTrendChart data={mockSkillGapTrend} />
          </div>
        </div>

        {/* 6. Skill Gap Recommendations Action Cards */}
        <SkillGapActionCards recommendations={mockSkillGapRecommendations} />
      </div>
    </AppShell>
  );
}
