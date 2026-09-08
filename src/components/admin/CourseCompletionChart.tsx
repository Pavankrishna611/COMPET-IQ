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
import { CourseCompletionStatusSlice } from '@/data/trainingAnalytics';
import { CheckCircle2, Clock, MinusCircle } from 'lucide-react';

interface CourseCompletionChartProps {
  data: CourseCompletionStatusSlice[];
}

export function CourseCompletionChart({ data }: CourseCompletionChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Course Completion Status
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Distribution of workforce course progression states
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal bg-teal-light px-2.5 py-1 rounded-full border border-teal/20">
            {total.toLocaleString()} Total Enrolled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Donut Chart */}
          <div className="sm:col-span-7 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as CourseCompletionStatusSlice;
                      return (
                        <div className="bg-surface border border-border p-2.5 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                          <span className="font-bold text-text-primary">{item.name}</span>
                          <div className="text-text-secondary">
                            {item.count.toLocaleString()} courses ({item.percentage}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Breakdown Legend */}
          <div className="sm:col-span-5 space-y-2.5 text-xs">
            {data.map((slice) => (
              <div
                key={slice.name}
                className="p-2.5 bg-surface-raised border border-border rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-medium text-text-primary">{slice.name}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-text-primary block">
                    {slice.count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-secondary">
        <strong>65.6%</strong> of course enrollments have reached completion verification.
      </div>
    </div>
  );
}
