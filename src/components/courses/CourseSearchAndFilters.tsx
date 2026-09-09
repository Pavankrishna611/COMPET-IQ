'use client';

import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface CourseFilterState {
  searchQuery: string;
  provider: string;
  domain: string;
  difficulty: string;
  durationRange: string;
  recommendedOnly: boolean;
  sortBy: 'aiMatch' | 'rating' | 'duration' | 'title';
}

interface CourseSearchAndFiltersProps {
  filters: CourseFilterState;
  onFilterChange: (filters: CourseFilterState) => void;
  totalCourses: number;
  filteredCount: number;
}

export function CourseSearchAndFilters({
  filters,
  onFilterChange,
  totalCourses,
  filteredCount,
}: CourseSearchAndFiltersProps) {
  const updateFilter = <K extends keyof CourseFilterState>(key: K, value: CourseFilterState[K]) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      searchQuery: '',
      provider: 'all',
      domain: 'all',
      difficulty: 'all',
      durationRange: 'all',
      recommendedOnly: false,
      sortBy: 'aiMatch',
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.provider !== 'all' ||
    filters.domain !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.durationRange !== 'all' ||
    filters.recommendedOnly;

  return (
    <Card className="p-5 space-y-4 border-border bg-surface shadow-card">
      {/* Top Row: Search input + Recommended toggle + Sort dropdown */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            placeholder="Search courses by title, skill (Python, GIS, SQL), or provider..."
            className="w-full pl-10 pr-9 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs sm:text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => updateFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* AI Recommended Toggle Button */}
          <button
            type="button"
            onClick={() => updateFilter('recommendedOnly', !filters.recommendedOnly)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              filters.recommendedOnly
                ? 'bg-ai-purple text-white border-ai-purple shadow-sm shadow-ai-purple/25'
                : 'bg-ai-light/80 text-ai-purple border-ai-purple/30 hover:bg-ai-purple/15'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${filters.recommendedOnly ? 'text-white' : 'text-ai-purple'}`} />
            AI Recommended Only
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-medium whitespace-nowrap hidden sm:inline">
              Sort:
            </span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                updateFilter('sortBy', e.target.value as CourseFilterState['sortBy'])
              }
              className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="aiMatch">AI Match (Highest first)</option>
              <option value="rating">Rating (Highest first)</option>
              <option value="duration">Duration (Shortest first)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-light">
        {/* Provider */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Provider
          </label>
          <select
            value={filters.provider}
            onChange={(e) => updateFilter('provider', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All Providers</option>
            <option value="iGOT Karmayogi">iGOT Karmayogi</option>
            <option value="NSSTA / TPAC">NSSTA / TPAC</option>
            <option value="COMPETIQ Learning">COMPETIQ Learning</option>
          </select>
        </div>

        {/* Domain */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Domain
          </label>
          <select
            value={filters.domain}
            onChange={(e) => updateFilter('domain', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All Domains</option>
            <option value="Technical">Technical</option>
            <option value="Statistical Methods">Statistical Methods</option>
            <option value="Digital Governance">Digital Governance</option>
            <option value="Behavioural">Behavioural</option>
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => updateFilter('difficulty', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
            Duration
          </label>
          <select
            value={filters.durationRange}
            onChange={(e) => updateFilter('durationRange', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="all">All Durations</option>
            <option value="short">Short (&lt; 10h)</option>
            <option value="medium">Medium (10–25h)</option>
            <option value="long">Long (25h+)</option>
          </select>
        </div>
      </div>

      {/* Bottom Status Row: Results count & Active chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-light">
        <div className="text-xs text-text-secondary font-medium">
          Showing <span className="font-bold text-text-primary">{filteredCount}</span> of{' '}
          <span className="font-bold text-text-primary">{totalCourses}</span> courses
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.provider !== 'all' && (
              <Badge variant="neutral" size="sm" className="gap-1 bg-surface-elevated border-border text-text-secondary">
                {filters.provider}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-text-primary"
                  onClick={() => updateFilter('provider', 'all')}
                />
              </Badge>
            )}
            {filters.domain !== 'all' && (
              <Badge variant="neutral" size="sm" className="gap-1 bg-surface-elevated border-border text-text-secondary">
                {filters.domain}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-text-primary"
                  onClick={() => updateFilter('domain', 'all')}
                />
              </Badge>
            )}
            {filters.difficulty !== 'all' && (
              <Badge variant="neutral" size="sm" className="gap-1 bg-surface-elevated border-border text-text-secondary">
                {filters.difficulty}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-text-primary"
                  onClick={() => updateFilter('difficulty', 'all')}
                />
              </Badge>
            )}
            {filters.durationRange !== 'all' && (
              <Badge variant="neutral" size="sm" className="gap-1 bg-surface-elevated border-border text-text-secondary">
                {filters.durationRange === 'short'
                  ? '< 10h'
                  : filters.durationRange === 'medium'
                  ? '10–25h'
                  : '25h+'}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-text-primary"
                  onClick={() => updateFilter('durationRange', 'all')}
                />
              </Badge>
            )}
            {filters.recommendedOnly && (
              <Badge variant="ai" size="sm" className="gap-1">
                Recommended
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => updateFilter('recommendedOnly', false)}
                />
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs text-critical hover:text-critical h-7 px-2"
            >
              Reset all
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
