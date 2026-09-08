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
  Legend,
} from 'recharts';
import { TrainingTrendPoint } from '@/data/trainingAnalytics';

interface TrainingEngagementTrendChartProps {
  data: TrainingTrendPoint[];
}

export function TrainingEngagementTrendChart({ data }: TrainingEngagementTrendChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Learning Engagement Trend
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Monthly tracking of active workforce participants vs. completed course certifications
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary inline-block" />
              <span className="text-text-secondary">Active Learners</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal inline-block" />
              <span className="text-teal font-medium">Completed Courses</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis domain={[2000, 9000]} stroke="#94A3B8" fontSize={11} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <div className="font-bold text-text-primary">{label}</div>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between gap-4 text-primary">
                            <span>Active Learners:</span>
                            <strong>{payload[0].value?.toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-teal">
                            <span>Completed Certs:</span>
                            <strong>{payload[1].value?.toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="activeLearners"
                name="Active Learners"
                stroke="#123B66"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#123B66' }}
              />
              <Line
                type="monotone"
                dataKey="completedCourses"
                name="Completed Courses"
                stroke="#0D9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0D9488' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-secondary flex items-center justify-between">
        <span>Active participation grew from <strong>5,420</strong> in April to <strong>8,231</strong> in September</span>
        <span className="text-teal font-semibold font-mono">+51.8% Growth</span>
      </div>
    </div>
  );
}
