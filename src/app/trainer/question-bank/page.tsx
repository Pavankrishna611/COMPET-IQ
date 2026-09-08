'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/domain/StatCard';
import { mockQuestionBank, BankQuestionItem } from '@/data/questions';
import {
  QuestionBankFilters,
  QuestionBankFilterState,
  CreateQuestionModal,
} from '@/components/trainer';
import {
  Database,
  Plus,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Layers,
  BookOpen,
} from 'lucide-react';

const INITIAL_FILTERS: QuestionBankFilterState = {
  searchQuery: '',
  competency: 'all',
  difficulty: 'all',
  questionType: 'all',
  status: 'all',
};

export default function TrainerQuestionBankPage() {
  const [questions, setQuestions] = useState<BankQuestionItem[]>(mockQuestionBank);
  const [filters, setFilters] = useState<QuestionBankFilterState>(INITIAL_FILTERS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestionItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Actions
  const handleCreateQuestion = (newQuestion: BankQuestionItem) => {
    setQuestions((prev) => [newQuestion, ...prev]);
    showToast('New question created and added to Question Bank.');
  };

  const handleDuplicate = (question: BankQuestionItem) => {
    const dup: BankQuestionItem = {
      ...question,
      id: `bank-q-${Date.now()}`,
      questionText: `${question.questionText} (Copy)`,
      usageCount: 0,
      status: 'Draft',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuestions((prev) => [dup, ...prev]);
    showToast('Question duplicated as Draft.');
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast('Question deleted from Question Bank.');
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filters.competency !== 'all' && q.competency !== filters.competency) return false;
      if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
      if (filters.questionType !== 'all' && q.questionType !== filters.questionType) return false;
      if (filters.status !== 'all' && q.status !== filters.status) return false;

      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesText = q.questionText.toLowerCase().includes(query);
        const matchesComp = q.competency.toLowerCase().includes(query);
        const matchesOpt = q.options.some((o) => o.text.toLowerCase().includes(query));
        if (!matchesText && !matchesComp && !matchesOpt) return false;
      }

      return true;
    });
  }, [questions, filters]);

  const activeCount = questions.filter((q) => q.status === 'Active').length;
  const draftCount = questions.filter((q) => q.status === 'Draft').length;

  return (
    <AppShell
      title="Question Bank"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Trainer' },
        { label: 'Question Bank' },
      ]}
      defaultRole="trainer"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                MoSPI Item Bank Repository
              </Badge>
              <span className="text-xs text-text-muted">NSSTA Standardized Question Bank</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Question Bank
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Manage competency-based assessment questions, author standardized test items, and maintain official scoring rubrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/trainer/assessment-generator">
              <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />} className="text-xs font-semibold">
                Generate with AI
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs font-semibold shadow-sm"
            >
              Create Question
            </Button>
          </div>
        </div>

        {/* Summary StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Question Items"
            value={questions.length}
            accent="blue"
            icon={<Database className="w-5 h-5" />}
            subtitle="Curated from official manuals"
          />
          <StatCard
            title="Active in Live Tests"
            value={activeCount}
            accent="teal"
            icon={<CheckCircle2 className="w-5 h-5" />}
            subtitle="Approved by NSSTA panel"
          />
          <StatCard
            title="Draft / In Calibration"
            value={draftCount}
            accent="warning"
            icon={<Layers className="w-5 h-5" />}
            subtitle="Awaiting faculty review"
          />
          <StatCard
            title="Competency Coverage"
            value="8 Domains"
            accent="ai"
            icon={<BookOpen className="w-5 h-5" />}
            subtitle="Python, SNA, GIS, Sampling"
          />
        </div>

        {/* Filters */}
        <QuestionBankFilters
          filters={filters}
          onChange={setFilters}
          onCreateClick={() => setIsCreateModalOpen(true)}
          totalCount={questions.length}
          filteredCount={filteredQuestions.length}
        />

        {/* Question Items Table / List */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4 min-w-[320px]">Question Text</th>
                  <th className="py-3.5 px-4">Competency</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Question Type</th>
                  <th className="py-3.5 px-4 text-center">Usage Count</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-text-primary">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-surface-elevated/50 transition-colors group"
                    >
                      {/* Question Text & Correct Option */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-sm text-text-primary line-clamp-2">
                          {q.questionText}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            Key: ({q.correctAnswer})
                          </span>
                          <span className="truncate max-w-md">
                            {q.options.find((o) => o.key === q.correctAnswer)?.text}
                          </span>
                        </div>
                      </td>

                      {/* Competency */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant="teal" size="sm">
                          {q.competency}
                        </Badge>
                      </td>

                      {/* Difficulty */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            q.difficulty === 'Easy'
                              ? 'success'
                              : q.difficulty === 'Medium'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                      </td>

                      {/* Question Type */}
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-text-secondary">
                        {q.questionType}
                      </td>

                      {/* Usage Count */}
                      <td className="py-4 px-4 text-center font-mono font-bold whitespace-nowrap">
                        {q.usageCount} tests
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            q.status === 'Active'
                              ? 'success'
                              : q.status === 'Draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                          withDot
                        >
                          {q.status}
                        </Badge>
                      </td>

                      {/* Actions: Duplicate, Delete */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q)}
                            title="Duplicate question"
                            className="p-1.5 rounded-lg text-text-muted hover:text-teal hover:bg-surface-elevated transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            title="Delete question"
                            className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-surface-elevated transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No question items match your active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Question Modal */}
        <CreateQuestionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateQuestion}
        />
      </div>
    </AppShell>
  );
}
