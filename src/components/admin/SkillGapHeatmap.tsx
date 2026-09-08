'use client';

import React, { useState } from 'react';
import {
  DepartmentHeatmapRow,
  HEATMAP_SKILLS,
  HeatmapCellSeverity,
  HeatmapCell,
} from '@/data/adminSkillGaps';
import { Badge } from '@/components/ui/Badge';
import { Grid, Info, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SkillGapHeatmapProps {
  data: DepartmentHeatmapRow[];
}

export function SkillGapHeatmap({ data }: SkillGapHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dept: string;
    cell: HeatmapCell;
  } | null>(null);

  const getCellStyles = (severity: HeatmapCellSeverity) => {
    switch (severity) {
      case 'Critical Gap':
        return {
          bg: 'bg-rose-500/20 hover:bg-rose-500/35 border-rose-400 dark:border-rose-600',
          text: 'text-rose-700 dark:text-rose-300 font-bold',
          dot: 'bg-rose-500',
        };
      case 'High Gap':
        return {
          bg: 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-400 dark:border-amber-600',
          text: 'text-amber-800 dark:text-amber-300 font-semibold',
          dot: 'bg-amber-500',
        };
      case 'Moderate':
        return {
          bg: 'bg-blue-500/15 hover:bg-blue-500/30 border-blue-300 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-300 font-medium',
          dot: 'bg-blue-500',
        };
      case 'Strong':
      default:
        return {
          bg: 'bg-teal-500/15 hover:bg-teal-500/30 border-teal-300 dark:border-teal-700',
          text: 'text-teal-800 dark:text-teal-300 font-medium',
          dot: 'bg-teal',
        };
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">
              Department Skill Gap Heatmap
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Cross-departmental competency deficit matrix. Hover over cells to view deficit metrics.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-500/25 border border-teal-500 inline-block" />
            <span className="text-text-secondary">Strong (&lt;15% gap)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-500/25 border border-blue-500 inline-block" />
            <span className="text-text-secondary">Moderate (15–20%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block" />
            <span className="text-text-secondary">High Gap (21–27%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/35 border border-rose-500 inline-block" />
            <span className="text-text-secondary">Critical (&ge;28%)</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="py-2.5 px-3 text-left font-bold text-text-secondary text-[11px] uppercase tracking-wider bg-surface-raised border border-border-light rounded-tl-xl w-48">
                Department
              </th>
              {HEATMAP_SKILLS.map((skill, idx) => (
                <th
                  key={skill}
                  className={`py-2.5 px-3 text-center font-bold text-text-secondary text-[11px] uppercase tracking-wider bg-surface-raised border border-border-light ${
                    idx === HEATMAP_SKILLS.length - 1 ? 'rounded-tr-xl' : ''
                  }`}
                >
                  {skill}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.department} className="border-b border-border-light">
                <td className="py-3 px-3 font-semibold text-text-primary bg-surface-raised/40 border border-border-light text-xs">
                  {row.department}
                </td>
                {HEATMAP_SKILLS.map((skill) => {
                  const cell = row.skills[skill];
                  if (!cell) {
                    return (
                      <td key={skill} className="border border-border-light p-2 text-center text-text-muted">
                        -
                      </td>
                    );
                  }
                  const styles = getCellStyles(cell.severity);
                  return (
                    <td
                      key={skill}
                      onMouseEnter={() => setHoveredCell({ dept: row.department, cell })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`border border-border-light p-2 text-center cursor-pointer transition-all duration-150 ${styles.bg}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className={`text-xs font-mono ${styles.text}`}>
                          {cell.gap}%
                        </span>
                        <span className="text-[10px] text-text-muted hidden sm:inline">
                          gap
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Tooltip Callout Bar */}
      <div className="min-h-12 bg-surface-raised border border-border rounded-xl p-3 flex items-center justify-between transition-all">
        {hoveredCell ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary">
                {hoveredCell.dept}
              </span>
              <span className="text-text-muted">•</span>
              <span className="font-semibold text-primary">
                {hoveredCell.cell.skill}
              </span>
              <Badge
                variant={
                  hoveredCell.cell.severity === 'Critical Gap'
                    ? 'critical'
                    : hoveredCell.cell.severity === 'High Gap'
                    ? 'warning'
                    : hoveredCell.cell.severity === 'Moderate'
                    ? 'info'
                    : 'teal'
                }
                size="sm"
                withDot
              >
                {hoveredCell.cell.severity}
              </Badge>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs">
              <span>Deficit Gap: <strong className="text-rose-600 dark:text-rose-400">{hoveredCell.cell.gap}%</strong></span>
              <span>Current: <strong>{hoveredCell.cell.currentScore}%</strong></span>
              <span>Target: <strong>{hoveredCell.cell.targetScore}%</strong></span>
              <span>Affected: <strong className="text-text-primary">{hoveredCell.cell.affectedOfficials.toLocaleString()}</strong></span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Info className="w-4 h-4 text-text-muted shrink-0" />
            <span>Hover over any matrix cell above to inspect the specific departmental skill deficit and affected cadre count.</span>
          </div>
        )}
      </div>
    </div>
  );
}
