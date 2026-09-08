'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { learningPathStages, LearningStageItem } from '@/data/learningPaths';
import {
  CheckCircle2,
  PlayCircle,
  Sparkles,
  Lock,
  Clock,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

export interface LearningJourneyTimelineProps {
  onSelectStage: (stage: LearningStageItem) => void;
  stages?: LearningStageItem[];
}

export function LearningJourneyTimeline({ onSelectStage, stages }: LearningJourneyTimelineProps) {
  const displayStages = stages && stages.length > 0 ? stages : learningPathStages;
  const getStatusBadge = (status: LearningStageItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm" withDot>
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="info" size="sm" withDot>
            In Progress
          </Badge>
        );
      case 'recommended':
        return (
          <Badge variant="teal" size="sm" withDot>
            Recommended
          </Badge>
        );
      case 'upcoming':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Upcoming
          </Badge>
        );
    }
  };

  const getStageAction = (stage: LearningStageItem) => {
    switch (stage.status) {
      case 'completed':
        return { label: 'Review Stage', variant: 'secondary' as const, icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
      case 'in_progress':
        return { label: 'Continue Learning', variant: 'primary' as const, icon: <PlayCircle className="w-3.5 h-3.5" /> };
      case 'recommended':
        return { label: 'Start Course', variant: 'teal' as const, icon: <ArrowRight className="w-3.5 h-3.5" /> };
      case 'upcoming':
      default:
        return { label: 'Locked Stage', variant: 'ghost' as const, icon: <Lock className="w-3.5 h-3.5 text-text-muted" />, disabled: true };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-light">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-text-primary">
            Curated Milestone Progression (Stages 1 – 6)
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Click any milestone stage to inspect module prerequisites, expected competency gains, and syllabus details
          </p>
        </div>
        <Badge variant="neutral" size="sm">
          6 Verified Milestones
        </Badge>
      </div>

      {/* Responsive Journey Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayStages.map((stage) => {
          const action = getStageAction(stage);
          return (
            <Card
              key={stage.stageNumber}
              className="p-5 flex flex-col justify-between border-border transition-all duration-200 hover:border-primary/40 hover:shadow-card-hover bg-surface cursor-pointer group"
              onClick={() => onSelectStage(stage)}
            >
              <div>
                {/* Header: Stage Number & Status Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#123B66] text-white flex items-center justify-center font-mono font-bold text-xs">
                      {stage.stageNumber}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {stage.provider}
                    </Badge>
                  </div>
                  {getStatusBadge(stage.status)}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors mb-1.5 leading-snug">
                  {stage.title}
                </h3>

                <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2 min-h-[32px]">
                  {stage.description}
                </p>

                {/* In-progress bar */}
                {stage.status === 'in_progress' && typeof stage.progress === 'number' && (
                  <div className="mb-3 p-2 bg-[#F5F8FC] rounded border border-border-light">
                    <div className="flex justify-between text-[11px] font-semibold text-primary mb-1">
                      <span>Module Progress</span>
                      <span>{stage.progress}%</span>
                    </div>
                    <ProgressBar value={stage.progress} variant="blue" size="sm" />
                  </div>
                )}

                {/* Competency Impact Metric */}
                <div className="p-2.5 bg-[#F8FAFC] border border-border-light rounded-btn mb-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal" />
                    Target Impact:
                  </span>
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <span className="text-text-secondary">{stage.competencyImpact.competency}</span>
                    <span className="text-text-primary bg-surface px-1.5 py-0.5 rounded border border-border-light">
                      {stage.competencyImpact.from} → {stage.competencyImpact.to}
                    </span>
                  </div>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {stage.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] bg-[#F1F5F9] text-text-secondary px-2 py-0.5 rounded-full border border-border-light font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {stage.skills.length > 3 && (
                    <span className="text-[10px] text-text-muted px-1.5 py-0.5">
                      +{stage.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Duration & Action Button */}
              <div className="pt-3 border-t border-border-light flex items-center justify-between gap-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {stage.duration}
                </span>

                <Button
                  size="sm"
                  variant={action.variant}
                  disabled={action.disabled}
                  leftIcon={action.icon}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStage(stage);
                  }}
                >
                  {action.label}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
