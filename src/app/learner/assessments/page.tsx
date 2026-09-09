'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  mockLearnerAssessments, 
  learnerAssessmentSummary,
  DetailedAssessmentItem 
} from '@/data/assessments';
import { AssessmentCard, AssessmentTabs, AssessmentTabKey } from '@/components/assessments';
import { 
  CheckSquare, 
  PlayCircle, 
  Award, 
  Clock, 
  Sparkles, 
  Search, 
  FilterX, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  RefreshCw,
  ShieldCheck,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { assessmentService, quizService } from '@/services';
import type { AssessmentResponse, UserAttemptHistoryItem } from '@/types/api';

export default function LearnerAssessmentsPage() {
  const [activeTab, setActiveTab] = useState<AssessmentTabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('all');
  const [assessmentsList, setAssessmentsList] = useState<DetailedAssessmentItem[]>(mockLearnerAssessments);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const [assessmentsRes, attemptsRes] = await Promise.allSettled([
          assessmentService.getAssessments(),
          quizService.getMyAttempts(),
        ]);

        if (assessmentsRes.status === 'fulfilled' && assessmentsRes.value && assessmentsRes.value.length > 0) {
          const apiAssessments = assessmentsRes.value;
          const attempts = attemptsRes.status === 'fulfilled' ? attemptsRes.value || [] : [];

          const mapped: DetailedAssessmentItem[] = apiAssessments.map((a: AssessmentResponse) => {
            const relatedAttempt = attempts.find((att: UserAttemptHistoryItem) => att.assessment_id === a.id);
            let status: 'available' | 'in_progress' | 'completed' = 'available';
            if (relatedAttempt) {
              if (relatedAttempt.status === 'COMPLETED' || relatedAttempt.status === 'EVALUATED') status = 'completed';
              else if (relatedAttempt.status === 'IN_PROGRESS') status = 'in_progress';
            }

            const diffMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
              BEGINNER: 'Beginner',
              INTERMEDIATE: 'Intermediate',
              ADVANCED: 'Advanced',
              Beginner: 'Beginner',
              Intermediate: 'Intermediate',
              Advanced: 'Advanced',
            };

            return {
              id: a.id,
              title: a.title,
              competency: 'Statistical Methodology',
              competencyId: 'COMP-01',
              domain: 'Official Statistics',
              questionsCount: a.question_count || 10,
              durationMinutes: a.duration_minutes || 20,
              difficulty: diffMap[a.difficulty] || 'Intermediate',
              status,
              score: relatedAttempt?.percentage,
              lastAttemptDate: relatedAttempt?.completed_at ? new Date(relatedAttempt.completed_at).toLocaleDateString() : undefined,
              actionRoute: status === 'completed' && relatedAttempt?.attempt_id
                ? `/learner/quiz/result?attempt_id=${relatedAttempt.attempt_id}`
                : `/learner/quiz?assessment_id=${a.id}`,
              description: a.description || 'Standardized official assessment evaluating core knowledge and application.',
              category: 'Official Assessment',
              dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : undefined,
              author: 'Faculty Trainer (MoSPI)',
              isOfficial: true,
            };
          });

          // Merge with mock to preserve variety while giving preference to backend items
          const apiTitles = new Set(mapped.map((m) => m.title.toLowerCase()));
          const remainingMock = mockLearnerAssessments.filter(
            (m) => !apiTitles.has(m.title.toLowerCase())
          );
          setAssessmentsList([...mapped, ...remainingMock]);
        }
      } catch (err) {
        console.warn('Using fallback assessments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Competency options
  const competencies = useMemo(() => {
    const list = Array.from(new Set(assessmentsList.map((a) => a.competency)));
    return ['all', ...list];
  }, [assessmentsList]);

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    return assessmentsList.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.status !== activeTab) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesComp = item.competency.toLowerCase().includes(q);
        const matchesDomain = item.domain.toLowerCase().includes(q);
        if (!matchesTitle && !matchesComp && !matchesDomain) return false;
      }

      // Competency filter
      if (selectedCompetency !== 'all' && item.competency !== selectedCompetency) {
        return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, selectedCompetency, assessmentsList]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: assessmentsList.length,
      available: assessmentsList.filter((a) => a.status === 'available').length,
      in_progress: assessmentsList.filter((a) => a.status === 'in_progress').length,
      completed: assessmentsList.filter((a) => a.status === 'completed').length,
    };
  }, [assessmentsList]);

  return (
    <AppShell
      title="My Assessments"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Assessments' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-10 max-w-7xl mx-auto pb-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                MoSPI Competency Diagnostic Hub
              </Badge>
              <span className="text-xs text-text-muted">
                Aligned with National Statistical Academy Rubric
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              My Assessments
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Evaluate your competencies and track your learning progress through assigned official tests and personal AI practice.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/learner/quiz-generator">
              <Button variant="secondary" size="sm" className="text-xs font-semibold gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI Practice
              </Button>
            </Link>
            <Link href="/learner/learning-path">
              <Button variant="secondary" size="sm" className="text-xs font-semibold gap-2 shrink-0">
                View Learning Path
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Assessment Summary StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available"
            value={counts.available}
            accent="teal"
            icon={<CheckSquare className="w-5 h-5" />}
            subtitle="Assigned official tests ready"
          />
          <StatCard
            title="In Progress"
            value={counts.in_progress}
            accent="warning"
            icon={<Clock className="w-5 h-5" />}
            subtitle="Active assessment sessions"
          />
          <StatCard
            title="Completed"
            value={counts.completed}
            accent="blue"
            icon={<Award className="w-5 h-5" />}
            subtitle="Verified across official domains"
          />
          <StatCard
            title="Average Score"
            value={`${learnerAssessmentSummary.averageScore}%`}
            accent="ai"
            icon={<TrendingUp className="w-5 h-5" />}
            subtitle="Exceeds MoSPI cadre baseline (75%)"
          />
        </div>

        {/* SECTION A: Official MoSPI Assessments (Assigned by Trainers) */}
        <section className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-light">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-text-primary">
                    Section A: Official Assessments
                  </h2>
                  <Badge variant="teal" size="sm" className="font-semibold">
                    Trainer Assigned
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Standardized curriculum evaluations published by faculty trainers. Submissions update your verified competency ratings.
                </p>
              </div>
            </div>

            {counts.available > 0 && (
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full shrink-0">
                {counts.available} Available to Attempt
              </span>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search official assessments by title, competency (Python, SQL, GIS)..."
                className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted whitespace-nowrap hidden sm:inline">
                Competency:
              </span>
              <select
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="all">All Competencies</option>
                {competencies
                  .filter((c) => c !== 'all')
                  .map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Assessment Tabs */}
          <AssessmentTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />

          {/* Assessment Cards Grid */}
          {filteredAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-text-muted">
                <FilterX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  No assessments found
                </h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  No diagnostic assessments match your selected filter criteria. Try choosing a different tab or resetting your search.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                  setSelectedCompetency('all');
                }}
                className="text-xs font-semibold"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </section>

        {/* SECTION B: Personal AI Practice (Isolated Self-Study) */}
        <section className="space-y-4 pt-6 border-t border-border-light">
          <div className="flex items-center gap-2 pb-1">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg sm:text-xl font-bold text-text-primary">
              Section B: Personal AI Practice &amp; Self-Study
            </h2>
            <Badge variant="neutral" size="sm" className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              Formative Practice
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-surface dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-surface border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl p-6 sm:p-7 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
                    <BrainCircuit className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 tracking-wide uppercase">
                    Personal Learning Copilot
                  </span>
                  <span className="text-xs text-text-muted">• Zero Stakes</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    AI Practice Quizzes from Your Own Uploaded Materials
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mt-1">
                    Upload your own study guides, lecture PDFs, and notes to instantly generate personal practice MCQs with instant scoring and AI weak-topic analysis. Practice attempts are <strong>strictly formative</strong> and do not modify your official civil service competency ratings.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Personal Materials (PDF, DOCX, TXT)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Weak-Topic Diagnostic</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>Detailed Remediations</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link href="/learner/quiz-generator">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center text-xs font-semibold gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Practice Quiz
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/learner/materials">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center text-xs font-medium text-text-secondary"
                  >
                    Manage Uploaded Materials
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
