'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QuizQuestionItem } from '@/data/questions';

interface QuestionEditorModalProps {
  question: QuizQuestionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: QuizQuestionItem) => void;
}

export function QuestionEditorModal({
  question,
  isOpen,
  onClose,
  onSave,
}: QuestionEditorModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('B');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (question) {
      setQuestionText(question.questionText);
      setOptionA(question.options.find((o) => o.key === 'A')?.text || '');
      setOptionB(question.options.find((o) => o.key === 'B')?.text || '');
      setOptionC(question.options.find((o) => o.key === 'C')?.text || '');
      setOptionD(question.options.find((o) => o.key === 'D')?.text || '');
      setCorrectAnswer(question.correctAnswer);
      setExplanation(question.explanation);
    }
  }, [question]);

  if (!question) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...question,
      questionText,
      options: [
        { key: 'A', text: optionA },
        { key: 'B', text: optionB },
        { key: 'C', text: optionC },
        { key: 'D', text: optionD },
      ],
      correctAnswer,
      explanation,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Question #${question.questionNumber}`}
      description="Update question wording, options, or rationales in local assessment session."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Question
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Question Text */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary block">
            Question Text
          </label>
          <textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="font-semibold text-text-primary block">
            Options &amp; Correct Answer Selection
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { key: 'A', val: optionA, set: setOptionA },
              { key: 'B', val: optionB, set: setOptionB },
              { key: 'C', val: optionC, set: setOptionC },
              { key: 'D', val: optionD, set: setOptionD },
            ].map((opt) => (
              <div key={opt.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold font-mono">Option {opt.key}</span>
                  <label className="flex items-center gap-1 cursor-pointer text-text-muted hover:text-text-primary">
                    <input
                      type="radio"
                      name="correct-opt"
                      checked={correctAnswer === opt.key}
                      onChange={() => setCorrectAnswer(opt.key as any)}
                      className="text-primary"
                    />
                    <span>Mark as correct</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={opt.val}
                  onChange={(e) => opt.set(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary block">
            Rationale &amp; Explanation
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
      </form>
    </Modal>
  );
}
