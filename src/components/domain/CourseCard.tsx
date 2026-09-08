import React from 'react';
import { cn } from '@/lib/utils';
import { Course } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Clock, BookOpen, Award } from 'lucide-react';

export interface CourseCardProps {
  course: Course;
  onView?: (courseId: string) => void;
  className?: string;
}

export function CourseCard({ course, onView, className }: CourseCardProps) {
  const providerBadges: Record<string, 'info' | 'teal' | 'neutral' | 'success'> = {
    NSSTA: 'info',
    'iGOT Karmayogi': 'teal',
    'ISI Kolkata': 'neutral',
    'MoSPI Internal': 'success',
  };

  return (
    <Card hoverable className={cn('flex flex-col justify-between p-5', className)}>
      <div>
        {/* Top meta */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <Badge variant={providerBadges[course.provider] || 'neutral'} size="sm">
            {course.provider}
          </Badge>
          {course.recommendationScore && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal bg-teal-light px-2 py-0.5 rounded">
              <Award className="w-3 h-3 text-teal" />
              {course.recommendationScore}% Match
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2 leading-snug">
          {course.title}
        </h4>

        {/* Description if present */}
        {course.description && (
          <p className="text-xs text-text-secondary line-clamp-2 mb-3 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[11px] bg-[#F0F4F8] text-text-secondary px-2 py-0.5 rounded font-medium"
            >
              {skill}
            </span>
          ))}
          {course.skills.length > 3 && (
            <span className="text-[11px] text-text-muted self-center">
              +{course.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-3 border-t border-border-light flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.difficulty}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onView?.(course.id)}
        >
          View Course
        </Button>
      </div>
    </Card>
  );
}
