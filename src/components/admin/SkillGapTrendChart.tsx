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
import { SkillGapTrendPoint } from '@/data/adminSkillGaps';
import { TrendingDown, Sparkles } from 'lucide-react';

interface SkillGapTrendChartProps {
  data: SkillGapTrendPoint[];
}

export function SkillGapTrendChart({ data }: SkillGapTrendChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Skill Gap Trend
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              6-Month trajectory of workforce-wide critical competency deficit rate
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              <span className="text-text-secondary">Deficit Rate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-teal inline-block border-t border-dashed" />
              <span className="text-text-muted">Target (15%)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis domain={[10, 30]} unit="%" stroke="#94A3B8" fontSize={11} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1 z-50">
                        <span className="font-bold text-text-primary">{label}</span>
                        <div className="flex items-center justify-between gap-4 font-mono text-[11px]">
                          <span className="text-rose-600">Critical Gap Rate: <strong>{val}%</strong></span>
                          <span className="text-text-muted">Target: 15%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={15}
                stroke="#0D9488"
                strokeDasharray="3 3"
                label={{
                  value: 'MoSPI Target: 15%',
                  fill: '#0D9488',
                  fontSize: 10,
                  position: 'bottom',
                }}
              />
              <Line
                type="monotone"
                dataKey="criticalGapRate"
                stroke="#E11D48"
                strokeWidth={3}
                dot={{ r: 4, fill: '#E11D48' }}
                activeDot={{ r: 6, fill: '#BE123C' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-teal-light/50 border border-teal/20 rounded-xl p-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-text-primary block">
            Longitudinal Progress
          </span>
          <p className="text-text-secondary leading-relaxed mt-0.5">
            Organization-wide critical competency gaps have decreased by 6 percentage points over six months (24% in April &rarr; 18% in September).
          </p>
        </div>
      </div>
    </div>
  );
}
