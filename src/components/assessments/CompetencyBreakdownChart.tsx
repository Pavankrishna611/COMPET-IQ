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

interface BreakdownItem {
  name: string;
  score: number;
  benchmark: number;
}

interface CompetencyBreakdownChartProps {
  data: BreakdownItem[];
  insight: string;
}

export function CompetencyBreakdownChart({ data, insight }: CompetencyBreakdownChartProps) {
  const getBarColor = (score: number) => {
    if (score >= 85) return '#0D9488'; // teal
    if (score >= 75) return '#123B66'; // primary navy
    return '#EAB308'; // warning yellow
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Domain Competency Breakdown
          </h3>
          <p className="text-xs text-text-secondary">
            Scored evaluation across test-mapped competency clusters against benchmark (75%)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal inline-block" />
            <span className="text-text-secondary">Mastery (&ge;85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#123B66] inline-block" />
            <span className="text-text-secondary">Proficient (75-84%)</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as BreakdownItem;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-slate-100">{item.name}</p>
                      <p className="text-teal font-mono">Assessed Score: {item.score}%</p>
                      <p className="text-slate-400 font-mono text-[11px]">Benchmark: {item.benchmark}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={75} stroke="#E2E8F0" strokeDasharray="3 3" />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Supporting Insight Callout */}
      <div className="p-3 bg-teal-light/40 border border-teal/20 rounded-xl flex items-center justify-between text-xs text-text-secondary">
        <span className="font-medium">
          💡 <strong className="text-text-primary">Key Insight:</strong> {insight}
        </span>
      </div>
    </div>
  );
}
