'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { DepartmentGapComparisonItem } from '@/data/adminSkillGaps';

interface SkillGapDepartmentChartProps {
  data: DepartmentGapComparisonItem[];
}

export function SkillGapDepartmentChart({ data }: SkillGapDepartmentChartProps) {
  const getBarColor = (gap: number) => {
    if (gap >= 25) return '#E11D48'; // critical rose
    if (gap >= 20) return '#F59E0B'; // amber
    if (gap >= 15) return '#3B82F6'; // blue
    return '#0D9488'; // teal
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Skill Gap by Department
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Average aggregate competency deficit by statistical directorate
            </p>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Benchmark: &le;15% Target
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 35]}
                unit="%"
                stroke="#94A3B8"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="department"
                stroke="#94A3B8"
                fontSize={11}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DepartmentGapComparisonItem;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <div className="font-bold text-text-primary">
                          {item.department}
                        </div>
                        <div className="text-text-secondary text-[11px]">
                          Dominant Shortage: <strong className="text-rose-600">{item.dominantGap}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-light font-mono text-[11px]">
                          <span>Average Deficit: <strong className="text-rose-600">{item.gapPercentage}%</strong></span>
                          <span>At-Risk Officials: <strong>{item.officialsAtRisk.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={15}
                stroke="#0D9488"
                strokeDasharray="3 3"
                label={{
                  value: 'Target Max Deficit: 15%',
                  fill: '#0D9488',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar dataKey="gapPercentage" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.gapPercentage)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-secondary flex items-center justify-between">
        <span>Highest Departmental Deficit: <strong className="text-rose-600">Geographic Statistics (28%)</strong></span>
        <span className="text-teal font-medium">Economic Statistics lowest at 12%</span>
      </div>
    </div>
  );
}
