'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Sparkles, 
  Route, 
  ArrowRight, 
  FilterX, 
  BookmarkCheck,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { mockDetailedCourses, DetailedCourse } from '@/data/courses';
import { AppShell } from '@/components/layout/AppShell';
import { 
  CourseSearchAndFilters, 
  CourseFilterState, 
  ExplorerCourseCard 
} from '@/components/courses';

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

  const handleToggleBookmark = (courseId: string, isSaved: boolean) => {
    const course = mockDetailedCourses.find((c) => c.id === courseId);
    const title = course ? course.title : 'Course';
    setToastMessage(isSaved ? `Added "${title}" to your saved courses` : `Removed "${title}" from saved courses`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    return mockDetailedCourses.filter((course) => {
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
  }, [filters]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="neutral" size="sm" className="font-mono text-[11px]">
              Unified Catalog: iGOT + NSSTA
            </Badge>
            <span className="text-xs text-slate-400">MoSPI Capacity Building</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Course Explorer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Browse and discover MoSPI-aligned courses from iGOT Karmayogi, NSSTA, and specialized official statistical training programs.
          </p>
        </div>

        {/* Link to Personalized Learning Path */}
        <Link href="/learner/learning-path" className="shrink-0">
          <Button variant="secondary" size="sm" className="text-xs font-semibold gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
            <Route className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            View Your Learning Path
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Structured Roadmap Callout Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-transparent border border-indigo-200 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personalized Learning Trajectory Active
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You have an active 6-stage roadmap targeting your 4 key skill gaps.
            </p>
          </div>
        </div>

        <Link href="/learner/learning-path">
          <Button variant="primary" size="sm" className="text-xs font-semibold whitespace-nowrap">
            Continue Stage 2: Python Analysis
          </Button>
        </Link>
      </div>

      {/* Filter and Search Controls */}
      <CourseSearchAndFilters
        filters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
          setVisibleCount(ITEMS_PER_PAGE);
        }}
        totalCourses={mockDetailedCourses.length}
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
                className="px-6 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Load More Courses ({filteredCourses.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FilterX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No courses found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
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
