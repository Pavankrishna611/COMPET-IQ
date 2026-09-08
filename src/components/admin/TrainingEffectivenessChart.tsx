'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TrainingEffectivenessItem } from '@/data/trainingAnalytics';
import { TrendingUp, Sparkles } from 'lucide-react';

interface TrainingEffectivenessChartProps {
  data: TrainingEffectivenessItem[];
}

export function TrainingEffectivenessChart({ data }: TrainingEffectivenessChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Training Effectiveness (Pre vs. Post Evaluation)
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Empirical competency uplift measured before and after capacity building completion
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
              <span className="text-text-muted">Before Training</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal inline-block" />
              <span className="text-teal font-medium">After Training</span>
            </div>
          </div>
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
                    const before = payload[0].value as number;
                    const after = payload[1].value as number;
                    const delta = after - before;
                    return (
                      <div className="bg-surface border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 z-50">
                        <span className="font-bold text-text-primary">{label}</span>
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between gap-4 text-text-muted">
                            <span>Pre-Training Score:</span>
                            <strong>{before}%</strong>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-teal">
                            <span>Post-Training Score:</span>
                            <strong>{after}%</strong>
                          </div>
                          <div className="pt-1 border-t border-border-light text-primary font-bold">
                            Uplift: +{delta}% Improvement
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="beforeTraining"
                name="Before Training"
                fill="#94A3B8"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
              <Bar
                dataKey="afterTraining"
                name="After Training"
                fill="#0D9488"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-teal-light/50 border border-teal/20 rounded-xl p-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-text-primary block">
            Impact Synthesis
          </span>
          <p className="text-text-secondary leading-relaxed mt-0.5">
            Targeted learning programs demonstrate measurable competency improvement across technical domains (average +17% verified skill advancement).
          </p>
        </div>
      </div>
    </div>
  );
}
