'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { recommendationService } from '@/services';
import type { InterestedCourseResponse } from '@/types/api';
import {
  BookmarkCheck,
  BookOpen,
  Trash2,
  PlayCircle,
  Plus,
  Check,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';

export default function InterestedCoursesPage() {
  const [courses, setCourses] = useState<InterestedCourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadInterestedCourses = async () => {
    try {
      setIsLoading(true);
      const data = await recommendationService.getInterestedCourses();
      setCourses(data);
    } catch (err: any) {
      console.error('Failed to load interested courses:', err);
      showToast('Could not load interested courses. Please refresh.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterestedCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleRemove = async (item: InterestedCourseResponse) => {
    const courseId = item.course_id;
    setActionLoading((prev) => ({ ...prev, [courseId]: true }));
    try {
      await recommendationService.removeCourseInterested(courseId);
      setCourses((prev) => prev.filter((c) => c.course_id !== courseId));
      showToast(`Removed "${item.course_title}" from interested courses.`, 'info');
    } catch (err: any) {
      console.error('Failed to remove interested course:', err);
      showToast('Failed to remove course from interested list.', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAddToLearningPath = async (item: InterestedCourseResponse) => {
    const courseId = item.course_id;
    if (item.is_in_learning_path) return;

    setActionLoading((prev) => ({ ...prev, [`path_${courseId}`]: true }));
    try {
      await recommendationService.addToLearningPath(courseId);
      setCourses((prev) =>
        prev.map((c) => (c.course_id === courseId ? { ...c, is_in_learning_path: true } : c))
      );
      showToast(`Added "${item.course_title}" to your active learning path!`, 'success');
    } catch (err: any) {
      console.error('Failed to add course to learning path:', err);
      showToast(err?.response?.data?.detail || 'Course is already in your learning path.', 'info');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`path_${courseId}`]: false }));
    }
  };

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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                Part 9E — Saved For Later
              </span>
              <Badge variant="teal" size="sm">
                Bookmarked
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Interested Courses
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Curated modules you have marked for future study. Bookmark courses without enrolling automatically, and add them to your personalized learning path whenever you are ready.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/learner/recommendations">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="font-medium"
              >
                Browse AI Recommendations
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
            <p className="text-sm font-medium text-text-secondary">
              Loading your interested courses...
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-lg bg-surface max-w-xl mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal flex items-center justify-center mx-auto mb-4 border border-teal-200">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No Interested Courses Yet</h3>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              When exploring course recommendations, click <span className="font-semibold text-text-primary">&quot;Mark Interested&quot;</span> to save modules you want to review or take later.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/learner/recommendations">
                <Button variant="teal" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Explore Recommendations
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-text-muted px-1">
              <span>{courses.length} course{courses.length === 1 ? '' : 's'} saved</span>
              <span>Sorted by recently marked</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {courses.map((item) => {
                const isRemoving = actionLoading[item.course_id];
                const isAddingPath = actionLoading[`path_${item.course_id}`];
                const markedDate = item.marked_at
                  ? new Date(item.marked_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '';

                return (
                  <Card
                    key={item.id || item.course_id}
                    className="border border-border bg-surface hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        {/* Badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-text-muted px-1.5 py-0.5 bg-background rounded border border-border">
                              {item.provider}
                            </span>
                            {item.domain && (
                              <Badge variant="neutral" size="sm">
                                {item.domain}
                              </Badge>
                            )}
                            <Badge variant="teal" size="sm">
                              {item.difficulty}
                            </Badge>
                          </div>

                          {markedDate && (
                            <span className="text-[11px] text-text-muted">
                              Saved {markedDate}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-text-primary line-clamp-2 leading-snug">
                          {item.course_title}
                        </h3>

                        {/* Metadata */}
                        <div className="flex items-center gap-3.5 text-xs text-text-secondary mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            {item.duration_hours} hrs
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-text-muted" />
                            {item.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-border-light flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(item)}
                            isLoading={isRemoving}
                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            className="font-medium text-xs text-rose-600 hover:bg-rose-50 border border-border"
                            title="Remove from interested courses"
                          >
                            Remove
                          </Button>

                          {/* Add to Learning Path */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddToLearningPath(item)}
                            isLoading={isAddingPath}
                            disabled={item.is_in_learning_path}
                            leftIcon={
                              item.is_in_learning_path ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-text-secondary" />
                              )
                            }
                            className={`font-medium text-xs ${
                              item.is_in_learning_path
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-300 cursor-default'
                                : ''
                            }`}
                          >
                            {item.is_in_learning_path ? 'In Path' : 'Add to Path'}
                          </Button>
                        </div>

                        {/* Start Learning */}
                        <Link href={`/learner/courses/${item.course_id}`}>
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
          </div>
        )}

        {/* Safety Note */}
        <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-100 flex items-start gap-3 text-xs text-text-secondary">
          <Info className="w-4 h-4 text-teal shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-text-primary">Safe Exploration: </span>
            Marking a course as interested or removing it from your bookmarks does not alter your official competency ratings or enrollment status.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
