'use client';

import React from 'react';
import { DepartmentSkillHealthItem } from '@/data/adminDashboard';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

interface DepartmentSkillHealthTableProps {
  departments: DepartmentSkillHealthItem[];
}

export function DepartmentSkillHealthTable({ departments }: DepartmentSkillHealthTableProps) {
  const getStatusBadge = (status: DepartmentSkillHealthItem['status']) => {
    switch (status) {
      case 'Strong':
        return (
          <Badge variant="success" size="sm" withDot className="font-semibold gap-1">
            Strong
          </Badge>
        );
      case 'Good':
        return (
          <Badge variant="teal" size="sm" withDot className="font-semibold gap-1">
            Good
          </Badge>
        );
      case 'Needs Attention':
        return (
          <Badge variant="warning" size="sm" withDot className="font-semibold gap-1">
            Needs Attention
          </Badge>
        );
      case 'Critical':
      default:
        return (
          <Badge variant="critical" size="sm" withDot className="font-semibold gap-1">
            Critical
          </Badge>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden space-y-4 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Department Skill Health
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Diagnostic breakdown of competency readiness, critical gap ratios, and training completion rates
          </p>
        </div>

        <span className="text-xs text-text-muted font-mono">
          Evaluating 6 MoSPI Wings
        </span>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-elevated text-text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3 text-right">Officials</th>
              <th className="py-3 px-3 text-center">Average Competency</th>
              <th className="py-3 px-3 text-center">Critical Gaps</th>
              <th className="py-3 px-3 text-center">Training Completion</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light text-text-primary">
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-surface-elevated/50 transition-colors">
                {/* Department Name */}
                <td className="py-3.5 px-3 font-bold text-sm text-text-primary">
                  {dept.department}
                </td>

                {/* Officials Count */}
                <td className="py-3.5 px-3 text-right font-mono font-bold">
                  {dept.officials.toLocaleString()}
                </td>

                {/* Average Competency */}
                <td className="py-3.5 px-3 text-center font-mono">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      dept.averageCompetency >= 75
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : dept.averageCompetency >= 70
                        ? 'bg-primary-light text-primary'
                        : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {dept.averageCompetency}%
                  </span>
                </td>

                {/* Critical Gaps */}
                <td className="py-3.5 px-3 text-center font-mono">
                  <span
                    className={`font-bold ${
                      dept.criticalGaps > 20
                        ? 'text-rose-600 dark:text-rose-400'
                        : dept.criticalGaps > 15
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-text-secondary'
                    }`}
                  >
                    {dept.criticalGaps}%
                  </span>
                </td>

                {/* Training Completion */}
                <td className="py-3.5 px-3 text-center font-mono font-bold text-teal">
                  {dept.trainingCompletion}%
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  {getStatusBadge(dept.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="sm:hidden space-y-3">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 rounded-xl border border-border bg-surface-elevated/40 space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-text-primary">{dept.department}</h4>
              {getStatusBadge(dept.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2 bg-surface rounded-lg border border-border-light">
                <span className="text-[10px] text-text-muted uppercase block font-sans">
                  Officials
                </span>
                <span className="font-bold text-text-primary">{dept.officials.toLocaleString()}</span>
              </div>
              <div className="p-2 bg-surface rounded-lg border border-border-light">
                <span className="text-[10px] text-text-muted uppercase block font-sans">
                  Avg Competency
                </span>
                <span className="font-bold text-teal">{dept.averageCompetency}%</span>
              </div>
              <div className="p-2 bg-surface rounded-lg border border-border-light">
                <span className="text-[10px] text-text-muted uppercase block font-sans">
                  Critical Gaps
                </span>
                <span className="font-bold text-rose-600">{dept.criticalGaps}%</span>
              </div>
              <div className="p-2 bg-surface rounded-lg border border-border-light">
                <span className="text-[10px] text-text-muted uppercase block font-sans">
                  Training Done
                </span>
                <span className="font-bold text-primary">{dept.trainingCompletion}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
