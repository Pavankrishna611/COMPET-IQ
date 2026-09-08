'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CourseRecommendationItem, topAiCourseRecommendations } from '@/data/dashboard';
import { Sparkles, Clock, ArrowRight, BookOpen, Layers } from 'lucide-react';

export interface DashboardCourseCardProps {
  course: CourseRecommendationItem;
}

export function DashboardCourseCard({ course }: DashboardCourseCardProps) {
  return (
    <Card className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover bg-surface">
      <div>
        {/* Top Header: Provider & AI Match Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="neutral" size="sm">
            {course.provider}
          </Badge>
          <Badge variant="ai" size="sm" withDot>
            <Sparkles className="w-3 h-3 text-ai-purple mr-1 inline" />
            {course.matchScore}% Match
          </Badge>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {/* Metadata Badges: Difficulty & Duration */}
        <div className="flex items-center gap-2 mb-3.5 text-xs text-text-muted">
          <Badge variant="info" size="sm">
            {course.difficulty}
          </Badge>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration}
          </span>
        </div>

        {/* AI Rationale Box */}
        <div className="p-3 bg-gradient-to-r from-ai-light/40 to-teal-light/20 border border-ai-purple/20 rounded-btn mb-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ai-purple mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Why Recommended</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {course.whyRecommended}
          </p>
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {course.skills.map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-medium bg-[#F1F5F9] text-text-secondary px-2 py-0.5 rounded-full border border-border-light"
            >
              #{skill}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-border-light flex items-center justify-between">
        <span className="text-xs text-text-muted flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-teal" />
          Interactive Module
        </span>

        <Link href="/learner/courses">
          <Button
            size="sm"
            variant="primary"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Course
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function RecommendationsSection() {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              Top AI Recommendations
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Learning opportunities selected specifically for your competency profile.
            </p>
          </div>
        </div>

        <Link href="/learner/courses">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Explore All Recommendations
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topAiCourseRecommendations.map((course) => (
          <DashboardCourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
