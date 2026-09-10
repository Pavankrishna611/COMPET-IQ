'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import { onboardingService } from '@/services/onboarding.service';
import { SuggestedCompetencyResponse, AcceptedCompetencyItem } from '@/types/api';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  Plus,
  ShieldCheck,
  Layers,
  BrainCircuit,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

// 5 sequential analysis stages required by specification
const ANALYSIS_STAGES = [
  { id: 1, title: 'Analyzing profile...', description: 'Evaluating professional experience and functional role' },
  { id: 2, title: 'Understanding responsibilities...', description: 'Parsing operational assignments and department objectives' },
  { id: 3, title: 'Mapping competency framework...', description: 'Matching against official statistical competencies' },
  { id: 4, title: 'Identifying relevant competencies...', description: 'Determining critical capability requirements' },
  { id: 5, title: 'Preparing recommendations...', description: 'Calibrating required proficiency levels and priority weights' },
];

function getLevelLabel(level: number): { label: string; text: string } {
  if (level >= 4.5) return { label: 'Expert', text: `Level ${level.toFixed(1)} • Expert` };
  if (level >= 4.0) return { label: 'Advanced', text: `Level ${level.toFixed(1)} • Advanced` };
  if (level >= 3.0) return { label: 'Intermediate', text: `Level ${level.toFixed(1)} • Intermediate` };
  return { label: 'Foundational', text: `Level ${level.toFixed(1)} • Foundational` };
}

function getDomainBadgeVariant(domain: string): 'teal' | 'info' | 'ai' | 'warning' | 'neutral' {
  const d = domain.toLowerCase();
  if (d.includes('tech')) return 'teal';
  if (d.includes('stat')) return 'info';
  if (d.includes('gov') || d.includes('digit')) return 'ai';
  if (d.includes('behav')) return 'warning';
  return 'neutral';
}

function getPriorityBadge(priority: string) {
  const p = priority.toUpperCase();
  if (p === 'CRITICAL') {
    return {
      variant: 'critical' as const,
      label: 'Critical Priority',
      description: 'Core operational requirement for current position',
    };
  }
  if (p === 'HIGH') {
    return {
      variant: 'warning' as const,
      label: 'High Priority',
      description: 'High relevance for immediate job duties and career advancement',
    };
  }
  return {
    variant: 'neutral' as const,
    label: 'Medium Priority',
    description: 'Foundational capability supporting long-term performance',
  };
}

