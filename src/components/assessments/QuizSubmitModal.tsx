'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';

interface QuizSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  answeredCount: number;
  unansweredCount: number;
  totalQuestions: number;
}

export function QuizSubmitModal({
  isOpen,
  onClose,
  onSubmit,
  answeredCount,
  unansweredCount,
  totalQuestions,
}: QuizSubmitModalProps) {
  const hasUnanswered = unansweredCount > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Assessment"
      description="Please confirm that you are ready to conclude this assessment session."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="font-semibold shadow-sm"
          >
            Submit Assessment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-text-secondary">
        <p className="text-sm font-medium text-text-primary">
          Are you sure you want to submit your assessment?
        </p>

        {/* Answered / Unanswered stats */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-surface-elevated rounded-xl border border-border">
          <div className="space-y-1">
            <span className="text-[11px] text-text-muted block uppercase tracking-wider">
              Answered Questions
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {answeredCount} / {totalQuestions}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-text-muted block uppercase tracking-wider">
              Unanswered Questions
            </span>
            <span className={`text-base font-bold font-mono ${hasUnanswered ? 'text-amber-600 dark:text-amber-400' : 'text-text-muted'}`}>
              {unansweredCount}
            </span>
          </div>
        </div>

        {hasUnanswered ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-xs leading-relaxed">
              You still have <strong>{unansweredCount}</strong> unanswered question(s). Unanswered questions will be scored as zero points.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium">
              Great job! All {totalQuestions} questions have been answered.
            </p>
          </div>
        )}

        <p className="text-[11px] text-text-muted">
          Once submitted, your competency scores will be updated and you will be redirected to the detailed performance review page.
        </p>
      </div>
    </Modal>
  );
}
