'use client';

import React, { useState } from 'react';
import { Official } from '@/data/workforce';
import { Badge } from '@/components/ui/Badge';
import { ChevronLeft, ChevronRight, User, AlertCircle, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WorkforceDirectoryTableProps {
  officials: Official[];
  onSelectOfficial: (official: Official) => void;
  pageSize?: number;
}

export function WorkforceDirectoryTable({
  officials,
  onSelectOfficial,
  pageSize = 8,
}: WorkforceDirectoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(officials.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOfficials = officials.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: Official['status']) => {
    switch (status) {
      case 'Strong':
        return (
          <Badge variant="success" size="sm" withDot className="font-semibold">
            Strong
          </Badge>
        );
      case 'Good':
        return (
          <Badge variant="teal" size="sm" withDot className="font-semibold">
            Good
          </Badge>
        );
      case 'Developing':
        return (
          <Badge variant="warning" size="sm" withDot className="font-semibold">
            Developing
          </Badge>
        );
      case 'Needs Support':
      default:
        return (
          <Badge variant="critical" size="sm" withDot className="font-semibold">
            Needs Support
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Statistical Workforce Directory
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Individual official competency records, cadre details, and learning progression
          </p>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Showing {startIndex + 1}–{Math.min(startIndex + pageSize, officials.length)} of {officials.length} records
        </span>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-light text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Official</th>
              <th className="py-3 px-3">Designation &amp; Cadre</th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">Overall Competency</th>
              <th className="py-3 px-3 text-center">Critical Gaps</th>
              <th className="py-3 px-3">Learning Progress</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {paginatedOfficials.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  No officials found matching the specified filters.
                </td>
              </tr>
            ) : (
              paginatedOfficials.map((officer) => (
                <tr
                  key={officer.id}
                  onClick={() => onSelectOfficial(officer)}
                  className="hover:bg-primary-light/40 transition-colors cursor-pointer group"
                >
                  {/* Official name & avatar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {getInitials(officer.name)}
                      </div>
                      <div>
                        <div className="font-bold text-text-primary group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {officer.name}
                          <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {officer.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Designation */}
                  <td className="py-3 px-3">
                    <div className="font-medium text-text-primary">
                      {officer.designation}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {officer.cadre} • {officer.experienceYears} yrs exp
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-raised border border-border text-text-secondary">
                      {officer.department}
                    </span>
                  </td>

                  {/* Overall Competency */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-border-light rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            officer.overallCompetency >= 80
                              ? 'bg-teal'
                              : officer.overallCompetency >= 70
                              ? 'bg-primary'
                              : officer.overallCompetency >= 65
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${officer.overallCompetency}%` }}
                        />
                      </div>
                      <span className="font-bold font-mono text-text-primary text-xs">
                        {officer.overallCompetency}%
                      </span>
                    </div>
                  </td>

                  {/* Critical Gaps Count */}
                  <td className="py-3 px-3 text-center">
                    {officer.criticalGapsCount > 0 ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900/50">
                        {officer.criticalGapsCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center text-teal font-medium text-xs">
                        None
                      </span>
                    )}
                  </td>

                  {/* Learning Progress */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-border-light rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal"
                          style={{ width: `${officer.learningProgress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-text-secondary">
                        {officer.learningProgress}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-right">
                    {getStatusBadge(officer.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-3">
        {paginatedOfficials.map((officer) => (
          <div
            key={officer.id}
            onClick={() => onSelectOfficial(officer)}
            className="p-4 bg-surface-raised border border-border rounded-xl space-y-3 cursor-pointer hover:border-primary transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                  {getInitials(officer.name)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    {officer.name}
                  </h4>
                  <p className="text-[11px] text-text-muted">
                    {officer.designation} • {officer.department}
                  </p>
                </div>
              </div>
              {getStatusBadge(officer.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border-light font-mono">
              <div>
                <span className="text-[10px] text-text-muted block">Competency</span>
                <span className="font-bold text-text-primary">{officer.overallCompetency}%</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Learning Progress</span>
                <span className="font-bold text-teal">{officer.learningProgress}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border-light text-xs">
        <span className="text-text-secondary">
          Page <strong className="text-text-primary">{currentPage}</strong> of{' '}
          <strong className="text-text-primary">{totalPages}</strong>
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="gap-1 h-8 px-2.5 text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                page === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-surface-raised border border-border text-text-secondary hover:bg-border-light'
              }`}
            >
              {page}
            </button>
          ))}

          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="gap-1 h-8 px-2.5 text-xs"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