export default function OnboardingAnalysisPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Analysis state
  const [loading, setLoading] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedCompetencyResponse[]>([]);

  // Review interaction: tracking accepted and removed competencies
  // We keep a set of removed competency IDs; any suggested ID not in removedIds is accepted
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Run the 5-stage sequential loading animation and API analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setCurrentStageIndex(0);
    setSuggestions([]);
    setRemovedIds(new Set());

    // Cycle through the 5 stages sequentially
    const stageDuration = 650; // ms per stage for smooth progression
    let currentIdx = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      currentIdx += 1;
      if (currentIdx < ANALYSIS_STAGES.length) {
        setCurrentStageIndex(currentIdx);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, stageDuration);

    try {
      const results = await onboardingService.analyzeProfile();
      // Ensure the visual stages have had a moment to complete
      const elapsed = currentIdx * stageDuration;
      const minVisualTime = ANALYSIS_STAGES.length * stageDuration;
      const remainingTime = Math.max(0, minVisualTime - elapsed);

      setTimeout(() => {
        if (results && results.length > 0) {
          setSuggestions(results);
          setLoading(false);
        } else {
          setError('No competency recommendations could be generated for this profile.');
          setLoading(false);
        }
      }, remainingTime);
    } catch (err: any) {
      setTimeout(() => {
        const errorMsg =
          err?.response?.data?.detail ||
          err?.detail ||
          err?.message ||
          'Failed to complete profile analysis. Please verify your profile details and try again.';
        setError(errorMsg);
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    runAnalysis();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Filter accepted vs removed suggestions
  const acceptedSuggestions = useMemo(() => {
    return suggestions.filter((s) => !removedIds.has(s.competency_id));
  }, [suggestions, removedIds]);

  const removedSuggestions = useMemo(() => {
    return suggestions.filter((s) => removedIds.has(s.competency_id));
  }, [suggestions, removedIds]);

  const toggleRemove = (competencyId: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(competencyId)) {
        next.delete(competencyId);
      } else {
        next.add(competencyId);
      }
      return next;
    });
  };

  const restoreCompetency = (competencyId: string) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(competencyId);
      return next;
    });
  };

  const restoreAll = () => {
    setRemovedIds(new Set());
  };

  // Continue action: save accepted competencies and proceed to gap analysis
  const handleContinue = async () => {
    if (acceptedSuggestions.length === 0) {
      setSubmitError('Please keep at least one competency accepted to proceed.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const acceptedItems: AcceptedCompetencyItem[] = acceptedSuggestions.map((s) => ({
        competency_id: s.competency_id,
        competency_name: s.competency_name,
        domain: s.domain,
        required_level: s.required_level,
        priority: s.priority,
      }));

      await onboardingService.acceptCompetencies({ competencies: acceptedItems });
      router.push('/onboarding/competency-analysis');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        'Failed to save accepted competencies. Please try again.';
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="bg-navy px-2.5 py-1 rounded-xl shadow-xs flex items-center">
            <Logo size="sm" className="h-7 w-auto" />
          </div>
          <span className="text-[11px] text-text-muted tracking-tight uppercase font-medium border-l border-border pl-3">
            Official Statistics Competency Framework
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="teal" size="sm" withDot className="font-semibold">
            {loading ? 'AI Analyzing' : 'Recommendations Ready'}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* =========================================================================
            STATE 1: 5-Stage Sequential Loading State
           ========================================================================= */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16">
            <Card className="w-full max-w-xl shadow-card border border-border">
              <CardContent className="p-8 sm:p-10 flex flex-col items-center text-center">
                {/* Pulsing AI Analysis Icon */}
                <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center text-teal mb-6 relative">
                  <BrainCircuit className="w-8 h-8 animate-pulse text-teal" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-teal"></span>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Competency Analysis in Progress</span>
                </div>

                <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
                  Analyzing Your Professional Profile
                </h1>
                <p className="text-sm text-text-secondary max-w-md mb-8 leading-relaxed">
                  COMPETIQ is mapping your designation, operational responsibilities, and career goals to the official competency framework.
                </p>

                {/* 5 Sequential Stages Stepper */}
                <div className="w-full space-y-3 mb-8 text-left bg-surface-alt/60 p-5 rounded-lg border border-border/80">
                  {ANALYSIS_STAGES.map((stage, idx) => {
                    const isPassed = idx < currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    const isUpcoming = idx > currentStageIndex;

                    return (
                      <div
                        key={stage.id}
                        className={`flex items-start gap-3.5 transition-all duration-300 ${isUpcoming ? 'opacity-40' : 'opacity-100'
                          }`}
                      >
                        {/* Step indicator */}
                        <div className="mt-0.5 shrink-0">
                          {isPassed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-5 h-5 rounded-full bg-teal text-white flex items-center justify-center animate-spin">
                              <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-border bg-surface text-text-muted text-[10px] font-semibold flex items-center justify-center">
                              {stage.id}
                            </div>
                          )}
                        </div>

                        {/* Step text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold ${isCurrent
                                ? 'text-teal font-bold'
                                : isPassed
                                  ? 'text-text-primary'
                                  : 'text-text-muted'
                              }`}
                          >
                            {stage.title}
                          </p>
                          <p className="text-[11px] text-text-muted truncate">{stage.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((currentStageIndex + 1) / ANALYSIS_STAGES.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-text-muted mt-2 font-medium">
                  Stage {currentStageIndex + 1} of {ANALYSIS_STAGES.length}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =========================================================================
            STATE 2: Error State with Retry Button
           ========================================================================= */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="w-full max-w-lg shadow-card border border-critical/20">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-critical-light border border-critical/30 flex items-center justify-center text-critical mb-5">
                  <AlertCircle className="w-7 h-7" />
                </div>

                <Badge variant="critical" size="sm" className="mb-3 font-semibold">
                  Analysis Failed
                </Badge>

                <h2 className="text-xl font-bold text-text-primary tracking-tight mb-2">
                  Unable to Generate Competency Recommendations
                </h2>
                <p className="text-sm text-text-secondary mb-6 max-w-md leading-relaxed">
                  {error}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                  <Button
                    variant="teal"
                    size="md"
                    onClick={runAnalysis}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    className="w-full sm:w-auto px-6 font-semibold"
                  >
                    Retry Analysis
                  </Button>
                  <Link href="/onboarding/profile" className="w-full sm:w-auto">
                    <Button variant="secondary" size="md" className="w-full sm:w-auto">
                      Edit Profile Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* =========================================================================
            STATE 3: Suggestions Review Interface (AI-Suggested Competencies)
           ========================================================================= */}
        {!loading && !error && suggestions.length > 0 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Page Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal" />
                <span>AI Profile Analysis Complete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                AI-Suggested Competencies
              </h1>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Based on your professional profile, COMPETIQ has identified the following recommended competencies for your role.
              </p>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-surface border border-border shadow-xs">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-text-primary text-sm">{suggestions.length}</span>
                  <span className="text-text-muted">Total Identified</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-teal text-sm">{acceptedSuggestions.length}</span>
                  <span className="text-text-muted">Accepted for Onboarding</span>
                </div>
                {removedSuggestions.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-muted text-sm">{removedSuggestions.length}</span>
                      <span className="text-text-muted">Excluded</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-xs text-text-muted flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>No manual skill entry required. Review and adjust below.</span>
              </div>
            </div>

            {/* Suggestions Cards List */}
            <div className="space-y-4">
              {acceptedSuggestions.map((item) => {
                const priorityInfo = getPriorityBadge(item.priority);
                const levelInfo = getLevelLabel(item.required_level);
                const domainVariant = getDomainBadgeVariant(item.domain);

                return (
                  <Card
                    key={item.competency_id}
                    className="border border-border/90 shadow-sm transition-all duration-200 hover:shadow-md hover:border-teal/30 overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 flex flex-col gap-4">
                      {/* Card Top: Title, Badges, and Remove Action */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-text-primary tracking-tight">
                              {item.competency_name}
                            </h2>
                            <Badge variant={domainVariant} size="sm">
                              {item.domain}
                            </Badge>
                            <Badge variant={priorityInfo.variant} size="sm" withDot>
                              {priorityInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
                            <span className="inline-flex items-center gap-1 text-primary">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>{levelInfo.text}</span>
                            </span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div className="flex items-center gap-2 self-start shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleRemove(item.competency_id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary bg-surface-alt hover:bg-critical-light hover:text-critical transition-colors border border-border"
                            title="Remove this suggestion from your profile"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Middle: AI Relevance Reasoning Box */}
                      <div className="p-3.5 rounded-md bg-surface-alt/70 border border-border/80 text-xs sm:text-sm text-text-secondary flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-semibold text-text-primary block text-xs">
                            Why this is suggested:
                          </span>
                          <p className="text-text-secondary leading-relaxed">{item.relevance_reason}</p>
                        </div>
                      </div>

                      {/* Card Bottom: Confirmation Status */}
                      <div className="flex items-center justify-between pt-1 border-t border-border-light text-xs text-text-muted">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accepted for your competency profile</span>
                        </span>
                        <span className="text-[11px] text-text-muted">Official Framework Mapped</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Empty State if learner removes all items */}
            {acceptedSuggestions.length === 0 && (
              <Card className="border border-warning/30 bg-warning-light/30 text-center p-8">
                <AlertCircle className="w-8 h-8 text-warning mx-auto mb-3" />
                <h3 className="text-base font-bold text-text-primary mb-1">
                  All Recommended Competencies Have Been Removed
                </h3>
                <p className="text-xs text-text-secondary mb-4 max-w-md mx-auto">
                  To proceed to the Competency Gap Analysis, you need at least one accepted competency from your professional profile.
                </p>
                <Button variant="secondary" size="sm" onClick={restoreAll}>
                  Restore All Recommendations
                </Button>
              </Card>
            )}

            {/* Removed Competencies Tray (Restoration / Re-add Area) */}
            {removedSuggestions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-text-muted">
                    Removed Competencies ({removedSuggestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={restoreAll}
                    className="text-xs text-teal hover:underline font-semibold"
                  >
                    Restore All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {removedSuggestions.map((item) => (
                    <div
                      key={item.competency_id}
                      className="p-3 rounded-lg border border-dashed border-border bg-surface flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-text-primary truncate">{item.competency_name}</p>
                        <p className="text-[11px] text-text-muted truncate">{item.domain}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => restoreCompetency(item.competency_id)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="h-7 text-xs px-2.5 shrink-0"
                      >
                        Re-add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Error Banner */}
            {submitError && (
              <div className="p-4 rounded-lg bg-critical-light border border-critical/30 text-critical text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{submitError}</span>
              </div>
            )}

            {/* Sticky/Bottom Action Card */}
            <Card className="border border-border shadow-md bg-surface sticky bottom-4 z-20">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-sm font-bold text-text-primary">
                      {acceptedSuggestions.length} of {suggestions.length} Competencies Accepted
                    </span>
                    <Badge variant="teal" size="sm">
                      Ready to Proceed
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    Your accepted competencies will be registered for personalized competency gap analysis.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleContinue}
                    isLoading={isSubmitting}
                    disabled={acceptedSuggestions.length === 0 || isSubmitting}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full sm:w-auto px-6 font-semibold shadow-sm"
                  >
                    Continue to Competency Gap Analysis
                  </Button>
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
