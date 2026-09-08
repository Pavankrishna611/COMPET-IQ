'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { competencyRadarData, competencyCategoriesSummary } from '@/data/dashboard';
import { Award, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      domain: string;
      score: number;
    };
  }>;
}

const CustomRadarTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface border border-border px-3 py-2 rounded-btn shadow-card text-xs">
        <span className="font-semibold text-text-primary block mb-0.5">{data.domain}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-text-secondary">Assessed Level:</span>
          <span className="font-bold text-primary font-mono">{data.score}/100</span>
        </div>
      </div>
    );
  }
  return null;
};

export function CompetencyRadarChart() {
  return (
    <Card className="p-5 lg:p-6 shadow-card border-border">
      <CardHeader className="p-0 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
              Competency Overview
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary mt-0.5">
              Current competency across major professional domains
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="teal" size="sm" withDot>
              NSSTA Framework
            </Badge>
            <Badge variant="neutral" size="sm">
              8 Assessed Vectors
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Recharts Radar Chart */}
          <div className="lg:col-span-7 w-full h-[320px] sm:h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyRadarData}>
                <PolarGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fill: '#526579', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#7A8A9A', fontSize: 10 }}
                  axisLine={false}
                />
                <RechartsTooltip content={<CustomRadarTooltip />} />
                <Radar
                  name="Officer Competency"
                  dataKey="score"
                  stroke="#1769AA"
                  fill="#0E9F9A"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Overall Competency Summary & Category Breakdown */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-[#F8FAFC] border border-border-light p-4 sm:p-5 rounded-btn">
            {/* Overall Score Highlight */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border-light">
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-0.5">
                  Aggregated Attainment
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-text-primary tracking-tight">
                    {competencyCategoriesSummary.overallScore}%
                  </span>
                  <span className="text-xs font-semibold text-teal flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Overall Competency
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-6 h-6" />
              </div>
            </div>

            {/* Narrative Summary */}
            <p className="text-xs text-text-secondary leading-relaxed">
              {competencyCategoriesSummary.summaryText}
            </p>

            {/* Category Groups */}
            <div className="space-y-3 pt-2">
              {/* Strong */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs font-bold text-text-primary">
                    Strong (Score ≥ 80)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {competencyCategoriesSummary.strong.map((item) => (
                    <Badge key={item} variant="success" size="sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Good */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-text-primary">
                    Good (Score 65 - 79)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {competencyCategoriesSummary.good.map((item) => (
                    <Badge key={item} variant="info" size="sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Developing */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-bold text-text-primary">
                    Developing (Score &lt; 65)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {competencyCategoriesSummary.developing.map((item) => (
                    <Badge key={item} variant="warning" size="sm">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
