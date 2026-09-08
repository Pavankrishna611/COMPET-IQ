'use client';

import React from 'react';
import { Search, Filter, RotateCcw, Building2, UserCheck, Layers, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface WorkforceFilterState {
  department: string;
  role: string;
  domain: string;
  level: string;
  search: string;
}

interface WorkforceFiltersProps {
  filters: WorkforceFilterState;
  onChange: (newFilters: WorkforceFilterState) => void;
  onReset: () => void;
  totalFiltered: number;
}

export const WORKFORCE_DEPARTMENTS = [
  'All Departments',
  'Economic Statistics',
  'Social Statistics',
  'Agriculture Statistics',
  'Labour Statistics',
  'Industry Statistics',
  'Geographic Statistics',
];

export const WORKFORCE_ROLES = [
  'All Roles',
  'Statistical Investigator',
  'Statistical Officer',
  'Senior Statistical Officer',
  'Data Analyst',
  'Training Officer',
];

export const WORKFORCE_DOMAINS = [
  'All Domains',
  'Statistical Methods',
  'Technical',
  'Digital Governance',
  'Behavioural',
];

export const WORKFORCE_LEVELS = [
  'All Levels',
  'Advanced',
  'Proficient',
  'Developing',
  'Critical Gap',
];

export function WorkforceFilters({
  filters,
  onChange,
  onReset,
  totalFiltered,
}: WorkforceFiltersProps) {
  const isFiltered =
    filters.department !== 'All Departments' ||
    filters.role !== 'All Roles' ||
    filters.domain !== 'All Domains' ||
    filters.level !== 'All Levels' ||
    filters.search.trim() !== '';

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleSelect = (key: keyof WorkforceFilterState, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Workforce Cadre &amp; Competency Filters
          </span>
          <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded-full border border-border">
            {totalFiltered} Officials Matched
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Search Officials
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={filters.search}
              onChange={handleTextChange}
              placeholder="Search officials..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Department
          </label>
          <div className="relative">
            <select
              value={filters.department}
              onChange={(e) => handleSelect('department', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {WORKFORCE_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Designation / Role
          </label>
          <div className="relative">
            <select
              value={filters.role}
              onChange={(e) => handleSelect('role', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {WORKFORCE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Competency Domain */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Competency Domain
          </label>
          <div className="relative">
            <select
              value={filters.domain}
              onChange={(e) => handleSelect('domain', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {WORKFORCE_DOMAINS.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Competency Level */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
            Competency Level
          </label>
          <div className="relative">
            <select
              value={filters.level}
              onChange={(e) => handleSelect('level', e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-surface-raised border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {WORKFORCE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
