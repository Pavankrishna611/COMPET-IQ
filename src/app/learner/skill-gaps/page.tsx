'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import {
  RoleContextCard,
  SkillGapSummary,
  CurrentVsRequiredChart,
  SkillGapMatrixTable,
  PriorityGapsSection,
  WhyGapMattersInteractive,
  AIInsightAndForecast,
  SkillGapsCTA,
} from '@/components/skill-gaps';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { skillGapService } from '@/services';
import type { SkillGapAnalysisResponse, SkillGapItem } from '@/types/api';

export default function AISkillGapAnalysisPage() {
  const { user } = useAuth();
  const [skillGapsData, setSkillGapsData] = useState<SkillGapAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchGaps = async (refresh: boolean = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      const data = await skillGapService.getMySkillGaps();
      setSkillGapsData(data);
    } catch (err) {
      console.warn('Using fallback skill gap data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

  // Map dynamic stats if available
  const summaryStats = skillGapsData?.summary
    ? [
        {
          id: '1',
          title: 'Competencies Assessed',
          count: skillGapsData.summary.total_competencies,
          description: 'Official statistical cadre framework',
          accent: 'success' as const,
        },
        {
          id: '2',
          title: 'Meets or Exceeds',
          count: skillGapsData.summary.strong_competencies,
          description: 'At or above role benchmark',
          accent: 'teal' as const,
        },
        {
          id: '3',
          title: 'Skill Gaps Identified',
          count:
            skillGapsData.summary.critical_gaps +
            skillGapsData.summary.high_priority_gaps +
            skillGapsData.summary.moderate_gaps,
          description: 'Opportunities for progression',
          accent: 'warning' as const,
        },
        {
          id: '4',
          title: 'Critical Deficits',
          count: skillGapsData.summary.critical_gaps,
          description: 'High priority training required',
          accent: 'critical' as const,
        },
      ]
    : undefined;

  // Map chart data if available
  const chartData = skillGapsData?.skill_gaps?.length
    ? skillGapsData.skill_gaps.map((g: SkillGapItem) => ({
        skill: g.competency_name,
        current: g.current_level,
        required: g.required_level,
        gap: g.gap,
        category: g.domain || 'Statistical Methodology',
      }))
    : undefined;

  // Map matrix table items if available
  const matrixItems = skillGapsData?.skill_gaps?.length
    ? skillGapsData.skill_gaps.map((g: SkillGapItem) => ({
        id: g.competency_id,
        competency: g.competency_name,
        domain: g.domain || 'Official Statistics',
        currentLevel: g.current_level,
        requiredLevel: g.required_level,
        gap: g.gap,
        priority: (g.priority === 'CRITICAL'
          ? 'CRITICAL'
          : g.priority === 'HIGH'
          ? 'HIGH'
          : 'MODERATE') as 'CRITICAL' | 'HIGH' | 'MODERATE',
        recommendedAction: g.gap > 0 ? (g.recommended_action || 'Course Recommendation') : 'Maintain Proficiency',
        actionHref: '/learner/learning-path',
      }))
    : undefined;

  return (
    <AppShell
      title="AI Skill Gap Analysis"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'AI Skill Gap Analysis' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-6 lg:space-y-8 pb-12">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="ai" size="sm" withDot>
                <Sparkles className="w-3 h-3 text-ai-purple mr-1 inline" />
                AI-Driven Diagnostics
              </Badge>
              <span className="text-[11px] text-text-muted">
                Role Standard Benchmarking
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              AI Skill Gap Analysis
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Competency gaps identified by comparing your current professional profile with the requirements of your role.
            </p>
          </div>

          <button
            onClick={() => fetchGaps(true)}
            disabled={isRefreshing}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface border border-border rounded-btn hover:text-text-primary hover:bg-neutral-light transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </button>
        </div>

        {/* 1. ROLE CONTEXT SECTION */}
        <RoleContextCard
          roleTitle={user?.designation || (user?.role ? `${user.role} Officer` : undefined)}
          departmentName={user?.department}
        />

        {/* 2. SKILL GAP SUMMARY (4 Metric Cards) */}
        <SkillGapSummary stats={summaryStats} />

        {/* 3. CURRENT VS REQUIRED COMPARISON CHART */}
        <CurrentVsRequiredChart data={chartData} />

        {/* 4. SKILL GAP MATRIX TABLE */}
        <SkillGapMatrixTable data={matrixItems} />

        {/* 5. PRIORITY SKILL GAP CARDS */}
        <PriorityGapsSection />

        {/* 6. WHY THIS GAP MATTERS (INTERACTIVE) */}
        <WhyGapMattersInteractive />

        {/* 7. AI INSIGHT & GROWTH FORECAST */}
        <AIInsightAndForecast />

        {/* 8. PRIMARY CALL TO ACTION BANNER */}
        <SkillGapsCTA />
      </div>
    </AppShell>
  );
}
