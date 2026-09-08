'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { mockQuizResult } from '@/data/quizResults';
import {
  CompetencyBreakdownChart,
  CompetencyImpactCard,
  QuestionReviewAccordion,
} from '@/components/assessments';
import {
  Award,
  CheckCircle2,
  XCircle,
  Percent,
  Clock,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Target,
  Route,
  BookOpen,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

export default function LearnerQuizResultPage() {
  const {
    score,
    statusHeading,
    statusSubheading,
    metrics,
    competencyBreakdown,
    breakdownInsight,
    competencyImpact,
    recommendation,
    reviews,
  } = mockQuizResult;

  return (
    <AppShell
      title="Assessment Results"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Assessments', href: '/learner/assessments' },
        { label: 'Result Summary' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Breadcrumb back navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/learner/assessments"
            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to My Assessments Hub
          </Link>

          <Badge variant="teal" size="sm" withDot className="font-semibold">
            Evaluation Synchronized with MoSPI Cadre Record
          </Badge>
        </div>

        {/* 1. RESULT HERO */}
        <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          {/* Subtle decorative gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" size="sm" className="gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Assessment Completed
                </Badge>
                <span className="text-xs font-mono text-text-muted">
                  Test ID: ASMT-PY-2026-09
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
                {statusHeading}
              </h1>

              <p className="text-sm text-text-secondary leading-relaxed">
                {statusSubheading} Your performance demonstrates verified proficiency in core statistical computing constructs.
              </p>
            </div>

            {/* Score Ring / Badge */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary via-[#123B66] to-[#0A2540] text-white rounded-3xl shadow-xl shadow-primary/20 shrink-0 min-w-[200px] border border-primary-light/20">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-light mb-1">
                Final Assessment Score
              </span>
              <div className="text-5xl font-black font-mono tracking-tight text-white mb-1">
                {score}%
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-200">
                <Award className="w-4 h-4 text-teal" />
                <span>Passing Grade: 75%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RESULT SUMMARY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-border bg-surface flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                Correct
              </span>
              <span className="text-xl font-bold font-mono text-text-primary">
                {metrics.correct}
              </span>
              <span className="text-[11px] text-text-muted ml-1">/ 20</span>
            </div>
          </Card>

          <Card className="p-4 border-border bg-surface flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                Incorrect
              </span>
              <span className="text-xl font-bold font-mono text-text-primary">
                {metrics.incorrect}
              </span>
              <span className="text-[11px] text-text-muted ml-1">/ 20</span>
            </div>
          </Card>

          <Card className="p-4 border-border bg-surface flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                Accuracy
              </span>
              <span className="text-xl font-bold font-mono text-text-primary">
                {metrics.accuracy}%
              </span>
            </div>
          </Card>

          <Card className="p-4 border-border bg-surface flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-light text-teal flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                Time Taken
              </span>
              <span className="text-xl font-bold font-mono text-text-primary">
                {metrics.timeTaken}
              </span>
            </div>
          </Card>
        </div>

        {/* 3 & 4. Grid: Competency Breakdown Chart (Left) + Competency Impact (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* 3. Competency Breakdown Chart */}
          <CompetencyBreakdownChart
            data={competencyBreakdown}
            insight={breakdownInsight}
          />

          {/* 4. Competency Impact Card */}
          <CompetencyImpactCard
            competency={competencyImpact.competency}
            before={competencyImpact.before}
            after={competencyImpact.after}
            improvement={competencyImpact.improvement}
            explanation={competencyImpact.explanation}
          />
        </div>

        {/* 5. AI LEARNING RECOMMENDATION CARD */}
        <div className="bg-gradient-to-r from-primary-light/80 via-teal-light/50 to-surface border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="ai" size="sm" className="gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI Learning Trajectory Recommendation
              </Badge>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              {recommendation.title}: {recommendation.courseTitle}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {recommendation.description}
            </p>

            <div className="flex items-center gap-4 text-xs font-mono pt-1">
              <span className="text-text-muted">Expected Impact:</span>
              <span className="font-bold text-primary bg-surface px-2 py-0.5 rounded border border-border">
                {recommendation.competency}: {recommendation.impactFrom} → {recommendation.impactTo}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Link href={`/learner/courses/${recommendation.courseId}`}>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-xs font-semibold shadow-md whitespace-nowrap"
              >
                View Recommended Course
              </Button>
            </Link>
          </div>
        </div>

        {/* 6. QUESTION REVIEW ACCORDION */}
        <QuestionReviewAccordion reviews={reviews} />

        {/* 7. RESULT ACTIONS ROW */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-surface border border-border rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <FileCheck className="w-4 h-4 text-teal" />
            <span>Evaluation verified and indexed in official capacity management portal</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/learner/quiz">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Retake Assessment
              </Button>
            </Link>

            <Link href="/learner/competencies">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Target className="w-3.5 h-3.5 text-primary" />}
                className="text-xs font-semibold"
              >
                View Updated Competencies
              </Button>
            </Link>

            <Link href="/learner/learning-path">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs font-semibold shadow-sm"
              >
                Explore Learning Path
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
