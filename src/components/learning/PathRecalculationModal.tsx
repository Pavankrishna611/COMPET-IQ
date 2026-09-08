'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  TrendingUp, 
  BrainCircuit, 
  BookOpen, 
  ListOrdered 
} from 'lucide-react';

interface PathRecalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface StepItem {
  id: number;
  label: string;
  icon: React.ElementType;
  detail: string;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    label: 'Analyzing recent competency updates...',
    icon: BrainCircuit,
    detail: 'Evaluated 12 core competencies across 4 domains'
  },
  {
    id: 2,
    label: 'Checking 4 identified skill gaps...',
    icon: TrendingUp,
    detail: 'Prioritized Python (1.4 gap), GIS (1.5 gap), Data Viz (1.4 gap), and SQL (0.9 gap)'
  },
  {
    id: 3,
    label: 'Matching with iGOT Karmayogi & NSSTA course catalogs...',
    icon: BookOpen,
    detail: 'Re-indexed 17 validated courses aligned with MoSPI competency framework'
  },
  {
    id: 4,
    label: 'Optimizing prerequisite sequencing...',
    icon: ListOrdered,
    detail: 'Sequenced: Python Core → Advanced Stats → GIS Mapping → Project Capstone'
  },
  {
    id: 5,
    label: 'Learning path updated successfully!',
    icon: CheckCircle2,
    detail: 'Path confidence score recalculated from 94% to 96%'
  },
];

export function PathRecalculationModal({
  isOpen,
  onClose,
  onComplete,
}: PathRecalculationModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setIsFinished(false);
      return;
    }

    // Run progressive steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        setIsFinished(true);
        clearInterval(interval);
      }
    }, 700);

    return () => clearInterval(interval);
  }, [isOpen]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + (isFinished ? 1 : 0.4)) / STEPS.length) * 100)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Path Recalculation"
      description="COMPETIQ Intelligence Engine is re-evaluating your competency gaps and optimizing your course sequence."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-mono">
            Algorithm: NSSTA-COMPETIQ-v2.4
          </span>
          <Button
            variant={isFinished ? 'primary' : 'secondary'}
            onClick={() => {
              if (onComplete) onComplete();
              onClose();
            }}
          >
            {isFinished ? 'Apply & View Updated Path' : 'Cancel'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Progress Bar & Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isFinished ? 'Optimization Complete' : 'Optimizing Learning Trajectory...'}
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sequential Steps List */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || isFinished;
            const isCurrent = idx === currentStepIndex && !isFinished;
            const isPending = idx > currentStepIndex;

            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-lg border transition-all duration-300 flex items-start gap-3.5 ${
                  isCurrent
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm'
                    : isCompleted
                    ? 'bg-white dark:bg-slate-900/50 border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/60 dark:border-slate-800/40 opacity-50'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                      {step.id}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent
                          ? 'text-indigo-950 dark:text-indigo-200 font-semibold'
                          : isCompleted
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCompleted && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Callout */}
        {isFinished && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    Pathway Recalibrated & Synced
                  </h4>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Confidence score increased from 94% to 96% based on MoSPI 2026 Q3 requirements.
                  </p>
                </div>
              </div>
              <Badge variant="success" size="md" className="font-mono">
                96% Confidence
              </Badge>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
