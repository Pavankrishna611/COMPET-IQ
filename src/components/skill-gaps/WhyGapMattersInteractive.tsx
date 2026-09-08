'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { whyGapMattersData } from '@/data/skillGaps';
import { HelpCircle, AlertCircle, ArrowUpRight, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export function WhyGapMattersInteractive() {
  const [selectedKey, setSelectedKey] = useState<string>('Python');
  const selected = whyGapMattersData[selectedKey] || whyGapMattersData['Python'];

  const options = ['Python', 'Data Visualization', 'GIS', 'AI/ML'];

  return (
    <Card className="p-5 lg:p-6 border-border shadow-card">
      <CardHeader className="p-0 pb-4 border-b border-border-light">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
                Why This Gap Matters
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Select a competency to inspect operational consequences, role requirements, and expected benefits
              </CardDescription>
            </div>
          </div>

          <Badge variant="teal" size="sm" withDot>
            Interactive Analysis
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-5 space-y-5">
        {/* Selector Buttons */}
        <div className="flex flex-wrap gap-2">
          {options.map((key) => {
            const isSelected = selectedKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-btn border transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-[#F8FAFC] text-text-secondary border-border hover:bg-surface hover:text-text-primary'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Dynamic Detail Card */}
        <div className="bg-[#F8FAFC] border border-border-light rounded-btn p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border-light">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                Target Competency Vector
              </span>
              <h4 className="text-base font-bold text-text-primary">
                {selected.name}
              </h4>
            </div>
            <Badge variant="ai" size="sm" withDot>
              <TrendingUp className="w-3 h-3 text-ai-purple mr-1 inline" />
              {selected.scoreImprovement}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role Requirement */}
            <div className="p-3.5 bg-surface border border-border-light rounded-btn space-y-1.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Role Requirement
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {selected.roleRequirement}
              </p>
            </div>

            {/* Current Impact */}
            <div className="p-3.5 bg-surface border border-border-light rounded-btn space-y-1.5">
              <span className="text-[10px] font-bold text-warning uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-warning" />
                Current Operational Impact
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {selected.currentImpact}
              </p>
            </div>

            {/* Future Impact */}
            <div className="p-3.5 bg-surface border border-border-light rounded-btn space-y-1.5">
              <span className="text-[10px] font-bold text-teal uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-teal" />
                Future Impact & Cadre Progression
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {selected.futureImpact}
              </p>
            </div>

            {/* Expected Benefit */}
            <div className="p-3.5 bg-surface border border-border-light rounded-btn space-y-1.5">
              <span className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                Expected Attainment Benefit
              </span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {selected.expectedBenefit}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
