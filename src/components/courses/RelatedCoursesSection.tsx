'use client';

import React from 'react';
import Link from 'next/link';
import { DetailedCourse, mockDetailedCourses } from '@/data/courses';
import { Badge } from '@/components/ui/Badge';
import { Clock, Star, ArrowRight, Sparkles } from 'lucide-react';

interface RelatedCoursesSectionProps {
  currentCourseId: string;
  relatedCourseIds?: string[];
}

export function RelatedCoursesSection({
  currentCourseId,
  relatedCourseIds = [],
}: RelatedCoursesSectionProps) {
  // Find courses matching relatedCourseIds, or fallback to courses in the same domain
  let related = mockDetailedCourses.filter((c) =>
    relatedCourseIds.includes(c.id) && c.id !== currentCourseId
  );

  if (related.length === 0) {
    const currentCourse = mockDetailedCourses.find((c) => c.id === currentCourseId);
    related = mockDetailedCourses
      .filter((c) => c.id !== currentCourseId && (!currentCourse || c.domain === currentCourse.domain))
      .slice(0, 3);
  }

  // Ensure at most 3
  related = related.slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Recommended Complementary Courses
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Courses that pair effectively with this subject or continue your specialization.
          </p>
        </div>

        <Link
          href="/learner/courses"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
        >
          View all courses
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {related.map((course) => (
          <Link
            key={course.id}
            href={`/learner/courses/${course.id}`}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {course.provider}
                </span>
                {course.isRecommended && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    {course.recommendationScore}% Match
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                {course.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {course.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{course.rating.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
