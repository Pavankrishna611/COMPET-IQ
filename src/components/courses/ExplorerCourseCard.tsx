'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DetailedCourse } from '@/data/courses';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Clock, 
  Layers, 
  Star, 
  Bookmark, 
  ArrowRight,
  BookOpen
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

  const getDifficultyBadge = (difficulty: DetailedCourse['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return <Badge variant="success" size="sm">Beginner</Badge>;
      case 'Intermediate':
        return <Badge variant="info" size="sm">Intermediate</Badge>;
      case 'Advanced':
        return <Badge variant="warning" size="sm">Advanced</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{difficulty}</Badge>;
    }
  };

  return (
    <Card className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover bg-surface group">
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {course.provider.includes('iGOT') || course.provider.includes('NSSTA') ? (
              <Badge variant="teal" size="sm" withDot className="font-bold">
                {course.provider}
              </Badge>
            ) : (
              <span className="text-[11px] font-bold text-primary bg-primary-light/60 px-2.5 py-0.5 rounded-full border border-primary/20">
                {course.provider}
              </span>
            )}
            <span className="text-[11px] font-medium text-text-secondary bg-surface-elevated px-2.5 py-0.5 rounded-full border border-border-light">
              {course.domain}
            </span>
            {getDifficultyBadge(course.difficulty)}
          </div>

          <div className="flex items-center gap-1.5">
            {course.isRecommended && (
              <Badge variant="ai" size="sm" className="font-bold gap-1 text-[10px]">
                <Sparkles className="w-3 h-3 text-ai-purple" />
                {course.recommendationScore}% Fit
              </Badge>
            )}

            <button
              type="button"
              onClick={handleBookmark}
              title={isSaved ? 'Remove from saved' : 'Save course'}
              className={`p-1.5 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                  : 'bg-surface-elevated border-border text-text-muted hover:text-text-primary'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Course Title */}
        <Link href={`/learner/courses/${course.id}`} className="block">
          <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1.5 leading-snug line-clamp-1">
            {course.title}
          </h3>
        </Link>

        {/* Provider Line */}
        <p className="text-[11px] text-text-muted mb-2">
          Provider / Academy: <strong className="text-text-secondary">{course.provider}</strong>
        </p>

        {/* Description */}
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">
          {course.description}
        </p>

        {/* Meta Stats Row (matching AssessmentCard) */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mb-4 pb-3 border-b border-border-light">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-semibold text-text-primary">{course.modules.length}</span>
            <span>Modules</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-semibold text-text-primary">{course.duration}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-text-primary">{course.rating.toFixed(1)}</span>
            <span className="text-[10px] text-text-muted">({course.enrolledCount})</span>
          </div>
        </div>

        {/* AI Recommendation Box (if recommended) */}
        {course.isRecommended && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-ai-purple/10 via-teal-light/20 to-transparent border border-ai-purple/20 flex items-start gap-2.5">
            <div className="p-1 rounded-lg bg-ai-purple/10 text-ai-purple shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[11px] font-bold text-ai-purple">
                  AI Competency Gap Recommendation
                </span>
                <span className="text-[10px] font-bold text-ai-purple font-mono bg-ai-purple/10 px-1.5 py-0.5 rounded">
                  {course.recommendationScore}% Match
                </span>
              </div>
              <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                {course.whyRecommended}
              </p>
            </div>
          </div>
        )}

        {/* Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-medium bg-surface-elevated border border-border text-text-secondary px-2 py-0.5 rounded-md"
            >
              {skill}
            </span>
          ))}
          {course.skills.length > 3 && (
            <span className="text-[10px] font-medium text-text-muted self-center">
              +{course.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: Focus Competency & Action CTA */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-light">
        <span className="text-[11px] text-text-muted truncate max-w-[170px]">
          {course.skills[0] ? `Focus: ${course.skills[0]}` : course.domain}
        </span>

        <Link href={`/learner/courses/${course.id}`}>
          <Button
            size="sm"
            variant="teal"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-sm"
          >
            View Course
          </Button>
        </Link>
      </div>
    </Card>
  );
}
