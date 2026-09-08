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
  RefreshCw
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
              if (relatedAttempt.status === 'COMPLETED') status = 'completed';
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
              description: a.description || 'Standardized assessment evaluating core knowledge and application.',
              category: 'Diagnostic',
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
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
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
              Evaluate your competencies and track your learning progress through standardized diagnostic tests.
            </p>
          </div>

          <Link href="/learner/learning-path">
            <Button variant="secondary" size="sm" className="text-xs font-semibold gap-2 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              View Learning Path
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* 1. Assessment Summary StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Available"
            value={counts.available}
            accent="teal"
            icon={<CheckSquare className="w-5 h-5" />}
            subtitle="Ready for diagnostic check"
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

        {/* Diagnostic Callout Banner */}
        <div className="bg-gradient-to-r from-primary-light/80 via-teal-light/40 to-transparent border border-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#123B66] text-white shadow-sm shrink-0">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Diagnostic Assessment Ready: Python &amp; Official Statistics
              </h4>
              <p className="text-xs text-text-secondary">
                Completing assessments updates your competency ratings and unlocks advanced roadmap stages.
              </p>
            </div>
          </div>

          <Link href="/learner/quiz">
            <Button variant="primary" size="sm" className="text-xs font-semibold whitespace-nowrap shadow-sm">
              Launch Diagnostic Assessment
            </Button>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessments by title, competency (Python, SQL, GIS)..."
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

        {/* 2. Assessment Tabs */}
        <div className="space-y-6">
          <AssessmentTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={counts}
          />

          {/* 3. Assessment Cards Grid */}
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
        </div>
      </div>
    </AppShell>
  );
}
