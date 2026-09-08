'use client';

import React from 'react';
import Link from 'next/link';
import { DetailedAssessmentItem } from '@/data/assessments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  RotateCcw,
  Award,
  Sparkles
} from 'lucide-react';

interface AssessmentCardProps {
  assessment: DetailedAssessmentItem;
}

export function AssessmentCard({ assessment }: AssessmentCardProps) {
  const getDifficultyBadge = (difficulty: DetailedAssessmentItem['difficulty']) => {
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

  const getStatusBadge = (status: DetailedAssessmentItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm" withDot>
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="warning" size="sm" withDot>
            In Progress
          </Badge>
        );
      case 'available':
      default:
        return (
          <Badge variant="teal" size="sm" withDot>
            Available
          </Badge>
        );
    }
  };

  return (
    <Card className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover bg-surface group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-primary bg-primary-light/60 px-2.5 py-0.5 rounded-full border border-primary/20">
              {assessment.competency}
            </span>
            {getDifficultyBadge(assessment.difficulty)}
          </div>
          {getStatusBadge(assessment.status)}
        </div>

        {/* Assessment Name */}
        <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1.5 leading-snug">
          {assessment.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-4">
          {assessment.description}
        </p>

        {/* Meta Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary mb-4 pb-3 border-b border-border-light">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-semibold text-text-primary">{assessment.questionsCount}</span>
            <span>Questions</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span className="font-semibold text-text-primary">{assessment.durationMinutes}</span>
            <span>Minutes</span>
          </div>

          {assessment.status === 'completed' && typeof assessment.score === 'number' && (
            <div className="flex items-center gap-1.5 ml-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Award className="w-3.5 h-3.5" />
              <span>Score: {assessment.score}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Last Attempt & Action CTA */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-text-muted truncate max-w-[170px]">
          {assessment.lastAttemptDate || 'Not yet attempted'}
        </span>

        {assessment.status === 'in_progress' ? (
          <Link href={assessment.actionRoute}>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
              className="text-xs font-semibold shadow-sm"
            >
              Continue Assessment
            </Button>
          </Link>
        ) : assessment.status === 'completed' ? (
          <Link href={assessment.actionRoute}>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs font-semibold"
            >
              Review Result
            </Button>
          </Link>
        ) : (
          <Link href={assessment.actionRoute}>
            <Button
              size="sm"
              variant="teal"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-semibold shadow-sm"
            >
              Start Assessment
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
