'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CompetencyDistributionSlice } from '@/data/adminDashboard';
import { Award, TrendingUp, Sparkles } from 'lucide-react';

interface CompetencyDistributionChartProps {
  data: CompetencyDistributionSlice[];
}

export function CompetencyDistributionChart({ data }: CompetencyDistributionChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Workforce Competency Overview
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Competency distribution across the organization
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/20">
            Cadre Baseline
          </span>
        </div>

        {/* Chart + Summary Stats Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="sm:col-span-7 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as CompetencyDistributionSlice;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-0.5">
                          <p className="font-bold text-slate-100">{item.name}</p>
                          <p className="font-mono text-teal font-bold">{item.value}% of Workforce</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Slices Legend & Percentage */}
          <div className="sm:col-span-5 space-y-2 text-xs">
            {data.map((slice) => (
              <div
                key={slice.name}
                className="flex items-center justify-between p-2 rounded-xl bg-surface-elevated/60 border border-border-light"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-text-secondary text-[11px]">{slice.name}</span>
                </div>
                <span className="font-mono font-bold text-text-primary text-xs">{slice.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Highlight Box */}
      <div className="space-y-2 pt-2 border-t border-border-light">
        <div className="p-3 bg-teal-light/50 border border-teal/20 rounded-xl flex items-center gap-2.5 text-xs text-text-primary">
          <Award className="w-4 h-4 text-teal shrink-0" />
          <span className="font-semibold">
            52% of the workforce is currently proficient or advanced.
          </span>
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed px-1">
          💡 <strong>Contextual Insight:</strong> Technical and emerging digital competencies represent the largest opportunities for workforce development.
        </p>
      </div>
    </div>
  );
}
