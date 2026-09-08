'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { currentVsRequiredChartData, ComparisonChartItem } from '@/data/skillGaps';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: ComparisonChartItem;
  }>;
}

const CustomBarTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border px-3.5 py-2.5 rounded-btn shadow-card text-xs">
        <span className="font-bold text-text-primary block mb-1">{data.skill}</span>
        <div className="space-y-0.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Current Assessed:
            </span>
            <span className="font-mono font-bold text-text-primary">{data.current.toFixed(1)} / 5</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D99000]" />
              Role Benchmark:
            </span>
            <span className="font-mono font-bold text-text-primary">{data.required.toFixed(1)} / 5</span>
          </div>
          <div className="pt-1 mt-1 border-t border-border-light flex items-center justify-between gap-4">
            <span className="text-text-muted">Competency Gap:</span>
            <span className="font-mono font-bold text-critical">-{data.gap.toFixed(1)} Lvl</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CurrentVsRequiredChart() {
  return (
    <Card className="p-5 lg:p-6 border-border shadow-card">
      <CardHeader className="p-0 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-primary-light text-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
                Current vs Required Competency
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary mt-0.5">
                Direct benchmark gap differential across key statistical & technical vectors
              </CardDescription>
            </div>
          </div>
          <Badge variant="teal" size="sm" withDot>
            Scale 0 - 5.0
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="w-full h-[360px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={currentVsRequiredChartData}
              margin={{ top: 10, right: 30, left: 70, bottom: 20 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: '#7A8A9A', fontSize: 11 }}
                axisLine={{ stroke: '#D9E2EC' }}
              />
              <YAxis
                type="category"
                dataKey="skill"
                tick={{ fill: '#172B4D', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#D9E2EC' }}
                width={120}
              />
              <RechartsTooltip content={<CustomBarTooltip />} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }}
                iconType="circle"
              />
              <Bar
                name="Current Competency Level"
                dataKey="current"
                fill="#1769AA"
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
              <Bar
                name="Required Cadre Benchmark"
                dataKey="required"
                fill="#D99000"
                radius={[0, 4, 4, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
