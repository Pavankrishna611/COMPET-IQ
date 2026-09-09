'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Route, 
  ArrowRight, 
  FilterX, 
  BookmarkCheck,
  Compass,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { mockDetailedCourses, DetailedCourse } from '@/data/courses';
import { AppShell } from '@/components/layout/AppShell';
import { 
  CourseSearchAndFilters, 
  CourseFilterState, 
  ExplorerCourseCard 
} from '@/components/courses';
import { courseService } from '@/services';
import type { CourseResponse } from '@/types/api';

const INITIAL_FILTERS: CourseFilterState = {
  searchQuery: '',
  provider: 'all',
  domain: 'all',
  difficulty: 'all',
  durationRange: 'all',
  recommendedOnly: false,
  sortBy: 'aiMatch',
};

const ITEMS_PER_PAGE = 9;

export default function LearnerCoursesPage() {
  const [filters, setFilters] = useState<CourseFilterState>(INITIAL_FILTERS);
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<DetailedCourse[]>(mockDetailedCourses);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchBackendCourses = async () => {
      try {
        setIsLoading(true);
        const res = await courseService.getCourses();
        if (res && res.length > 0) {
          const dynamicCourses: DetailedCourse[] = res.map((c: CourseResponse, idx: number) => {
            const providerVal: DetailedCourse['provider'] = c.provider?.includes('iGOT')
              ? 'iGOT Karmayogi'
              : c.provider?.includes('NSSTA')
              ? 'NSSTA / TPAC'
              : 'COMPETIQ Learning';

            const domainVal: DetailedCourse['domain'] = c.domain?.includes('Tech')
              ? 'Technical'
              : c.domain?.includes('Gov')
              ? 'Digital Governance'
              : c.domain?.includes('Beh')
              ? 'Behavioural'
              : 'Statistical Methods';

            const diffMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
              BEGINNER: 'Beginner',
              INTERMEDIATE: 'Intermediate',
              ADVANCED: 'Advanced',
              Beginner: 'Beginner',
              Intermediate: 'Intermediate',
              Advanced: 'Advanced',
            };

            return {
              id: c.id,
              title: c.title,
              provider: providerVal,
              domain: domainVal,
              difficulty: diffMap[c.difficulty] || 'Intermediate',
              duration: `${c.duration_hours || 12} Hours`,
              durationHours: c.duration_hours || 12,
              rating: 4.8,
              enrolledCount: 142,
              isRecommended: true,
              recommendationScore: 94,
              whyRecommended: 'Aligned with MoSPI official capacity building guidelines.',
              skills: c.competencies && c.competencies.length > 0
                ? c.competencies.map((comp: any) => comp.competency_name)
                : ['Statistical Analysis', 'MoSPI Protocols'],
              description: c.description || 'Comprehensive training module aligned with cadre competency standards.',
              learningObjectives: [
                'Understand core theoretical principles and administrative workflows',
                'Apply practical tools to official survey pipelines',
                'Comply with National Statistical System standards',
              ],
              prerequisites: c.prerequisites?.map((p: any) => p.prerequisite_title) || ['Basic Office Computing'],
              modules: [
                {
                  id: `m-${c.id}-1`,
                  moduleNumber: 1,
                  title: 'Foundations & Concepts',
                  duration: '4 Hours',
                  description: 'Core concepts and background.',
                },
                {
                  id: `m-${c.id}-2`,
                  moduleNumber: 2,
                  title: 'Practical Application',
                  duration: '8 Hours',
                  description: 'Hands-on survey data analysis.',
                },
              ],
              expectedImprovement: {
                competency: c.competencies?.[0]?.competency_name || 'Statistical Domain',
                from: 'Level 2.0',
                to: 'Level 4.0',
              },
              relatedCourseIds: [],
            };
          });

          // Deduplicate by course id or title
          const existingTitles = new Set(dynamicCourses.map((c) => c.title.toLowerCase()));
          const remainingMock = mockDetailedCourses.filter(
            (m) => !existingTitles.has(m.title.toLowerCase())
          );
          setCoursesList([...dynamicCourses, ...remainingMock]);
        }
      } catch (err) {
        console.warn('Using fallback courses list:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackendCourses();
  }, []);

  const handleToggleBookmark = (courseId: string, isSaved: boolean) => {
    const course = coursesList.find((c) => c.id === courseId);
    const title = course ? course.title : 'Course';
    setToastMessage(isSaved ? `Added "${title}" to your saved courses` : `Removed "${title}" from saved courses`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesProvider = course.provider.toLowerCase().includes(query);
        const matchesSkills = course.skills.some((s) => s.toLowerCase().includes(query));
        const matchesDomain = course.domain.toLowerCase().includes(query);
        if (!matchesTitle && !matchesProvider && !matchesSkills && !matchesDomain) {
          return false;
        }
      }

      // Provider filter
      if (filters.provider !== 'all' && course.provider !== filters.provider) {
        return false;
      }

      // Domain filter
      if (filters.domain !== 'all' && course.domain !== filters.domain) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all' && course.difficulty !== filters.difficulty) {
        return false;
      }

      // Duration range filter
      if (filters.durationRange !== 'all') {
        if (filters.durationRange === 'short' && course.durationHours >= 10) return false;
        if (filters.durationRange === 'medium' && (course.durationHours < 10 || course.durationHours > 25)) return false;
        if (filters.durationRange === 'long' && course.durationHours <= 25) return false;
      }

      // Recommended only toggle
      if (filters.recommendedOnly && (!course.isRecommended || course.recommendationScore < 85)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'aiMatch') {
        return b.recommendationScore - a.recommendationScore;
      }
      if (filters.sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (filters.sortBy === 'duration') {
        return a.durationHours - b.durationHours;
      }
      if (filters.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filters, coursesList]);

  const displayedCourses = filteredCourses.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCourses.length;

  return (
    <AppShell
      title="Course Explorer"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Course Catalog' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <BookmarkCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="teal" size="sm" className="font-mono text-[11px]">
              Unified Catalog: iGOT + NSSTA
            </Badge>
            <span className="text-xs text-text-muted">MoSPI Capacity Building</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Course Explorer
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-3xl">
            Browse and discover MoSPI-aligned courses from iGOT Karmayogi, NSSTA, and specialized official statistical training programs.
          </p>
        </div>

        {/* Link to Personalized Learning Path */}
        <Link href="/learner/learning-path" className="shrink-0">
          <Button variant="secondary" size="sm" className="text-xs font-semibold gap-2 border-border hover:border-primary/40 hover:bg-surface-elevated text-text-primary">
            <Route className="w-3.5 h-3.5 text-primary" />
            View Your Learning Path
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Structured Roadmap Callout Banner */}
      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border bg-surface shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary-light text-primary border border-primary/20 shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Personalized Learning Trajectory Active
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">
              You have an active roadmap targeting your key competency gaps.
            </p>
          </div>
        </div>

        <Link href="/learner/learning-path" className="shrink-0">
          <Button variant="teal" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs font-semibold whitespace-nowrap shadow-sm">
            Continue Stage 2: Python Analysis
          </Button>
        </Link>
      </Card>

      {/* Filter and Search Controls */}
      <CourseSearchAndFilters
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setVisibleCount(ITEMS_PER_PAGE);
        }}
        totalCourses={coursesList.length}
        filteredCount={filteredCourses.length}
      />

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((course) => (
              <ExplorerCourseCard
                key={course.id}
                course={course}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="secondary"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="px-6 py-2.5 text-xs font-semibold text-text-secondary border-border hover:bg-surface-elevated hover:text-text-primary"
              >
                Load More Courses ({filteredCourses.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-surface border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-card">
          <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-text-muted">
            <FilterX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              No courses found
            </h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              We couldn&apos;t find any courses matching your active filter criteria. Try expanding your search or clearing filters.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="text-xs font-semibold"
          >
            Reset All Filters
          </Button>
        </div>
      )}
      </div>
    </AppShell>
  );
}
