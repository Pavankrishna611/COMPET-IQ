'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  ChevronRight,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { quizService } from '@/services';
import type { QuizResultResponse } from '@/types/api';

function QuizResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt_id');

  const [resultData, setResultData] = useState<QuizResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId) return;

      try {
        setIsLoading(true);
        const data = await quizService.getQuizResult(attemptId);
        setResultData(data);
      } catch (err) {
        console.warn('Could not load live quiz result, using mock:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const score = resultData ? Math.round(resultData.percentage) : mockQuizResult.score;
  const passed = resultData ? resultData.percentage >= 75 : mockQuizResult.score >= 75;
  const statusHeading = resultData
    ? passed
      ? 'Assessment Passed Successfully'
      : 'Assessment Completed — Review Recommended'
    : mockQuizResult.statusHeading;
  const statusSubheading = resultData
    ? passed
      ? 'Outstanding performance across verified competencies.'
      : 'You completed the diagnostic. Review target competencies below.'
    : mockQuizResult.statusSubheading;

  const totalQ = resultData ? resultData.total_points : 20;
  const correctQ = resultData ? resultData.score : mockQuizResult.metrics.correct;
  const incorrectQ = Math.max(0, totalQ - correctQ);
  const durationSec = resultData?.time_taken_seconds || 870;
  const timeDisplay = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;

  const competencyImpact = resultData?.competency_breakdown?.[0]
    ? {
      competency: resultData.competency_breakdown[0].competency_name,
      before: resultData.competency_breakdown[0].updated_level
        ? Math.max(1.0, resultData.competency_breakdown[0].updated_level - resultData.competency_breakdown[0].competency_level_delta)
        : 3.0,
      after: resultData.competency_breakdown[0].updated_level || 3.5,
      improvement: resultData.competency_breakdown[0].competency_level_delta || 0.5,
      explanation: 'Updated MoSPI competency evaluation based on verified diagnostic assessment responses.',
    }
    : mockQuizResult.competencyImpact;

  const reviews = resultData?.question_reviews && resultData.question_reviews.length > 0
    ? resultData.question_reviews.map((b, idx) => ({
      id: b.question_id,
      questionNumber: idx + 1,
      question: b.question_text,
      yourAnswer: b.selected_option ? `Option ${b.selected_option}` : 'None',
      yourOptionKey: (b.selected_option || 'A') as 'A' | 'B' | 'C' | 'D',
      correctAnswer: `Option ${b.correct_option}`,
      correctOptionKey: (b.correct_option || 'A') as 'A' | 'B' | 'C' | 'D',
      isCorrect: b.is_correct,
      explanation: b.explanation || 'Verified response aligned with official statistical curriculum standards.',
      competency: b.competency_name || 'Official Statistics',
    }))
    : mockQuizResult.reviews;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-text-secondary">Generating Diagnostic Results &amp; Competency Updates...</p>
      </div>
    );
  }

  return (
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={passed ? 'success' : 'warning'} size="sm" className="gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Assessment Completed
              </Badge>
              <span className="text-xs font-mono text-text-muted">
                Test ID: {resultData ? `ASMT-${resultData.assessment_id.slice(0, 8)}` : 'ASMT-PY-2026-09'}
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
              {correctQ}
            </span>
            <span className="text-[11px] text-text-muted ml-1">/ {totalQ}</span>
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
              {incorrectQ}
            </span>
            <span className="text-[11px] text-text-muted ml-1">/ {totalQ}</span>
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
              {score}%
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
              {timeDisplay}
            </span>
          </div>
        </Card>
      </div>

      {/* 3 & 4. Grid: Competency Breakdown Chart + Competency Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <CompetencyBreakdownChart
          data={mockQuizResult.competencyBreakdown}
          insight={mockQuizResult.breakdownInsight}
        />

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
            {mockQuizResult.recommendation.title}: {mockQuizResult.recommendation.courseTitle}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed">
            {mockQuizResult.recommendation.description}
          </p>

          <div className="flex items-center gap-4 text-xs font-mono pt-1">
            <span className="text-text-muted">Expected Impact:</span>
            <span className="font-bold text-primary bg-surface px-2 py-0.5 rounded border border-border">
              {mockQuizResult.recommendation.competency}: Level 2.1 → Level 3.5
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link href={`/learner/courses`}>
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
  );
}

export default function LearnerQuizResultPage() {
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
      <Suspense fallback={<div className="p-12 text-center text-sm text-text-muted">Loading Result Summary...</div>}>
        <QuizResultContent />
      </Suspense>
    </AppShell>
  );
}
