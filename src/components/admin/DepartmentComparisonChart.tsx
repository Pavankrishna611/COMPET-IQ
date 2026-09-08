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
import { DepartmentSkillHealthItem } from '@/data/adminDashboard';

interface DepartmentComparisonChartProps {
  departments: DepartmentSkillHealthItem[];
  benchmark?: number;
}

export function DepartmentComparisonChart({
  departments,
  benchmark = 72,
}: DepartmentComparisonChartProps) {
  const getBarColor = (score: number) => {
    if (score >= 75) return '#0D9488'; // teal (strong)
    if (score >= 70) return '#123B66'; // primary navy (good)
    if (score >= 68) return '#F59E0B'; // amber (needs attention)
    return '#E11D48'; // critical rose
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Department Competency Comparison
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Average assessed competency score across official statistical wings
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed" />
            <span className="text-text-muted text-[11px]">Org Benchmark ({benchmark}%)</span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={departments}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 25, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[50, 100]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="department"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              width={125}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DepartmentSkillHealthItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                      <p className="font-bold text-slate-100 border-b border-slate-700 pb-1">
                        {item.department}
                      </p>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-300">Average Competency:</span>
                        <span className="font-bold text-teal">{item.averageCompetency}%</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-300">Learning Completion:</span>
                        <span className="font-bold text-emerald-400">{item.trainingCompletion}%</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-300">Critical Gap Ratio:</span>
                        <span className="font-bold text-rose-400">{item.criticalGaps}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={benchmark}
              stroke="#E11D48"
              strokeDasharray="4 4"
              label={{
                value: `Benchmark (${benchmark}%)`,
                position: 'top',
                fill: '#E11D48',
                fontSize: 10,
              }}
            />
            <Bar dataKey="averageCompetency" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {departments.map((entry) => (
                <Cell key={entry.id} fill={getBarColor(entry.averageCompetency)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-light text-[11px] text-text-muted">
        <span>Economic Statistics (78%) leads across macro aggregation disciplines.</span>
        <span>Geographic Statistics (66%) exhibits greatest spatial analytics deficit.</span>
      </div>
    </div>
  );
}
