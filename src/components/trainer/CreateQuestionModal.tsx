'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BankQuestionItem } from '@/data/questions';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newQuestion: BankQuestionItem) => void;
}

export function CreateQuestionModal({
  isOpen,
  onClose,
  onSave,
}: CreateQuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [competency, setCompetency] = useState('Python');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionType, setQuestionType] = useState<'MCQ' | 'Scenario Based' | 'Practical Case'>('MCQ');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [explanation, setExplanation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newQuestion: BankQuestionItem = {
      id: `bank-q-${Date.now()}`,
      questionText,
      competency,
      difficulty,
      questionType,
      usageCount: 0,
      status: 'Active',
      options: [
        { key: 'A', text: optionA || 'Option A' },
        { key: 'B', text: optionB || 'Option B' },
        { key: 'C', text: optionC || 'Option C' },
        { key: 'D', text: optionD || 'Option D' },
      ],
      correctAnswer,
      explanation: explanation || 'Standard official statistical reference.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newQuestion);
    // Reset form
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExplanation('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Question Item"
      description="Author and tag a new competency assessment question under NSSTA rubric standards."
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Save to Question Bank
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Competency, Difficulty, Question Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="font-semibold text-text-primary block">Competency</label>
            <select
              value={competency}
              onChange={(e) => setCompetency(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary"
            >
              <option value="Python">Python</option>
              <option value="SQL">SQL</option>
              <option value="Data Visualization">Data Visualization</option>
              <option value="GIS">GIS</option>
              <option value="Statistical Methods">Statistical Methods</option>
              <option value="Sampling Techniques">Sampling Techniques</option>
              <option value="Data Quality">Data Quality</option>
              <option value="AI / ML">AI / ML</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary block">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-text-primary block">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary"
            >
              <option value="MCQ">MCQ</option>
              <option value="Scenario Based">Scenario Based</option>
              <option value="Practical Case">Practical Case</option>
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary block">Question Text</label>
          <textarea
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the official question text here..."
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="font-semibold text-text-primary block">
            Four Options &amp; Correct Answer
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
                      name="correct-opt-create"
                      checked={correctAnswer === opt.key}
                      onChange={() => setCorrectAnswer(opt.key as any)}
                      className="text-primary"
                    />
                    <span>Correct</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={opt.val}
                  onChange={(e) => opt.set(e.target.value)}
                  placeholder={`Option ${opt.key} text`}
                  className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-1">
          <label className="font-semibold text-text-primary block">
            Explanation &amp; Source Manual
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Official reasoning and standard manual reference..."
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          />
        </div>
      </form>
    </Modal>
  );
}
