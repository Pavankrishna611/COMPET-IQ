'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import {
  CompetencyEvaluationResponse,
  CompetencyEvaluationItem,
} from '@/types/api';
import {
  ArrowRight,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Briefcase,
  Building2,
  Target,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Award,
  BookOpen,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

function getDomainBadgeVariant(domain: string): 'teal' | 'info' | 'ai' | 'warning' | 'neutral' {
  const d = domain.toLowerCase();
  if (d.includes('tech')) return 'teal';
  if (d.includes('stat')) return 'info';
  if (d.includes('gov') || d.includes('digit')) return 'ai';
  if (d.includes('behav')) return 'warning';
  return 'neutral';
}

function getPriorityBadgeInfo(priority: string) {
  const p = priority.toUpperCase();
  if (p === 'CRITICAL') {
    return { variant: 'critical' as const, label: 'Critical Priority', color: 'text-critical bg-critical-light border-critical/30' };
  }
  if (p === 'HIGH') {
    return { variant: 'warning' as const, label: 'High Priority', color: 'text-warning bg-warning-light border-warning/30' };
  }
  if (p === 'MEDIUM') {
    return { variant: 'info' as const, label: 'Medium Priority', color: 'text-primary bg-primary-light border-primary/30' };
  }
  if (p === 'MET') {
    return { variant: 'success' as const, label: 'Requirement Met', color: 'text-success bg-success-light border-success/30' };
  }
  return { variant: 'neutral' as const, label: 'Low Priority', color: 'text-text-muted bg-surface-alt border-border' };
}

function getSourceBadge(source: string) {
  if (source === 'ASSESSED') {
    return { label: 'Assessed', variant: 'success' as const, desc: 'Objectively verified from assessment' };
  }
  if (source === 'TRAINING') {
    return { label: 'Training', variant: 'teal' as const, desc: 'Established from completed coursework' };
  }
  if (source === 'EXPERIENCE') {
    return { label: 'Experience', variant: 'info' as const, desc: 'Derived from practical work experience' };
  }
  return { label: 'Initial Estimate', variant: 'neutral' as const, desc: 'Initial estimate based on profile onboarding' };
}

export default function CompetencyAnalysisPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<CompetencyEvaluationResponse | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<CompetencyEvaluationItem | null>(null);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await onboardingService.evaluateCompetencies();
      setEvaluation(data);
      if (data.competencies.length > 0) {
        setSelectedCompetency(data.competencies[0]);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        'Competency analysis could not be completed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
  }, []);

  const toggleExpand = (compId: string, item: CompetencyEvaluationItem) => {
    if (expandedDetailsId === compId) {
      setExpandedDetailsId(null);
    } else {
      setExpandedDetailsId(compId);
      setSelectedCompetency(item);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-teal flex items-center justify-center font-bold text-white text-sm shadow-sm">
            CQ
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-text-primary leading-none">
              COMPET<span className="text-teal">IQ</span>
            </span>
            <span className="text-[10px] text-text-muted tracking-tight uppercase font-medium mt-0.5">
              Official Statistics Competency Framework
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="sm" withDot className="font-semibold">
            Competency Profile Evaluated
          </Badge>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-text-muted hover:text-text-primary transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-4 relative">
              <Loader2 className="w-7 h-7 animate-spin text-teal" />
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight mb-2">
              Evaluating Your Competencies &amp; Skill Gaps
            </h2>
            <p className="text-sm text-text-secondary max-w-md">
              Comparing your current proficiency evidence against official role benchmarks...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="w-full max-w-lg shadow-card border border-critical/20">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-critical-light border border-critical/30 flex items-center justify-center text-critical mb-5">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-text-primary tracking-tight mb-2">
                  Competency analysis could not be completed.
                </h2>
                <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                  <Button
                    variant="teal"
                    size="md"
                    onClick={fetchEvaluation}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    className="w-full sm:w-auto px-6 font-semibold"
                  >
                    Retry Analysis
                  </Button>
                  <Link href="/onboarding/analysis" className="w-full sm:w-auto">
                    <Button variant="secondary" size="md" className="w-full sm:w-auto">
                      Back to Suggestions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Successful Evaluation Display */}
        {!loading && !error && evaluation && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Title & Context Header */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal" />
                <span>Competency Evaluation Completed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Your Competency Analysis
              </h1>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Here is your evaluated competency baseline, official target benchmarks for your role, and identified skill gaps.
              </p>
            </div>

            {/* Learner Profile Context Banner */}
            <Card className="border border-border bg-surface shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Professional Role */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                        Professional Role
                      </span>
                      <p className="text-sm font-bold text-text-primary truncate">
                        {evaluation.learner_profile.job_role || evaluation.learner_profile.designation || 'Statistical Officer'}
                      </p>
                      {evaluation.learner_profile.designation && (
                        <p className="text-xs text-text-muted truncate">
                          {evaluation.learner_profile.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-light flex items-center justify-center text-teal shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                        Department
                      </span>
                      <p className="text-sm font-bold text-text-primary truncate">
                        {evaluation.learner_profile.department || 'National Statistical System'}
                      </p>
                    </div>
                  </div>

                  {/* Career Goal */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-ai-light flex items-center justify-center text-ai-purple shrink-0 mt-0.5">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block">
                        Career Goal
                      </span>
                      <p className="text-sm font-bold text-text-primary truncate" title={evaluation.learner_profile.career_goal || undefined}>
                        {evaluation.learner_profile.career_goal || 'Professional advancement'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competency Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card className="border border-border p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Total Competencies
                </span>
                <span className="text-2xl font-bold text-text-primary mt-1 block">
                  {evaluation.summary.total_competencies}
                </span>
                <span className="text-[11px] text-text-muted">Accepted Profile</span>
              </Card>

              <Card className="border border-emerald-200 bg-emerald-50/30 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Requirements Met
                </span>
                <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                  {evaluation.summary.requirements_met}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Gap = 0.0</span>
              </Card>

              <Card className="border border-critical/30 bg-critical-light/40 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-critical uppercase tracking-wider block">
                  Critical Gaps
                </span>
                <span className="text-2xl font-bold text-critical mt-1 block">
                  {evaluation.summary.critical_gaps}
                </span>
                <span className="text-[11px] text-critical/80 font-medium">Immediate Priority</span>
              </Card>

              <Card className="border border-warning/30 bg-warning-light/40 p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-warning uppercase tracking-wider block">
                  High Priority Gaps
                </span>
                <span className="text-2xl font-bold text-warning mt-1 block">
                  {evaluation.summary.high_priority_gaps}
                </span>
                <span className="text-[11px] text-warning/80 font-medium">Targeted Upskilling</span>
              </Card>

              <Card className="border border-border p-4 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                  Moderate Gaps
                </span>
                <span className="text-2xl font-bold text-text-secondary mt-1 block">
                  {evaluation.summary.moderate_gaps}
                </span>
                <span className="text-[11px] text-text-muted">Gap &lt; 1.0</span>
              </Card>
            </div>

            {/* Overall Competency Indicator Banner */}
            <div className="p-4 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-muted uppercase tracking-wider">
                  Overall Status:
                </span>
                <span className="font-bold text-teal text-sm">
                  {evaluation.summary.overall_gap_indicator}
                </span>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <span>
                  Average Current: <strong className="text-text-primary">{evaluation.summary.average_current_level} / 5</strong>
                </span>
                <span className="text-border">•</span>
                <span>
                  Average Target: <strong className="text-text-primary">{evaluation.summary.average_required_level} / 5</strong>
                </span>
              </div>
            </div>

            {/* Competency Results Table / Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  Competency Results
                </h2>
                <span className="text-xs text-text-muted">
                  Click any competency to inspect gap details and evidence
                </span>
              </div>

              <div className="space-y-3">
                {evaluation.competencies.map((item) => {
                  const priorityBadge = getPriorityBadgeInfo(item.priority);
                  const sourceBadge = getSourceBadge(item.current_level_source);
                  const domainVariant = getDomainBadgeVariant(item.domain);
                  const isExpanded = expandedDetailsId === item.competency_id;

                  return (
                    <Card
                      key={item.competency_id}
                      className={`border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-teal shadow-md ring-1 ring-teal/20'
                          : 'border-border/90 hover:border-teal/30 hover:shadow-xs'
                      }`}
                    >
                      {/* Main Card Summary Row */}
                      <div
                        onClick={() => toggleExpand(item.competency_id, item)}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        {/* Competency & Domain */}
                        <div className="space-y-1 min-w-[200px] flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-text-primary tracking-tight">
                              {item.competency_name}
                            </h3>
                            <Badge variant={domainVariant} size="sm">
                              {item.domain}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted truncate max-w-md">
                            {item.why_required}
                          </p>
                        </div>

                        {/* Metrics Bar: Current, Required, Gap, Priority */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 self-stretch lg:self-center justify-between lg:justify-end">
                          {/* Current Level with Source Indicator */}
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-text-muted block">
                              Current
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-bold text-text-primary">
                                {item.current_level.toFixed(1)} / 5
                              </span>
                              <Badge variant={sourceBadge.variant} size="sm">
                                {sourceBadge.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Required Level */}
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-text-muted block">
                              Required
                            </span>
                            <span className="text-sm font-bold text-text-primary mt-0.5 block">
                              {item.required_level.toFixed(1)} / 5
                            </span>
                          </div>

                          {/* Gap */}
                          <div className="text-left sm:text-right min-w-[70px]">
                            <span className="text-[10px] uppercase font-bold text-text-muted block">
                              Gap
                            </span>
                            <span
                              className={`text-sm font-bold mt-0.5 block ${
                                item.gap === 0 ? 'text-emerald-600' : 'text-text-primary'
                              }`}
                            >
                              {item.gap === 0 ? '0.0 (Met)' : item.gap.toFixed(1)}
                            </span>
                          </div>

                          {/* Priority */}
                          <div className="text-left sm:text-right min-w-[110px]">
                            <span className="text-[10px] uppercase font-bold text-text-muted block">
                              Priority
                            </span>
                            <div className="mt-0.5">
                              <Badge variant={priorityBadge.variant} size="sm" withDot>
                                {priorityBadge.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Expand chevron */}
                          <button
                            type="button"
                            className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-teal" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* =================================================================
                          "Why This Gap Matters" Expandable Detail Drawer
                         ================================================================= */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6 bg-surface-alt/70 border-t border-border space-y-4 animate-fadeIn">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal">
                            <HelpCircle className="w-4 h-4" />
                            <span>Why This Gap Matters</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Explanation & Evidence */}
                            <div className="space-y-3 text-xs sm:text-sm">
                              <div>
                                <span className="font-semibold text-text-primary block text-xs mb-1">
                                  Why Required:
                                </span>
                                <p className="text-text-secondary leading-relaxed bg-surface p-3 rounded-md border border-border/80">
                                  {item.why_required}
                                </p>
                              </div>

                              <div>
                                <span className="font-semibold text-text-primary block text-xs mb-1">
                                  Evidence Source:
                                </span>
                                <div className="bg-surface p-3 rounded-md border border-border/80 text-text-secondary space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={sourceBadge.variant} size="sm">
                                      {item.current_level_source}
                                    </Badge>
                                    <span className="text-[11px] text-text-muted">
                                      {sourceBadge.desc}
                                    </span>
                                  </div>
                                  <p className="text-xs pt-1">{item.evidence}</p>
                                </div>
                              </div>
                            </div>

                            {/* Right: Gap Breakdown & Visual Progress */}
                            <div className="space-y-3 bg-surface p-4 rounded-md border border-border/80 text-xs">
                              <span className="font-semibold text-text-primary block text-xs mb-2">
                                Proficiency Benchmark Breakdown
                              </span>

                              {/* Progress bar visual */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-text-muted">Current Proficiency</span>
                                  <span className="font-bold text-text-primary">
                                    {item.current_level.toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="h-2 bg-border-light rounded-full overflow-hidden">
                                  <div
                                    className="h-2 bg-teal rounded-full"
                                    style={{ width: `${(item.current_level / 5.0) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-text-muted">Target Requirement</span>
                                  <span className="font-bold text-text-primary">
                                    {item.required_level.toFixed(1)} / 5.0
                                  </span>
                                </div>
                                <div className="h-2 bg-border-light rounded-full overflow-hidden">
                                  <div
                                    className="h-2 bg-primary rounded-full"
                                    style={{ width: `${(item.required_level / 5.0) * 100}%` }}
                                  />
                                </div>
                              </div>

                              {/* Summary pill in detail box */}
                              <div className="pt-2 border-t border-border-light flex items-center justify-between">
                                <span className="text-text-muted">Required Learning Gap:</span>
                                <span className="font-bold text-sm text-text-primary">
                                  {item.gap === 0 ? '0.0 (Requirement Met)' : `${item.gap.toFixed(1)} Level Units`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Next Step Action Card */}
            <Card className="border border-border shadow-md bg-surface sticky bottom-4 z-20">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      Ready for Targeted Learning
                    </span>
                    <Badge variant="teal" size="sm">
                      Next: Recommended Courses
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    Your competency evaluation will guide course recommendations tailored to your priority skill gaps.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link href="/learner/recommendations" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="w-full sm:w-auto px-6 font-semibold shadow-sm"
                    >
                      View Recommended Courses
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border-light text-center text-xs text-text-muted mt-8">
        Ministry of Statistics &amp; Programme Implementation • Official Statistics Competency Framework
      </footer>
    </div>
  );
}
