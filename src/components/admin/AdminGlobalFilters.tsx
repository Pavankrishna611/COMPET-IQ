'use client';

import React from 'react';
import { Filter, Calendar, Building2, UserCheck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface AdminFiltersState {
  dateRange: '30d' | '90d' | '180d' | '1y';
  department: string;
  role: string;
}

interface AdminGlobalFiltersProps {
  filters: AdminFiltersState;
  onChange: (newFilters: AdminFiltersState) => void;
  onReset: () => void;
}

export const DEPARTMENT_OPTIONS = [
  'All Departments',
  'Economic Statistics',
  'Social Statistics',
  'Agriculture Statistics',
  'Labour Statistics',
  'Industry Statistics',
  'Geographic Statistics',
];

export const ROLE_OPTIONS = [
  'All Roles',
  'Statistical Investigator',
  'Statistical Officer',
  'Senior Statistical Officer',
  'Data Analyst',
  'Training Officer',
];

export function AdminGlobalFilters({
  filters,
  onChange,
  onReset,
}: AdminGlobalFiltersProps) {
  const isFiltered =
    filters.dateRange !== '180d' ||
    filters.department !== 'All Departments' ||
    filters.role !== 'All Roles';

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-2.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Workforce Scope &amp; Strategic Filters
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" />
            Evaluation Horizon
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              onChange({ ...filters, dateRange: e.target.value as AdminFiltersState['dateRange'] })
            }
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months (Quarter)</option>
            <option value="180d">Last 6 Months (Biannual)</option>
            <option value="1y">Last Year (Fiscal Cycle)</option>
          </select>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <Building2 className="w-3 h-3 text-primary" />
            Department / Division
          </label>
          <select
            value={filters.department}
            onChange={(e) => onChange({ ...filters, department: e.target.value })}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Role */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-primary" />
            Cadre Job Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => onChange({ ...filters, role: e.target.value })}
            className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
