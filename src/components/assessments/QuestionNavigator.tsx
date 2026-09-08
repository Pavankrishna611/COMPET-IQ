'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<number, string>;
  onSelectQuestion: (index: number) => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answers,
  onSelectQuestion,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
        <span>Question Navigator</span>
        <span className="font-mono text-primary font-bold">
          {Object.keys(answers).length} / {totalQuestions} Answered
        </span>
      </div>

      {/* Grid of Question Number Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isCurrent = currentIndex === i;
          const isAnswered = answers[i] !== undefined && answers[i] !== '';
          const questionNumber = i + 1;

          let stateStyles = 'bg-surface-elevated text-text-secondary border-border hover:border-primary/40';
          let statusAria = 'unanswered';

          if (isCurrent) {
            stateStyles = 'bg-[#123B66] text-white border-[#123B66] ring-2 ring-[#123B66]/30 font-bold shadow-sm';
            statusAria = isAnswered ? 'current and answered' : 'current and unanswered';
          } else if (isAnswered) {
            stateStyles = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold';
            statusAria = 'answered';
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectQuestion(i)}
              aria-label={`Go to question ${questionNumber}, ${statusAria}`}
              className={`h-10 rounded-xl border flex items-center justify-center text-xs font-mono transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-primary ${stateStyles}`}
            >
              <span>{questionNumber}</span>
              {isAnswered && !isCurrent && (
                <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 absolute bottom-1 right-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-2 border-t border-border-light flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#123B66] inline-block" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-surface-elevated border border-border inline-block" />
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
}
