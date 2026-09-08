'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import {
  WorkforceInsightHero,
  EmergingSkillsDemand,
  FutureDemandChart,
  StrategicRecommendationsList,
  InsightDetailModal,
  ReportGenerationModal,
} from '@/components/admin';
import {
  mockInsightSummary,
  mockFeaturedHeroInsight,
  mockDetailedInsights,
  mockEmergingSkills,
  mockFutureDemandProjections,
  mockStrategicRecommendations,
  DetailedInsightItem,
} from '@/data/workforceInsights';

export default function AdminInsightsPage() {
  // Modal states
  const [selectedInsight, setSelectedInsight] = useState<DetailedInsightItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filters for insights
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredInsights = useMemo(() => {
    return mockDetailedInsights.filter((item) => {
      if (filterPriority !== 'All' && item.priority !== filterPriority) {
        return false;
      }
      if (filterCategory !== 'All' && item.category !== filterCategory) {
        return false;
      }
      if (filterStatus !== 'All' && item.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [filterPriority, filterCategory, filterStatus]);

  const isFilterActive =
    filterPriority !== 'All' || filterCategory !== 'All' || filterStatus !== 'All';

  const handleResetFilters = () => {
    setFilterPriority('All');
    setFilterCategory('All');
    setFilterStatus('All');
  };

  return (
    <AppShell
      title="COMPETIQ Workforce Insights"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Administration' },
        { label: 'AI Workforce Insights' },
      ]}
      defaultRole="admin"
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-ai-purple text-white">
                <BrainCircuit className="w-3.5 h-3.5" />
                Strategic AI Observation Engine
              </span>
              <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2.5 py-0.5 rounded-full border border-border flex items-center gap-1">
                <Info className="w-3 h-3 text-text-muted" />
                Demo Analytics
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              COMPETIQ Workforce Insights
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              AI-assisted workforce observations, predictive competency trends, and strategic development recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsReportModalOpen(true)}
              className="gap-2 text-xs font-semibold shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Generate Workforce Report
            </Button>
          </div>
        </div>

        {/* 1. Insight Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Critical Insights"
            value={mockInsightSummary.criticalInsights}
            subtitle="Immediate cadre risk"
            accent="critical"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: 'Priority review needed', direction: 'down' }}
          />

          <StatCard
            title="High Priority"
            value={mockInsightSummary.highPriority}
            subtitle="Institutional deficit patterns"
            accent="warning"
            icon={<BrainCircuit className="w-5 h-5" />}
            trend={{ value: 'Multi-wing coverage', direction: 'neutral' }}
          />

          <StatCard
            title="Emerging Trends"
            value={mockInsightSummary.emergingTrends}
            subtitle="Accelerating technology demand"
            accent="ai"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: '+34% YoY shift', direction: 'up' }}
          />

          <StatCard
            title="Recommended Actions"
            value={mockInsightSummary.recommendedActions}
            subtitle="Prescriptive intervention plans"
            accent="teal"
            icon={<CheckCircle2 className="w-5 h-5" />}
            trend={{ value: '4 ready to deploy', direction: 'up' }}
          />
        </div>

        {/* 2. Featured Large Hero Insight Card */}
        <WorkforceInsightHero
          hero={mockFeaturedHeroInsight}
          onCreateRecommendation={() => setIsReportModalOpen(true)}
        />

        {/* 7. Insight Filter Bar */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Insight Horizon &amp; Domain Filters
              </span>
              <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded-full border border-border">
                {filteredInsights.length} Observations Matched
              </span>
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                Priority Level
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                Insight Domain
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="All">All Domains</option>
                <option value="Skill Gap">Skill Gap Deficits</option>
                <option value="Emerging Trend">Emerging Trends</option>
                <option value="Learning Analytics">Learning Analytics</option>
                <option value="Workforce Risk">Workforce Cadre Risk</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                Directive Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New Directives</option>
                <option value="Reviewed">Reviewed</option>
                <option value="Action Planned">Action Planned</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Workforce Insight Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((insight) => (
            <div
              key={insight.id}
              onClick={() => setSelectedInsight(insight)}
              className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-ai-purple bg-ai-light px-2.5 py-0.5 rounded-full border border-ai-purple/20">
                    {insight.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-text-muted">
                      Confidence: {insight.confidenceScore}%
                    </span>
                    <Badge
                      variant={
                        insight.priority === 'Critical'
                          ? 'critical'
                          : insight.priority === 'High'
                          ? 'warning'
                          : 'info'
                      }
                      size="sm"
                    >
                      {insight.priority}
                    </Badge>
                  </div>
                </div>

                <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors leading-snug">
                  {insight.title}
                </h4>

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {insight.description}
                </p>

                <div className="pt-2 border-t border-border-light text-xs font-mono flex items-center justify-between text-text-secondary">
                  <span className="text-primary font-bold">{insight.trendOrRisk}</span>
                  <span className="text-teal font-semibold">{insight.impactMetric}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border-light flex items-center justify-between text-xs text-primary font-semibold">
                <span>{insight.actionText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* 4. Emerging Skills Section */}
        <EmergingSkillsDemand skills={mockEmergingSkills} />

        {/* 5. Future Workforce Demand Forecast */}
        <FutureDemandChart data={mockFutureDemandProjections} />

        {/* 6. Strategic Recommendations */}
        <StrategicRecommendationsList
          initialRecommendations={mockStrategicRecommendations}
        />

        {/* 8. Insight Detail Inspection Modal */}
        <InsightDetailModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />

        {/* 9. Generate Workforce Report Modal */}
        <ReportGenerationModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
