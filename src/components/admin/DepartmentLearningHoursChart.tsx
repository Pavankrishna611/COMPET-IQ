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
import { DepartmentLearningHoursItem } from '@/data/trainingAnalytics';

interface DepartmentLearningHoursChartProps {
  data: DepartmentLearningHoursItem[];
}

export function DepartmentLearningHoursChart({ data }: DepartmentLearningHoursChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Learning Hours by Department
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Aggregate capacity building hours logged across statistical directorates
            </p>
          </div>
          <span className="text-xs font-mono text-text-muted">
            Org Baseline: 5.2 hrs/official
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
                domain={[0, 18000]}
                unit=" hrs"
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
                    const item = payload[0].payload as DepartmentLearningHoursItem;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <div className="font-bold text-text-primary">{item.department}</div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div>Total Hours: <strong>{item.totalHours.toLocaleString()} hrs</strong></div>
                          <div>Avg / Official: <strong>{item.averageHoursPerOfficial} hrs</strong></div>
                          <div className="text-text-muted">Benchmark: {item.benchmark} hrs</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="totalHours" fill="#123B66" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.averageHoursPerOfficial >= 5.2 ? '#0D9488' : '#F59E0B'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-secondary flex items-center justify-between">
        <span>Top Contributing Wing: <strong className="text-teal">Economic Statistics (14,850 hrs)</strong></span>
        <span className="text-amber-600 font-medium">Geographic lowest at 7,240 hrs</span>
      </div>
    </div>
  );
}
