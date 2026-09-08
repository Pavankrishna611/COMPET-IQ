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
} from 'recharts';
import { LearningEngagementMetrics } from '@/data/adminDashboard';
import { CheckCircle2, Clock, Users, TrendingUp } from 'lucide-react';

interface LearningCompletionChartProps {
  metrics: LearningEngagementMetrics;
}

export function LearningCompletionChart({ metrics }: LearningCompletionChartProps) {
  const chartData = [
    { stage: 'Enrolled Total', count: metrics.enrolled, color: '#123B66' },
    { stage: 'In Progress', count: metrics.inProgress, color: '#F59E0B' },
    { stage: 'Completed', count: metrics.completed, color: '#0D9488' },
  ];

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Learning Engagement &amp; Completion
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Workforce progression across mandatory and elective capacity courses
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal bg-teal-light px-2.5 py-1 rounded-full border border-teal/20">
            {metrics.completionRate}% Completion Rate
          </span>
        </div>

        {/* 3 Metrics Cards Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border-light text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <Users className="w-3 h-3 text-primary" />
              <span>Enrolled</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary">
              {metrics.enrolled.toLocaleString()}
            </div>
            <span className="text-[10px] text-text-muted">Assigned officials</span>
          </div>

          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              <Clock className="w-3 h-3" />
              <span>In Progress</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-900 dark:text-amber-200">
              {metrics.inProgress.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400">Active coursework</span>
          </div>

          <div className="p-3 bg-teal-light/60 rounded-xl border border-teal/20 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed</span>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-teal">
              {metrics.completed.toLocaleString()}
            </div>
            <span className="text-[10px] text-teal">Verified passes</span>
          </div>
        </div>

        {/* Recharts Visual Bar Chart */}
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="stage" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5">
                        <p className="font-bold text-slate-100">{item.stage}</p>
                        <p className="font-mono text-teal font-bold">{item.count.toLocaleString()} Officials</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Insight */}
      <div className="p-3 bg-teal-light/50 border border-teal/20 rounded-xl flex items-center justify-between text-xs text-text-primary mt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal shrink-0" />
          <span className="font-medium">
            <strong>Key Insight:</strong> Learning completion has improved by 7.1% compared to the previous quarter.
          </span>
        </div>
      </div>
    </div>
  );
}
