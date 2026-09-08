'use client';

import React from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';

export interface GenerationStepItem {
  id: number;
  label: string;
}

export const GENERATION_STEPS: GenerationStepItem[] = [
  { id: 1, label: 'Analyzing learning material' },
  { id: 2, label: 'Identifying key concepts' },
  { id: 3, label: 'Mapping concepts to competency' },
  { id: 4, label: 'Generating questions' },
  { id: 5, label: 'Validating difficulty' },
  { id: 6, label: 'Finalizing assessment' },
];

interface GenerationProgressProps {
  currentStepIndex: number;
  isComplete: boolean;
}

export function GenerationProgress({
  currentStepIndex,
  isComplete,
}: GenerationProgressProps) {
  const percent = isComplete
    ? 100
    : Math.min(95, Math.round(((currentStepIndex + 0.5) / GENERATION_STEPS.length) * 100));

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              AI Assessment Synthesis in Progress
            </h4>
            <p className="text-xs text-text-secondary">
              Calibrating questions against official Bloom&apos;s Taxonomy and MoSPI Cadre benchmarks
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/20">
          {percent}%
        </span>
      </div>

      <ProgressBar value={percent} variant="blue" size="md" />

      {/* Progressive Step Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
        {GENERATION_STEPS.map((step, idx) => {
          const isDone = isComplete || idx < currentStepIndex;
          const isActive = !isComplete && idx === currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : isActive
                  ? 'bg-primary-light/60 border-primary text-primary font-semibold shadow-xs ring-1 ring-primary'
                  : 'bg-surface-elevated/40 border-border-light text-text-muted'
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px] text-text-muted font-mono">
                    {step.id}
                  </span>
                )}
              </div>
              <span className="truncate">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
