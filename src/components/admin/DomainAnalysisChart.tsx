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
import { WorkforceDomainMetric } from '@/data/workforce';
import { Layers, Sparkles } from 'lucide-react';

interface DomainAnalysisChartProps {
  metrics: WorkforceDomainMetric[];
}

export function DomainAnalysisChart({ metrics }: DomainAnalysisChartProps) {
  const getBarColor = (score: number, benchmark: number) => {
    if (score >= benchmark) return '#0D9488'; // teal (strong)
    if (score >= benchmark - 5) return '#123B66'; // primary navy (good)
    return '#F59E0B'; // amber (opportunity)
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Competency Strength by Domain
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Assessed institutional capabilities across four professional MoSPI dimensions
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/20">
            Cadre Baseline
          </span>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={metrics}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                stroke="#94A3B8"
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey="domain"
                stroke="#94A3B8"
                fontSize={11}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as WorkforceDomainMetric;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <div className="font-bold text-text-primary">
                          {data.domain}
                        </div>
                        <div className="text-text-secondary leading-snug max-w-xs">
                          {data.description}
                        </div>
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-light font-mono text-[11px]">
                          <span>Assessed: <strong className="text-primary">{data.score}%</strong></span>
                          <span className="text-text-muted">Target: {data.benchmark}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={70}
                stroke="#64748B"
                strokeDasharray="3 3"
                label={{
                  value: 'Min Benchmark 70%',
                  fill: '#64748B',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                {metrics.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.score, entry.benchmark)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contextual Takeaway */}
      <div className="bg-primary-light/60 border border-primary/20 rounded-xl p-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-text-primary block">
            Cadre Capability Takeaway
          </span>
          <p className="text-text-secondary leading-relaxed mt-0.5">
            Technical competencies represent the largest organization-wide development opportunity (64% vs 75% target threshold).
          </p>
        </div>
      </div>
    </div>
  );
}
