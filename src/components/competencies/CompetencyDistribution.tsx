'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { competencyDistributionData } from '@/data/competencies';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { PieChart as ChartIcon, CheckCircle2, TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      count: number;
      color: string;
    };
  }>;
}

const CustomPieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = Math.round((data.count / 23) * 100);
    return (
      <div className="bg-surface border border-border px-3 py-2 rounded-btn shadow-card text-xs">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="font-bold text-text-primary">{data.name}</span>
        </div>
        <span className="text-text-secondary">
          {data.count} Competencies ({percentage}%)
        </span>
      </div>
    );
  }
  return null;
};

export function CompetencyDistribution() {
  const total = competencyDistributionData.reduce((acc, curr) => acc + curr.count, 0);

  const getStatusIcon = (name: string) => {
    switch (name) {
      case 'Strong':
        return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case 'Developing':
        return <TrendingUp className="w-3.5 h-3.5 text-teal" />;
      case 'Moderate Gap':
        return <AlertCircle className="w-3.5 h-3.5 text-warning" />;
      case 'Critical Gap':
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-critical" />;
    }
  };

  return (
    <Card className="p-5 border-border shadow-card">
      <CardHeader className="p-0 pb-4 border-b border-border-light">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-teal-light text-teal flex items-center justify-center">
              <ChartIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Competency Distribution
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Classification across {total} assessed professional competencies
              </CardDescription>
            </div>
          </div>
          <Badge variant="teal" size="sm" withDot>
            23 Vectors Tracked
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-48 sm:h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Pie
                  data={competencyDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {competencyDistributionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center metric */}
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-text-primary">{total}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            {competencyDistributionData.map((item) => {
              const pct = Math.round((item.count / total) * 100);
              return (
                <div
                  key={item.name}
                  className="p-3 bg-[#F8FAFC] border border-border-light rounded-btn flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      {getStatusIcon(item.name)}
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-text-secondary">
                      {pct}%
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-text-primary font-mono">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-text-muted">competencies</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
