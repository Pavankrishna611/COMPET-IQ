'use client';

import React from 'react';
import Link from 'next/link';
import { DetailedCourse } from '@/data/courses';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Milestone, 
  Target,
  CheckCircle2,
  Compass
} from 'lucide-react';

interface CourseRecommendationPanelProps {
  course: DetailedCourse;
}

export function CourseRecommendationPanel({ course }: CourseRecommendationPanelProps) {
  return (
    <div className="space-y-6">
      {/* Primary AI Recommendation Card */}
      {course.isRecommended && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 border border-indigo-700/50 shadow-md relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                COMPETIQ Intelligence Match
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-xs font-mono font-bold text-white">
              <span>{course.recommendationScore}%</span>
              <span className="text-[10px] text-indigo-200">Score</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-white mb-2">
            Why COMPETIQ Recommends This Course
          </h3>
          <p className="text-xs text-indigo-100/90 leading-relaxed mb-5">
            {course.whyRecommended}
          </p>

          {/* Expected Competency Improvement */}
          {course.expectedImprovement && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                  Targeted Competency Gain
                </span>
              </div>
              <p className="text-xs font-bold text-white mb-3">
                {course.expectedImprovement.competency}
              </p>

              {/* Visual Before -> After Progression */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/10 rounded-lg p-2.5 text-center border border-white/5">
                  <span className="block text-[10px] text-slate-300 uppercase">Current</span>
                  <span className="text-xs font-bold text-slate-200">
                    {course.expectedImprovement.from}
                  </span>
                </div>

                <div className="p-1.5 rounded-full bg-indigo-500/30 text-indigo-200">
                  <ArrowRight className="w-4 h-4" />
                </div>

                <div className="flex-1 bg-emerald-500/20 rounded-lg p-2.5 text-center border border-emerald-400/30">
                  <span className="block text-[10px] text-emerald-300 uppercase">Target</span>
                  <span className="text-xs font-bold text-emerald-300">
                    {course.expectedImprovement.to}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Aligned Skill Gap Tag */}
          <div className="flex items-center gap-2 text-xs text-indigo-200/90">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Directly addresses high-priority MoSPI workforce gap</span>
          </div>
        </div>
      )}

      {/* Learning Path Context Card */}
      {course.learningPathStep ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Milestone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Personalized Pathway Context
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
            Stage {course.learningPathStep.stepNumber} of {course.learningPathStep.totalSteps}: {course.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Curated part of your journey in{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {course.learningPathStep.pathTitle}
            </span>
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-600 dark:text-slate-400">Path Status</span>
              <Badge variant={course.learningPathStep.statusText === 'Completed' ? 'success' : 'info'} size="sm">
                {course.learningPathStep.statusText}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Completion unlocks the subsequent milestone in your career development trajectory.
            </p>
          </div>

          <Link href="/learner/learning-path">
            <Button variant="secondary" size="sm" className="w-full text-xs font-semibold gap-1.5 justify-center">
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              View Full Learning Path
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Learning Path Status
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            This course is available in the general MoSPI catalog as an elective enrichment module.
          </p>
          <Link href="/learner/learning-path">
            <Button variant="secondary" size="sm" className="w-full text-xs font-semibold gap-1.5 justify-center">
              Explore Your Main Learning Path
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
