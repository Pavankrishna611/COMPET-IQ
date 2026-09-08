'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { FutureDemandProjectionItem } from '@/data/workforceInsights';
import { Info, Sparkles } from 'lucide-react';

interface FutureDemandChartProps {
  data: FutureDemandProjectionItem[];
}

export function FutureDemandChart({ data }: FutureDemandChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Future Competency Demand Forecast
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Projected workforce capability requirements for the 2026–2030 statistical modernization horizon
            </p>
          </div>

          <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5 shrink-0">
            <Info className="w-3.5 h-3.5" />
            Illustrative Projection — Demo Data
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.5} />
              <XAxis dataKey="skill" stroke="#94A3B8" fontSize={11} />
              <YAxis domain={[0, 100]} unit="%" stroke="#94A3B8" fontSize={11} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const curr = payload[0].value as number;
                    const proj = payload[1].value as number;
                    const delta = proj - curr;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <span className="font-bold text-text-primary">{label}</span>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between gap-4 text-primary">
                            <span>Current Demand:</span>
                            <strong>{curr}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-ai-purple">
                            <span>Projected Demand:</span>
                            <strong>{proj}%</strong>
                          </div>
                          <div className="pt-1 border-t border-border-light text-teal font-bold">
                            Forecasted Growth: +{delta}%
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="currentDemand"
                name="Current Demand"
                fill="#123B66"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="projectedDemand"
                name="Projected Demand (2028)"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-3 text-xs text-text-secondary flex items-center justify-between">
        <span>Fastest Growing Requirement: <strong className="text-ai-purple">Data Engineering (+26%)</strong></span>
        <span className="text-text-muted font-mono">Illustrative econometric regression modeling</span>
      </div>
    </div>
  );
}
