'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  WelcomeHero,
  MetricsGrid,
  CompetencyRadarChart,
  SkillGapsSection,
  LearningPathJourney,
  RecommendationsSection,
  ActivityTimeline,
  QuickActions,
} from '@/components/dashboard';

export default function LearnerDashboardPage() {
  return (
    <AppShell
      title="Learner Intelligence Dashboard"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Dashboard' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-6 lg:space-y-8 pb-12">
        {/* 1. WELCOME HERO SECTION */}
        <WelcomeHero />

        {/* 2. KEY METRICS */}
        <MetricsGrid />

        {/* 3. COMPETENCY OVERVIEW */}
        <CompetencyRadarChart />

        {/* 4. AI SKILL GAP ANALYSIS */}
        <SkillGapsSection />

        {/* 5. PERSONALIZED LEARNING PATH */}
        <LearningPathJourney />

        {/* 6. TOP AI RECOMMENDATIONS */}
        <RecommendationsSection />

        {/* 7 & 8. RECENT ACTIVITY + QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6">
            <ActivityTimeline />
          </div>
          <div className="lg:col-span-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
