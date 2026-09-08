'use client';

import React from 'react';
import { QuizQuestionItem } from '@/data/questions';
import { Badge } from '@/components/ui/Badge';
import { HelpCircle } from 'lucide-react';

interface QuizQuestionCardProps {
  question: QuizQuestionItem;
  selectedOptionKey?: string;
  onSelectOption: (optionKey: string) => void;
}

export function QuizQuestionCard({
  question,
  selectedOptionKey,
  onSelectOption,
}: QuizQuestionCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-mono font-bold text-xs shadow-sm">
            Q{question.questionNumber}
          </span>
          <Badge variant="teal" size="sm" className="font-semibold">
            {question.competency}
          </Badge>
          <Badge variant="neutral" size="sm">
            {question.difficulty} Level
          </Badge>
        </div>

        {question.sourceReference && (
          <span className="text-[11px] text-text-muted italic truncate max-w-xs">
            {question.sourceReference}
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h2 className="text-base sm:text-lg font-bold text-text-primary leading-relaxed">
          {question.questionText}
        </h2>
        <p className="text-xs text-text-muted">
          Select one option below. You can change your selection at any time before final submission.
        </p>
      </div>

      {/* Accessible Options Radio Group */}
      <fieldset className="space-y-3 pt-2">
        <legend className="sr-only">Answer choices for question {question.questionNumber}</legend>
        {question.options.map((option) => {
          const isSelected = selectedOptionKey === option.key;

          return (
            <label
              key={option.key}
              className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-primary-light/50 border-primary shadow-sm dark:bg-primary-light/20 ring-1 ring-primary'
                  : 'bg-surface-elevated/40 border-border hover:border-border hover:bg-surface-elevated'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.key}
                  checked={isSelected}
                  onChange={() => onSelectOption(option.key)}
                  className="w-4 h-4 text-primary border-border focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border text-text-secondary'
                  }`}
                >
                  {option.key}
                </span>
                <span
                  className={`text-xs sm:text-sm leading-normal ${
                    isSelected ? 'font-semibold text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {option.text}
                </span>
              </div>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
