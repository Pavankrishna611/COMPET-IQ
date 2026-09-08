'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import {
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  TrainingEngagementTrendChart,
  CourseCompletionChart,
  PopularCoursesTable,
  TrainingEffectivenessChart,
  DepartmentLearningHoursChart,
  LowEngagementAlerts,
} from '@/components/admin';
import {
  mockTrainingSummary,
  mockTrainingTrends,
  mockCourseCompletionSlices,
  mockPopularCourses,
  mockTrainingEffectiveness,
  mockDepartmentLearningHours,
  mockLowEngagementAlerts,
} from '@/data/trainingAnalytics';

export default function AdminTrainingPage() {
  return (
    <AppShell
      title="Training Analytics"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Administration' },
        { label: 'Training Analytics' },
      ]}
      defaultRole="admin"
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal text-white">
                <GraduationCap className="w-3.5 h-3.5" />
                Capacity Building Console
              </span>
              <span className="text-[11px] font-medium text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded-full border border-border">
                iGOT Karmayogi &amp; NSSTA Cadre Delivery
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Training Analytics &amp; Impact
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Measure learning engagement, course completion velocity, and verified workforce competency development effectiveness.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-teal bg-teal-light px-3 py-1.5 rounded-btn border border-teal/20">
              64,820 Total Cadre Hours
            </span>
          </div>
        </div>

        {/* 1. Training Metrics (4 StatCards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Enrollments"
            value={mockTrainingSummary.totalEnrollments.toLocaleString()}
            subtitle="Across 38 accredited courses"
            accent="blue"
            icon={<BookOpen className="w-5 h-5" />}
            trend={{ value: '+14.2% this quarter', direction: 'up' }}
          />

          <StatCard
            title="Completion Rate"
            value={`${mockTrainingSummary.completionRate}%`}
            subtitle="Benchmark target: 70%"
            accent="teal"
            icon={<GraduationCap className="w-5 h-5" />}
            trend={{ value: '+7.1% QoQ improvement', direction: 'up' }}
          />

          <StatCard
            title="Avg Assessment Score"
            value={`${mockTrainingSummary.averageScore}%`}
            subtitle="Post-course certification tests"
            accent="teal"
            icon={<Award className="w-5 h-5" />}
            trend={{ value: '+2.4% average gain', direction: 'up' }}
          />

          <StatCard
            title="Total Learning Hours"
            value={mockTrainingSummary.totalLearningHours.toLocaleString()}
            subtitle="5.2 hrs average per official"
            accent="blue"
            icon={<Clock className="w-5 h-5" />}
            trend={{ value: 'Above ministerial target', direction: 'up' }}
          />
        </div>

        {/* 2 & 3. Learning Engagement Trend & Course Completion Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col">
            <TrainingEngagementTrendChart data={mockTrainingTrends} />
          </div>
          <div className="lg:col-span-5 flex flex-col">
            <CourseCompletionChart data={mockCourseCompletionSlices} />
          </div>
        </div>

        {/* 4. Most Popular Courses */}
        <PopularCoursesTable courses={mockPopularCourses} />

        {/* 5. Training Effectiveness (Pre vs Post Training) */}
        <TrainingEffectivenessChart data={mockTrainingEffectiveness} />

        {/* 6. Learning Hours by Department */}
        <DepartmentLearningHoursChart data={mockDepartmentLearningHours} />

        {/* 7. Low Engagement Alerts */}
        <LowEngagementAlerts alerts={mockLowEngagementAlerts} />
      </div>
    </AppShell>
  );
}
