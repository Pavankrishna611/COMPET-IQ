'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/domain/StatCard';
import {
  Users,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building2,
  ShieldCheck,
  BrainCircuit,
  Info,
} from 'lucide-react';
import {
  AdminGlobalFilters,
  AdminFiltersState,
  CompetencyDistributionChart,
  DepartmentComparisonChart,
  LearningCompletionChart,
  DepartmentSkillHealthTable,
  TopSkillGapsList,
  WorkforceInsightCard,
  PriorityAlertsPanel,
  CompetencyTrendChart,
  AdminQuickActions,
} from '@/components/admin';
import {
  mockDepartmentHealth,
  mockTopSkillGaps,
  mockWorkforceInsights,
  mockPriorityAlerts,
  mockCompetencyDistribution,
  mockCompetencyTrend,
  mockLearningEngagement,
  DepartmentSkillHealthItem,
} from '@/data/adminDashboard';

const DEFAULT_FILTERS: AdminFiltersState = {
  dateRange: '180d',
  department: 'All Departments',
  role: 'All Roles',
};

import { useEffect } from 'react';
import { analyticsService } from '@/services';
import type { DashboardAnalyticsResponse } from '@/types/api';

export default function AdminDashboardPage() {
  const [filters, setFilters] = useState<AdminFiltersState>(DEFAULT_FILTERS);
  const [apiAnalytics, setApiAnalytics] = useState<DashboardAnalyticsResponse | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsService.getDashboardAnalytics();
        setApiAnalytics(data);
      } catch (err) {
        console.warn('Using fallback admin dashboard analytics:', err);
      }
    };

    fetchAnalytics();
  }, []);

  // Compute filtered department health items
  const filteredDepartments: DepartmentSkillHealthItem[] = useMemo(() => {
    const baseList: DepartmentSkillHealthItem[] = apiAnalytics?.department_health && apiAnalytics.department_health.length > 0
      ? apiAnalytics.department_health.map((d, idx) => ({
          id: d.department_id || `dept-${idx}`,
          department: d.department,
          officials: d.total_officers || 40,
          averageCompetency: Math.round(d.average_competency),
          criticalGaps: Math.round(d.critical_gaps),
          trainingCompletion: Math.round(d.assessed_pct),
          status: d.average_competency >= 75 ? ('Strong' as const) : d.average_competency >= 65 ? ('Good' as const) : ('Needs Attention' as const),
        }))
      : mockDepartmentHealth;

    if (filters.department === 'All Departments') {
      return baseList;
    }
    return baseList.filter(
      (dept) => dept.department.toLowerCase() === filters.department.toLowerCase()
    );
  }, [filters.department, apiAnalytics]);

  // Dynamic metrics based on selected department or global view
  const activeMetrics = useMemo(() => {
    if (filters.department !== 'All Departments') {
      const targetDept = mockDepartmentHealth.find(
        (d) => d.department.toLowerCase() === filters.department.toLowerCase()
      );
      if (targetDept) {
        const learnersEstimate = Math.round(
          targetDept.officials * (targetDept.trainingCompletion / 100)
        );
        return {
          officials: targetDept.officials.toLocaleString(),
          officialsSub: `Assigned to ${targetDept.department}`,
          activeLearners: learnersEstimate.toLocaleString(),
          learnersSub: `${targetDept.trainingCompletion}% department engagement`,
          avgCompetency: `${targetDept.averageCompetency}%`,
          avgSub: `Cadre average for ${targetDept.department}`,
          criticalGap: `${targetDept.criticalGaps}%`,
          criticalGapSub: `Officials below target threshold`,
          completion: `${targetDept.trainingCompletion}%`,
          completionSub: `Assigned modules completed`,
        };
      }
    }

    // Role adjustments for global overview
    const roleMultiplier =
      filters.role === 'Statistical Investigator'
        ? 0.42
        : filters.role === 'Statistical Officer'
        ? 0.28
        : filters.role === 'Senior Statistical Officer'
        ? 0.16
        : filters.role === 'Data Analyst'
        ? 0.09
        : filters.role === 'Training Officer'
        ? 0.05
        : 1.0;

    const baseOfficials = apiAnalytics
      ? Math.round(apiAnalytics.total_officers * roleMultiplier)
      : Math.round(12540 * roleMultiplier);
    const baseLearners = apiAnalytics
      ? Math.round(apiAnalytics.active_learners * roleMultiplier)
      : Math.round(8231 * roleMultiplier);

    return {
      officials: baseOfficials.toLocaleString(),
      officialsSub:
        filters.role === 'All Roles'
          ? (apiAnalytics ? `${apiAnalytics.total_officers} registered officials` : 'Across 6 departments')
          : `Active in ${filters.role} cadre`,
      activeLearners: baseLearners.toLocaleString(),
      learnersSub: '65.6% workforce engagement',
      avgCompetency: apiAnalytics ? `${Math.round(apiAnalytics.average_competency_score)}%` : '72%',
      avgSub: 'Across competency framework',
      criticalGap: apiAnalytics ? `${Math.round(apiAnalytics.critical_skill_gaps)}%` : '18%',
      criticalGapSub: 'Officials below required competency',
      completion: apiAnalytics ? `${Math.round(apiAnalytics.learning_completion_rate)}%` : '76%',
      completionSub: 'Assigned learning completed',
    };
  }, [filters.department, filters.role, apiAnalytics]);

  // Adjust skill gaps based on selected department or role
  const filteredSkillGaps = useMemo(() => {
    if (filters.department === 'All Departments') {
      return mockTopSkillGaps;
    }
    // Boost relevance of GIS for Geographic, Python for Economic, etc.
    if (filters.department === 'Geographic Statistics') {
      return [...mockTopSkillGaps].sort((a, b) => (a.name === 'GIS' ? -1 : 1));
    }
    if (filters.department === 'Economic Statistics') {
      return [...mockTopSkillGaps].sort((a, b) =>
        a.name === 'Advanced SQL' || a.name === 'Python' ? -1 : 1
      );
    }
    return mockTopSkillGaps;
  }, [filters.department]);

  // Adjust trend data for date range
  const trendData = useMemo(() => {
    if (filters.dateRange === '30d') {
      return mockCompetencyTrend.slice(-2);
    }
    if (filters.dateRange === '90d') {
      return mockCompetencyTrend.slice(-3);
    }
    return mockCompetencyTrend;
  }, [filters.dateRange]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <AppShell
      title="Workforce Intelligence"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Administration' },
        { label: 'Workforce Intelligence' },
      ]}
      defaultRole="admin"
    >
      <div className="space-y-6 pb-12">
        {/* ========================================================================= */}
        {/* 1. ADMIN WELCOME SECTION                                                  */}
        {/* ========================================================================= */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-primary-light/40 to-transparent pointer-events-none -z-0" />

          {/* Left Title & Context */}
          <div className="relative z-10 space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                Apex Admin Console
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded-full border border-border">
                <Calendar className="w-3 h-3 text-text-muted" />
                Last updated: Today
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Workforce Intelligence Overview
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Monitor organizational competency, identify critical skill gaps and optimize workforce development across all national statistical cadres.
            </p>
          </div>

          {/* Right: COMPETIQ Intelligence Status Card */}
          <div className="relative z-10 bg-surface-raised/80 border border-primary/20 rounded-xl p-4 shadow-sm backdrop-blur-sm max-w-sm w-full shrink-0 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-border-light pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-bold text-text-primary">
                  COMPETIQ Intelligence
                </span>
              </div>
              <Badge variant="teal" size="sm" withDot className="font-semibold text-[10px]">
                Analysis Complete
              </Badge>
            </div>

            <p className="text-xs text-text-secondary leading-normal">
              Workforce competency patterns have been analyzed across departments and learning activities.
            </p>

            <div className="flex items-center justify-between text-[10px] text-text-muted border-t border-border-light pt-2 font-mono">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-text-muted" />
                Demo Analytics
              </span>
              <span>v2.4 Cadre Engine</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. GLOBAL FILTERS                                                         */}
        {/* ========================================================================= */}
        <AdminGlobalFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Filter notice if filtered */}
        {(filters.department !== 'All Departments' || filters.role !== 'All Roles') && (
          <div className="flex items-center justify-between bg-primary-light/60 border border-primary/20 rounded-xl px-4 py-2.5 text-xs text-primary font-medium">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>
                Displaying intelligence filtered by:{' '}
                <strong>{filters.department}</strong>
                {filters.role !== 'All Roles' && (
                  <>
                    {' '}• Role: <strong>{filters.role}</strong>
                  </>
                )}
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs underline hover:no-underline font-semibold shrink-0 cursor-pointer"
            >
              Reset to All
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. KEY WORKFORCE METRICS (5 RESPONSIVE STAT CARDS)                        */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard
            title="Total Officials"
            value={activeMetrics.officials}
            subtitle={activeMetrics.officialsSub}
            accent="blue"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: '+4.2% active workforce', direction: 'up' }}
          />

          <StatCard
            title="Active Learners"
            value={activeMetrics.activeLearners}
            subtitle={activeMetrics.learnersSub}
            accent="teal"
            icon={<BookOpen className="w-5 h-5" />}
            trend={{ value: '+8.4% this quarter', direction: 'up' }}
          />

          <StatCard
            title="Average Competency"
            value={activeMetrics.avgCompetency}
            subtitle={activeMetrics.avgSub}
            accent="blue"
            icon={<Award className="w-5 h-5" />}
            trend={{ value: '+3.8% improvement', direction: 'up' }}
          />

          <StatCard
            title="Critical Skill Gap"
            value={activeMetrics.criticalGap}
            subtitle={activeMetrics.criticalGapSub}
            accent="critical"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: '-2.6% improvement', direction: 'down' }}
          />

          <StatCard
            title="Learning Completion"
            value={activeMetrics.completion}
            subtitle={activeMetrics.completionSub}
            accent="teal"
            icon={<CheckCircle2 className="w-5 h-5" />}
            trend={{ value: '+7.1% this quarter', direction: 'up' }}
          />
        </div>

        {/* ========================================================================= */}
        {/* 12. QUICK ACTIONS                                                         */}
        {/* ========================================================================= */}
        <AdminQuickActions />

        {/* ========================================================================= */}
        {/* 4 & 5. WORKFORCE COMPETENCY OVERVIEW & DEPARTMENT COMPARISON              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col">
            <CompetencyDistributionChart data={mockCompetencyDistribution} />
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <DepartmentComparisonChart
              departments={filteredDepartments}
              benchmark={72}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6 & 11. LEARNING COMPLETION ANALYTICS & COMPETENCY TREND                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 flex flex-col">
            <LearningCompletionChart metrics={mockLearningEngagement} />
          </div>
          <div className="lg:col-span-6 flex flex-col">
            <CompetencyTrendChart data={trendData} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7. DEPARTMENT SKILL HEALTH TABLE                                          */}
        {/* ========================================================================= */}
        <DepartmentSkillHealthTable departments={filteredDepartments} />

        {/* ========================================================================= */}
        {/* 8 & 10. TOP SKILL GAPS & PRIORITY ALERTS                                  */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col">
            <TopSkillGapsList gaps={filteredSkillGaps} />
          </div>
          <div className="lg:col-span-4 flex flex-col">
            <PriorityAlertsPanel alerts={mockPriorityAlerts} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 9. AI WORKFORCE INSIGHTS SECTION                                          */}
        {/* ========================================================================= */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-ai-purple" />
                <h3 className="text-lg font-bold text-text-primary tracking-tight">
                  COMPETIQ Workforce Insights
                </h3>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                AI-assisted observations based on workforce competency patterns.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-text-muted bg-surface-raised px-3 py-1 rounded-full border border-border flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ai-purple animate-pulse" />
                Simulated Heuristic Engine
              </span>
            </div>
          </div>

          {/* 3 Insight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mockWorkforceInsights.map((insight) => (
              <WorkforceInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
