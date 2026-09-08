'use client';

import React from 'react';
import { Search, Plus, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface QuestionBankFilterState {
  searchQuery: string;
  competency: string;
  difficulty: string;
  questionType: string;
  status: string;
}

interface QuestionBankFiltersProps {
  filters: QuestionBankFilterState;
  onChange: (filters: QuestionBankFilterState) => void;
  onCreateClick: () => void;
  totalCount: number;
  filteredCount: number;
}

export function QuestionBankFilters({
  filters,
  onChange,
  onCreateClick,
  totalCount,
  filteredCount,
}: QuestionBankFiltersProps) {
  const updateField = <K extends keyof QuestionBankFilterState>(key: K, value: QuestionBankFilterState[K]) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      searchQuery: '',
      competency: 'all',
      difficulty: 'all',
      questionType: 'all',
      status: 'all',
    });
  };

  const hasFilters =
    filters.searchQuery !== '' ||
    filters.competency !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.questionType !== 'all' ||
    filters.status !== 'all';

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateField('searchQuery', e.target.value)}
            placeholder="Search questions by text, competency, or option content..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Create Question CTA */}
        <Button
          variant="primary"
          size="md"
          onClick={onCreateClick}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs font-semibold whitespace-nowrap shadow-sm"
        >
          Create Question
        </Button>
      </div>

      {/* Filter Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border-light">
        {/* Competency */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Competency
          </label>
          <select
            value={filters.competency}
            onChange={(e) => updateField('competency', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Competencies</option>
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

        {/* Difficulty */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Question Type
          </label>
          <select
            value={filters.questionType}
            onChange={(e) => updateField('questionType', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Formats</option>
            <option value="MCQ">MCQ</option>
            <option value="Scenario Based">Scenario Based</option>
            <option value="Practical Case">Practical Case</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Results Count & Reset Button */}
      <div className="flex items-center justify-between pt-2 text-xs text-text-muted">
        <span>
          Showing <strong className="text-text-primary font-mono">{filteredCount}</strong> of{' '}
          <strong className="text-text-primary font-mono">{totalCount}</strong> questions
        </span>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            leftIcon={<FilterX className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs text-rose-600 hover:text-rose-700 h-7"
          >
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}
