'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FollowUpQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function FollowUpQuestions({ questions, onSelect }: FollowUpQuestionsProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-primary" />
        Suggested Follow-Up Inquiries
      </span>

      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(q)}
            className="px-3 py-1.5 rounded-xl border border-primary/20 bg-primary-light/40 hover:bg-primary-light/80 text-primary text-xs font-medium transition-all text-left flex items-center gap-1.5 group shadow-xs select-none"
          >
            <span>{q}</span>
            <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
