'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { recommendationService } from '@/services';
import { onboardingService } from '@/services/onboarding.service';
import type { CourseRecommendationResponse } from '@/types/api';
import {
  Sparkles,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  PlayCircle,
  Plus,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function LearnerRecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<CourseRecommendationResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const data = await recommendationService.getMyRecommendations(20);
      setRecommendations(data);
    } catch (err: any) {
      console.error('Failed to load course recommendations:', err);
      showToast('Could not load course recommendations. Please refresh.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
    // Reaching 9E marks completion of the 9A-9E onboarding flow
    onboardingService.completeOnboarding().catch((err) => {
      console.warn('Could not mark onboarding complete:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleToggleInterested = async (rec: CourseRecommendationResponse) => {
    const courseId = rec.course_id;
    setActionLoading((prev) => ({ ...prev, [courseId]: true }));
    try {
      if (rec.is_interested) {
        await recommendationService.removeCourseInterested(courseId);
        setRecommendations((prev) =>
          prev.map((c) => (c.course_id === courseId ? { ...c, is_interested: false } : c))
        );
        showToast(`Removed "${rec.course_title}" from interested courses.`, 'info');
      } else {
        await recommendationService.markCourseInterested(courseId);
        setRecommendations((prev) =>
          prev.map((c) => (c.course_id === courseId ? { ...c, is_interested: true } : c))
        );
        showToast(`Marked "${rec.course_title}" as interested! Note: this does not enroll you automatically.`, 'success');
      }
    } catch (err: any) {
      console.error('Failed to toggle interested course:', err);
      showToast(err?.response?.data?.detail || 'Failed to update interested courses.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAddToLearningPath = async (rec: CourseRecommendationResponse) => {
    const courseId = rec.course_id;
    if (rec.is_in_learning_path) return;

    setActionLoading((prev) => ({ ...prev, [`path_${courseId}`]: true }));
    try {
      await recommendationService.addToLearningPath(courseId);
      setRecommendations((prev) =>
        prev.map((c) => (c.course_id === courseId ? { ...c, is_in_learning_path: true } : c))
      );
      showToast(`Added "${rec.course_title}" to your active learning path!`, 'success');
    } catch (err: any) {
      console.error('Failed to add course to learning path:', err);
      showToast(err?.response?.data?.detail || 'Course is already in your learning path.', 'info');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`path_${courseId}`]: false }));
    }
  };

  // Filter recommendations
  const filteredRecs = recommendations.filter((rec) => {
    if (filterPriority !== 'all' && rec.priority.toUpperCase() !== filterPriority.toUpperCase()) {
      return false;
    }
    if (filterDomain !== 'all' && (rec.domain || '').toLowerCase() !== filterDomain.toLowerCase()) {
      return false;
    }
    return true;
  });

  const interestedCount = recommendations.filter((r) => r.is_interested).length;
  const criticalGapsCount = recommendations.filter((r) => r.priority === 'CRITICAL').length;
  const highGapsCount = recommendations.filter((r) => r.priority === 'HIGH').length;

  return (
    <AppShell defaultRole="learner">
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toastMessage.type === 'info'
                ? 'bg-blue-50 border-blue-300 text-blue-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-current" />
            <span className="font-medium">{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="ai" size="sm">
                Competency-Grounded
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              AI Course Recommendations
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Personalized modules mapped directly to your evaluated competency gaps, role benchmarks, and career objectives from official catalog courses.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/learner/dashboard">
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-medium shadow-sm"
              >
                Go to Dashboard
              </Button>
            </Link>
            <Link href="/learner/interested-courses">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BookmarkCheck className="w-4 h-4 text-teal" />}
                className="font-medium"
              >
                Saved Interested ({interestedCount})
              </Button>
            </Link>
            <Link href="/learner/learning-path">
              <Button
                variant="teal"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-medium"
              >
                View Learning Path
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col">
            <span className="text-xs text-text-muted font-medium">Recommended Modules</span>
            <span className="text-xl font-bold text-text-primary mt-1">{recommendations.length}</span>
            <span className="text-[11px] text-teal mt-0.5 font-medium">Catalog Verified</span>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col">
            <span className="text-xs text-text-muted font-medium">Critical Gaps Addressed</span>
            <span className="text-xl font-bold text-rose-600 mt-1">{criticalGapsCount}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Top Priority Modules</span>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col">
            <span className="text-xs text-text-muted font-medium">High Gaps Addressed</span>
            <span className="text-xl font-bold text-amber-600 mt-1">{highGapsCount}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Prioritized Learning</span>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-surface flex flex-col">
            <span className="text-xs text-text-muted font-medium">Marked Interested</span>
            <span className="text-xl font-bold text-teal mt-1">{interestedCount}</span>
            <span className="text-[11px] text-text-muted mt-0.5">Saved for Later</span>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-border rounded-lg">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-text-muted mr-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by Priority:
            </span>
            {['all', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((prio) => (
              <button
                key={prio}
                type="button"
                onClick={() => setFilterPriority(prio)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterPriority.toUpperCase() === prio.toUpperCase()
                    ? 'bg-navy text-white shadow-xs'
                    : 'bg-background hover:bg-border-light text-text-secondary border border-border'
                }`}
              >
                {prio === 'all' ? 'All Priorities' : prio}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-text-muted mr-1">Domain:</span>
            {['all', 'Technical', 'Statistical Methods'].map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setFilterDomain(dom)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterDomain.toLowerCase() === dom.toLowerCase()
                    ? 'bg-teal text-white shadow-xs'
                    : 'bg-background hover:bg-border-light text-text-secondary border border-border'
                }`}
              >
                {dom === 'all' ? 'All Domains' : dom}
              </button>
            ))}
          </div>
        </div>

        {/* Course Cards Grid */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
            <p className="text-sm font-medium text-text-secondary">
              Evaluating skill gaps and matching official courses...
            </p>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-lg bg-surface">
            <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-text-primary">No Courses Found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              No course recommendations match the selected filters. Try clearing filters to see all available modules.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilterPriority('all');
                setFilterDomain('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredRecs.map((rec) => {
              const prioVariant: 'critical' | 'warning' | 'info' | 'neutral' =
                rec.priority === 'CRITICAL'
                  ? 'critical'
                  : rec.priority === 'HIGH'
                  ? 'warning'
                  : rec.priority === 'MODERATE'
                  ? 'info'
                  : 'neutral';

              const isInterestedLoading = actionLoading[rec.course_id];
              const isPathLoading = actionLoading[`path_${rec.course_id}`];

              return (
                <Card
                  key={rec.course_id}
                  className="border border-border bg-surface hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    {/* Top Badges & Match Score */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={prioVariant} size="sm" withDot>
                            {rec.priority} Gap
                          </Badge>
                          {rec.domain && (
                            <Badge variant="neutral" size="sm">
                              {rec.domain}
                            </Badge>
                          )}
                          <span className="text-[11px] font-medium text-text-muted px-1.5 py-0.5 bg-background rounded border border-border">
                            {rec.provider}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ai-light border border-ai-purple/30 text-ai-purple text-xs font-semibold shrink-0">
                          <Sparkles className="w-3 h-3 text-ai-purple" />
                          <span>{rec.recommendation_score}% Match</span>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-bold text-text-primary line-clamp-2 leading-snug">
                        {rec.course_title}
                      </h3>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-3.5 text-xs text-text-secondary mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          {rec.duration_hours} hrs
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-text-muted" />
                          {rec.difficulty}
                        </span>
                      </div>

                      {/* Matching Competencies */}
                      {rec.matching_competencies && rec.matching_competencies.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-medium text-text-muted">Targets:</span>
                          {rec.matching_competencies.map((comp) => (
                            <span
                              key={comp}
                              className="text-[11px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-medium"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Explainable AI Rationale */}
                      <div className="mt-3 p-3 rounded-md bg-background border border-border/80 text-xs text-text-secondary leading-relaxed">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-teal shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-text-primary">Why Recommended: </span>
                            <span>{rec.reason}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-border-light flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Interested Button */}
                        <Button
                          variant={rec.is_interested ? 'teal' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleInterested(rec)}
                          isLoading={isInterestedLoading}
                          leftIcon={
                            rec.is_interested ? (
                              <BookmarkCheck className="w-4 h-4 text-white" />
                            ) : (
                              <Bookmark className="w-4 h-4 text-text-secondary" />
                            )
                          }
                          className="font-medium text-xs"
                          title="Save course to your interested list (does not auto-enroll)"
                        >
                          {rec.is_interested ? 'Interested' : 'Mark Interested'}
                        </Button>

                        {/* Add to Learning Path */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToLearningPath(rec)}
                          isLoading={isPathLoading}
                          disabled={rec.is_in_learning_path}
                          leftIcon={
                            rec.is_in_learning_path ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 text-text-secondary" />
                            )
                          }
                          className={`font-medium text-xs border border-border hover:border-primary/40 ${
                            rec.is_in_learning_path ? 'text-emerald-700 bg-emerald-50 cursor-default' : ''
                          }`}
                        >
                          {rec.is_in_learning_path ? 'In Learning Path' : 'Add to Path'}
                        </Button>
                      </div>

                      {/* Start Learning Action */}
                      <Link href={`/learner/courses/${rec.course_id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          className="font-semibold text-xs px-3.5"
                        >
                          Start Learning
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom Informational Note */}
        <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start gap-3 text-xs text-text-secondary">
          <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Competency Progression Safety Guarantee: </span>
            Browsing recommendations, bookmarking interested courses, or adding modules to your learning path does not automatically advance official competency proficiency ratings. Proficiency levels advance exclusively through verified assessments, assignments, and formal evaluations.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
