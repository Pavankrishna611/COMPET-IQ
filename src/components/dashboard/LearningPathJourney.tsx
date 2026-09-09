'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { learnerLearningPathSteps, LearningJourneyStep } from '@/data/dashboard';
import {
  CheckCircle2,
  PlayCircle,
  Sparkles,
  CircleDashed,
  ArrowRight,
  Clock,
  BookOpen,
  Route,
} from 'lucide-react';

export function LearningPathJourney({ steps }: { steps?: LearningJourneyStep[] }) {
  const displaySteps = steps && steps.length > 0 ? steps : learnerLearningPathSteps;
  const getStatusBadge = (status: LearningJourneyStep['status']) => {
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
          <Badge variant="ai" size="sm" withDot>
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

  const getStepIcon = (status: LearningJourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-white animate-pulse" />;
      case 'recommended':
        return <Sparkles className="w-4 h-4 text-ai-purple" />;
      case 'upcoming':
      default:
        return <CircleDashed className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStepCircleClass = (status: LearningJourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white border-success';
      case 'in_progress':
        return 'bg-primary text-white border-primary shadow-sm shadow-primary/30 ring-4 ring-primary/10';
      case 'recommended':
        return 'bg-ai-light text-ai-purple border-ai-purple/40';
      case 'upcoming':
      default:
        return 'bg-[#F5F8FC] text-text-muted border-border';
    }
  };

  return (
    <Card className="p-5 lg:p-6 border-border shadow-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border-light">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              Your AI-Powered Learning Path
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Recommended based on your role, competency gaps and learning history.
            </p>
          </div>
        </div>

        <Link href="/learner/learning-path" className="self-start sm:self-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Full Learning Path
          </Button>
        </Link>
      </div>

      {/* Steps Journey Container */}
      <div className="pt-6">
        {steps !== undefined && steps.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center">
              <Route className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-text-primary">No Active Learning Path Yet</h3>
              <p className="text-xs text-text-secondary mt-1">
                Generate a personalized learning journey based on your cadre and current skill requirements.
              </p>
            </div>
            <Link href="/learner/learning-path">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Generate Learning Path
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Horizontal View (lg+) */}
            <div className="hidden lg:grid grid-cols-5 gap-3 relative">

              {/* Connector Line behind steps */}
              <div className="absolute top-5 left-8 right-8 h-0.5 bg-border -z-0" />

              {displaySteps.map((step, idx) => (
                <div key={step.stepNumber} className="relative z-10 flex flex-col items-center text-center">
                  {/* Step indicator node */}
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-transform hover:scale-105 ${getStepCircleClass(
                      step.status
                    )}`}
                  >
                    {getStepIcon(step.status)}
                  </div>

                  {/* Step Card Content */}
                  <div className="w-full bg-[#F8FAFC] border border-border-light rounded-btn p-3.5 flex flex-col justify-between min-h-[190px] transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover text-left">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase font-mono">
                          Step {step.stepNumber}
                        </span>
                        {getStatusBadge(step.status)}
                      </div>

                      <h4 className="text-xs font-bold text-text-primary mb-1 line-clamp-2 leading-snug">
                        {step.title}
                      </h4>

                      <span className="text-[11px] text-text-secondary block mb-2 font-medium">
                        {step.provider}
                      </span>
                    </div>

                    <div>
                      {step.status === 'in_progress' && typeof step.progress === 'number' && (
                        <div className="mb-2.5">
                          <div className="flex justify-between text-[10px] font-semibold text-primary mb-1">
                            <span>Progress</span>
                            <span>{step.progress}%</span>
                          </div>
                          <ProgressBar value={step.progress} variant="blue" size="sm" />
                        </div>
                      )}

                      <div className="pt-2 border-t border-border-light/70 flex items-center justify-between text-[10px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.duration}
                        </span>
                        <span className="truncate max-w-[80px] font-medium text-text-secondary" title={step.skill}>
                          {step.skill}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile & Tablet Vertical View (< lg) */}
            <div className="lg:hidden relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {displaySteps.map((step) => (
                <div key={step.stepNumber} className="relative">
                  {/* Timeline Node */}
                  <div
                    className={`absolute -left-6 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${getStepCircleClass(
                      step.status
                    )}`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : step.status === 'in_progress' ? (
                      <PlayCircle className="w-3 h-3 text-white" />
                    ) : step.status === 'recommended' ? (
                      <Sparkles className="w-3 h-3 text-ai-purple" />
                    ) : (
                      <span className="text-[9px] font-bold text-text-muted">{step.stepNumber}</span>
                    )}
                  </div>

                  {/* Step Card */}
                  <div className="bg-[#F8FAFC] border border-border-light rounded-btn p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-text-muted uppercase">
                        Step {step.stepNumber} • {step.provider}
                      </span>
                      {getStatusBadge(step.status)}
                    </div>

                    <h4 className="text-sm font-bold text-text-primary mb-1">
                      {step.title}
                    </h4>

                    {step.status === 'in_progress' && typeof step.progress === 'number' && (
                      <div className="my-2 max-w-xs">
                        <div className="flex justify-between text-xs font-semibold text-primary mb-1">
                          <span>In Progress</span>
                          <span>{step.progress}%</span>
                        </div>
                        <ProgressBar value={step.progress} variant="blue" size="sm" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {step.duration}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-text-secondary">
                        <BookOpen className="w-3.5 h-3.5 text-teal" />
                        {step.skill}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );

}
