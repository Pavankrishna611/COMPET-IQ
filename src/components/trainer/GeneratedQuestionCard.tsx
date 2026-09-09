'use client';

import React, { useState } from 'react';
import { QuizQuestionItem } from '@/data/questions';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Edit3,
  RotateCcw,
  Trash2,
  CheckCircle2,
  BookOpen,
  AlertCircle
} from 'lucide-react';

interface GeneratedQuestionCardProps {
  question: QuizQuestionItem;
  index: number;
  onEdit: (question: QuizQuestionItem) => void;
  onRegenerate: (questionId: string) => void;
  onDelete: (questionId: string) => void;
}

export function GeneratedQuestionCard({
  question,
  index,
  onEdit,
  onRegenerate,
  onDelete,
}: GeneratedQuestionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 transition-all hover:border-border">
      {/* Top row: Number, tags, and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#123B66] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-text-primary">
            Question #{index + 1}
          </span>
          <Badge variant="teal" size="sm">
            {question.competency}
          </Badge>
          <Badge
            variant={
              question.difficulty === 'Beginner'
                ? 'success'
                : question.difficulty === 'Intermediate'
                  ? 'info'
                  : 'warning'
            }
            size="sm"
          >
            {question.difficulty}
          </Badge>
        </div>

        {/* Action buttons: Edit, Regenerate, Delete */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs h-8 text-text-secondary hover:text-primary"
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRegenerate(question.id)}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs h-8 text-text-secondary hover:text-teal"
            title="Replace question with another AI candidate"
          >
            Regenerate
          </Button>

          {showDeleteConfirm ? (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <button
                type="button"
                onClick={() => onDelete(question.id)}
                className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2 py-1 rounded bg-surface-elevated text-text-muted text-[11px] hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Question Text */}
      <h4 className="text-sm font-bold text-text-primary leading-snug">
        {question.questionText}
      </h4>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question.options.map((opt) => {
          const isCorrect = opt.key === question.correctAnswer;

          return (
            <div
              key={opt.key}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-xs'
                : 'bg-surface-elevated/40 border-border-light text-text-secondary'
                }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${isCorrect
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface border border-border text-text-muted'
                    }`}
                >
                  {opt.key}
                </span>
                <span className={`truncate ${isCorrect ? 'font-semibold' : ''}`}>
                  {opt.text}
                </span>
              </div>

              {isCorrect && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Correct Answer Explanation & Source */}
      <div className="p-3.5 bg-surface-elevated rounded-xl border border-border-light space-y-2 text-xs">
        <div className="flex items-start gap-2 text-text-secondary">
          <span className="font-bold text-text-primary shrink-0">Explanation:</span>
          <span className="leading-relaxed">{question.explanation}</span>
        </div>

        {question.sourceReference && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted pt-1 border-t border-border-light">
            <BookOpen className="w-3 h-3 text-primary" />
            <span>Source Reference: <strong>{question.sourceReference}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
