'use client';

import React from 'react';
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
import { AlertTriangle, Sparkles } from 'lucide-react';

export default function AISkillGapAnalysisPage() {
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
        </div>

        {/* 1. ROLE CONTEXT SECTION */}
        <RoleContextCard />

        {/* 2. SKILL GAP SUMMARY (4 Metric Cards) */}
        <SkillGapSummary />

        {/* 3. CURRENT VS REQUIRED COMPARISON CHART */}
        <CurrentVsRequiredChart />

        {/* 4. SKILL GAP MATRIX TABLE */}
        <SkillGapMatrixTable />

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
