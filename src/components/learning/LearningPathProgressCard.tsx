'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { learningPathProgressStats } from '@/data/learningPaths';
import { CheckCircle2, PlayCircle, Clock, BookOpen, Layers } from 'lucide-react';

export interface LearningPathProgressCardProps {
  stats?: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    progressPercentage: number;
    currentStage?: number;
    totalStages?: number;
  };
}

export function LearningPathProgressCard({ stats }: LearningPathProgressCardProps = {}) {
  const completed = stats ? stats.completedCourses : learningPathProgressStats.completedCourses;
  const total = stats ? stats.totalCourses : learningPathProgressStats.totalCourses;
  const inProgress = stats ? stats.inProgressCourses : learningPathProgressStats.inProgressCourses;
  const percent = stats ? Math.round(stats.progressPercentage) : Math.round(
    (learningPathProgressStats.completedCourses / learningPathProgressStats.totalCourses) * 100
  );
  const stageDisplay = stats?.currentStage ? `Stage ${stats.currentStage} of ${stats.totalStages || 6}` : 'Stage 2 of 6';

  return (
    <Card className="p-5 border-border shadow-card bg-surface flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-light mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Pathway Progress Summary
              </CardTitle>
              <CardDescription className="text-[11px] text-text-secondary">
                Milestone tracking across official stages
              </CardDescription>
            </div>
          </div>

          <Badge variant="teal" size="sm" withDot>
            {stageDisplay}
          </Badge>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="p-3 bg-[#F8FAFC] border border-border-light rounded-btn text-center">
            <span className="text-[10px] text-text-muted uppercase font-bold block mb-0.5">
              Completed
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-base font-bold text-text-primary font-mono">
                {completed} / {total}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-border-light rounded-btn text-center">
            <span className="text-[10px] text-text-muted uppercase font-bold block mb-0.5">
              In Progress
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-primary" />
              <span className="text-base font-bold text-primary font-mono">
                {inProgress} {inProgress === 1 ? 'Course' : 'Courses'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs font-semibold text-text-secondary">
            <span>Overall Pathway Completion</span>
            <span className="text-primary font-bold">{percent}%</span>
          </div>
          <ProgressBar value={percent} variant="teal" size="sm" />
        </div>

        {/* Next Recommendation */}
        <div className="p-2.5 bg-surface border border-border-light rounded-btn flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal shrink-0" />
            <span className="text-text-muted">Next Target:</span>
            <span className="font-bold text-text-primary truncate max-w-[150px]">
              {learningPathProgressStats.recommendedNext}
            </span>
          </div>
          <span className="text-[10px] text-ai-purple font-semibold bg-ai-purple/10 px-1.5 py-0.5 rounded">
            Stage 3
          </span>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-border-light flex items-center justify-between text-[11px] text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-teal" />
          Est. Completion:
        </span>
        <span className="font-mono font-bold text-text-primary">
          {learningPathProgressStats.estimatedCompletion}
        </span>
      </div>
    </Card>
  );
}
