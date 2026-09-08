'use client';

import React, { useState } from 'react';
import { QuestionReviewItem } from '@/data/quizResults';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Filter 
} from 'lucide-react';

interface QuestionReviewAccordionProps {
  reviews: QuestionReviewItem[];
}

export function QuestionReviewAccordion({ reviews }: QuestionReviewAccordionProps) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(reviews.slice(0, 2).map((r) => r.id))
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(reviews.map((r) => r.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredReviews = reviews.filter((item) => {
    if (filter === 'correct') return item.isCorrect;
    if (filter === 'incorrect') return !item.isCorrect;
    return true;
  });

  const correctCount = reviews.filter((r) => r.isCorrect).length;
  const incorrectCount = reviews.length - correctCount;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Detailed Question Review
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Review detailed question rationales, your submitted answers, and correct explanations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-surface-elevated p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-surface text-text-primary shadow-xs font-bold'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filter === 'correct'
                  ? 'bg-surface text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-text-muted hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Correct ({correctCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                filter === 'incorrect'
                  ? 'bg-surface text-rose-700 dark:text-rose-300 shadow-xs font-bold'
                  : 'text-text-muted hover:text-rose-600'
              }`}
            >
              <XCircle className="w-3 h-3 text-rose-600" />
              Incorrect ({incorrectCount})
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={expandedIds.size === reviews.length ? collapseAll : expandAll}
            className="text-xs text-primary"
          >
            {expandedIds.size === reviews.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredReviews.map((item) => {
          const isExpanded = expandedIds.has(item.id);

          return (
            <div
              key={item.id}
              className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'border-border bg-surface'
                  : 'border-border-light bg-surface-elevated/40 hover:border-border'
              }`}
            >
              {/* Question summary row */}
              <button
                type="button"
                onClick={() => toggleExpand(item.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-bold text-text-primary">
                        Question {item.questionNumber}
                      </span>
                      <span className="text-[10px] text-primary bg-primary-light/60 px-2 py-0.2 rounded-full border border-primary/20">
                        {item.competency}
                      </span>
                      <Badge variant={item.isCorrect ? 'success' : 'critical'} size="sm">
                        {item.isCorrect ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary truncate max-w-2xl">
                      {item.question}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-text-muted">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expanded Question Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border-light space-y-3.5 bg-surface text-xs">
                  <div>
                    <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider block mb-1">
                      Full Question
                    </span>
                    <p className="text-xs font-medium text-text-primary leading-relaxed">
                      {item.question}
                    </p>
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* User Answer */}
                    <div
                      className={`p-3 rounded-xl border ${
                        item.isCorrect
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                        Your Answer ({item.yourOptionKey})
                      </span>
                      <p
                        className={`text-xs font-semibold ${
                          item.isCorrect
                            ? 'text-emerald-900 dark:text-emerald-200'
                            : 'text-rose-900 dark:text-rose-200'
                        }`}
                      >
                        {item.yourAnswer}
                      </p>
                    </div>

                    {/* Correct Answer */}
                    <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                        Correct Answer ({item.correctOptionKey})
                      </span>
                      <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                        {item.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Official Explanation */}
                  <div className="p-3 bg-surface-elevated rounded-xl border border-border-light space-y-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Explanation &amp; Official Reference
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
