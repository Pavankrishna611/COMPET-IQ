'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DetailedCourse } from '@/data/courses';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Clock, 
  Layers, 
  Star, 
  Bookmark, 
  ArrowRight,
  GraduationCap
} from 'lucide-react';

interface ExplorerCourseCardProps {
  course: DetailedCourse;
  onToggleBookmark?: (courseId: string, isSaved: boolean) => void;
  isInitiallySaved?: boolean;
}

export function ExplorerCourseCard({
  course,
  onToggleBookmark,
  isInitiallySaved = false,
}: ExplorerCourseCardProps) {
  const [isSaved, setIsSaved] = useState(isInitiallySaved);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isSaved;
    setIsSaved(nextState);
    if (onToggleBookmark) {
      onToggleBookmark(course.id, nextState);
    }
  };

  const providerBadgeStyles: Record<string, string> = {
    'iGOT Karmayogi': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    'NSSTA / TPAC': 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    'COMPETIQ Learning': 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                providerBadgeStyles[course.provider] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {course.provider}
            </span>
            <Badge variant="neutral" size="sm">
              {course.domain}
            </Badge>
          </div>

          <button
            type="button"
            onClick={handleBookmark}
            title={isSaved ? 'Remove from saved' : 'Save course'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isSaved
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <Link href={`/learner/courses/${course.id}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1.5">
            {course.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {course.description}
        </p>

        {/* Meta Stats Row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{course.modules.length} Modules</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">{course.rating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400">({course.enrolledCount})</span>
          </div>
        </div>

        {/* Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md"
            >
              {skill}
            </span>
          ))}
          {course.skills.length > 3 && (
            <span className="text-[10px] font-medium text-slate-400 self-center">
              +{course.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div>
        {/* AI Recommendation Snippet (if recommended) */}
        {course.isRecommended && (
          <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                AI Recommendation
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
                {course.recommendationScore}% Match
              </span>
            </div>
            <p className="text-[11px] text-indigo-950 dark:text-indigo-200/90 leading-snug line-clamp-2">
              {course.whyRecommended}
            </p>
          </div>
        )}

        {/* Card Footer: Difficulty & View Action */}
        <div className="flex items-center justify-between pt-2">
          <Badge
            variant={
              course.difficulty === 'Beginner'
                ? 'success'
                : course.difficulty === 'Intermediate'
                ? 'info'
                : 'warning'
            }
            size="sm"
          >
            {course.difficulty}
          </Badge>

          <Link href={`/learner/courses/${course.id}`}>
            <Button variant="secondary" size="sm" className="group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all text-xs font-semibold gap-1.5">
              View Course
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
