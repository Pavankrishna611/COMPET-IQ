'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { aiInsightContent, learningImpactForecast } from '@/data/skillGaps';
import { Sparkles, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export function AIInsightAndForecast() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left: AI Insight Card (col-span-7) */}
      <Card className="lg:col-span-7 p-5 lg:p-6 border-ai-purple/30 bg-gradient-to-br from-surface to-ai-light/30 shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-ai-purple/20 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-text-primary">
                  {aiInsightContent.title}
                </CardTitle>
                <CardDescription className="text-[11px] text-text-secondary">
                  Workforce intelligence diagnostic algorithm
                </CardDescription>
              </div>
            </div>

            <Badge variant="ai" size="sm" withDot>
              {aiInsightContent.confidenceScore}% Confidence
            </Badge>
          </div>

          <p className="text-xs text-text-primary leading-relaxed font-medium mb-4">
            {aiInsightContent.observation}
          </p>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
              Strategic Interventions
            </span>
            <div className="space-y-1.5">
              {aiInsightContent.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-surface/80 border border-ai-purple/15 rounded-btn flex items-start gap-2 text-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-ai-purple/10 text-ai-purple flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-text-secondary">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-ai-purple/20 flex items-center justify-between text-[11px] text-text-muted">
          <span>Official Statistical Cadre Calibration</span>
          <span className="font-mono text-[10px] text-ai-purple">{aiInsightContent.modelTimestamp}</span>
        </div>
      </Card>

      {/* Right: Learning Impact Forecast Card (col-span-5) */}
      <Card className="lg:col-span-5 p-5 lg:p-6 border-border shadow-card flex flex-col justify-between bg-surface">
        <div>
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border-light mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-text-primary">
                  Expected Competency Growth
                </CardTitle>
                <CardDescription className="text-[11px] text-text-secondary">
                  Predictive learning impact forecast
                </CardDescription>
              </div>
            </div>

            <Badge variant="teal" size="sm" withDot>
              Pathway Forecast
            </Badge>
          </div>

          {/* Progression Metric Display */}
          <div className="p-4 bg-[#F8FAFC] border border-border-light rounded-btn mb-4">
            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block mb-2 text-center">
              Projected Cadre Competency Evolution
            </span>

            <div className="flex items-center justify-center gap-4">
              {/* Current */}
              <div className="text-center">
                <span className="text-2xl font-bold text-text-primary font-mono block">
                  {learningImpactForecast.currentCompetency}%
                </span>
                <span className="text-[10px] text-text-muted">Current</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-success">
                  +{learningImpactForecast.estimatedImprovement}%
                </span>
                <ArrowRight className="w-5 h-5 text-teal" />
              </div>

              {/* Projected */}
              <div className="text-center">
                <span className="text-2xl font-bold text-teal font-mono block">
                  {learningImpactForecast.projectedCompetency}%
                </span>
                <span className="text-[10px] text-teal font-medium">Projected</span>
              </div>
            </div>

            {/* Visual dual progress bar */}
            <div className="mt-4 relative w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-teal/30 rounded-full"
                style={{ width: `${learningImpactForecast.projectedCompetency}%` }}
              />
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${learningImpactForecast.currentCompetency}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>Baseline: {learningImpactForecast.currentCompetency}%</span>
              <span>Target: {learningImpactForecast.projectedCompetency}%</span>
            </div>
          </div>

          {/* Timeline & Commitment */}
          <div className="flex items-center justify-between p-3 bg-surface border border-border-light rounded-btn text-xs mb-3">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Clock className="w-3.5 h-3.5 text-teal" />
              Estimated Pathway Duration:
            </span>
            <span className="font-bold text-text-primary font-mono">
              {learningImpactForecast.timeEstimate}
            </span>
          </div>

          <p className="text-[11px] text-text-muted leading-relaxed italic">
            &quot;{learningImpactForecast.disclaimer}&quot;
          </p>
        </div>

        <div className="pt-3 border-t border-border-light flex items-center justify-between text-[11px] text-text-muted">
          <span className="flex items-center gap-1 text-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Curriculum Aligned
          </span>
          <span>iGOT & NSSTA Modules</span>
        </div>
      </Card>
    </div>
  );
}
