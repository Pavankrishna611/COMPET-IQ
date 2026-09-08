'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CompetencyTrendPoint } from '@/data/adminDashboard';
import { TrendingUp, Sparkles } from 'lucide-react';

interface CompetencyTrendChartProps {
  data: CompetencyTrendPoint[];
}

export function CompetencyTrendChart({ data }: CompetencyTrendChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Competency Growth Trend
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            6-Month longitudinal progression of aggregate workforce competency
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal inline-block" />
            <span className="text-text-secondary">Average Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed" />
            <span className="text-text-muted">Target (70%)</span>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
            />
            <YAxis
              domain={[60, 80]}
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CompetencyTrendPoint;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-slate-100">{item.month} Evaluation</p>
                      <p className="font-mono text-teal font-bold">Competency: {item.score}%</p>
                      <p className="font-mono text-slate-400 text-[11px]">Benchmark: {item.benchmark}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={70} stroke="#E11D48" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#0D9488"
              strokeWidth={3}
              dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#123B66' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Highlight Banner */}
      <div className="p-3 bg-teal-light/50 border border-teal/20 rounded-xl flex items-center justify-between text-xs text-text-primary">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal shrink-0" />
          <span className="font-medium">
            Average workforce competency has increased by <strong>6 percentage points</strong> over the last six months.
          </span>
        </div>
      </div>
    </div>
  );
}
