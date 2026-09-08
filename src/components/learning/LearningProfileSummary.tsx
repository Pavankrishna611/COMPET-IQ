'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { learningProfileSummary } from '@/data/learningPaths';
import { Briefcase, Building2, Target, Clock, ArrowRight, Sparkles } from 'lucide-react';

export function LearningProfileSummary() {
  return (
    <Card className="p-5 lg:p-6 bg-surface border-border shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Info */}
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="teal" size="sm" withDot>
              Target Pathway
            </Badge>
            <span className="text-[11px] text-text-muted">
              Official Statistical System • Cadre Progression
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-text-primary">
              <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
              {learningProfileSummary.role}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-text-secondary">
              <Building2 className="w-3.5 h-3.5 text-teal shrink-0" />
              {learningProfileSummary.department} ({learningProfileSummary.division})
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Target className="w-3.5 h-3.5 text-ai-purple shrink-0" />
              Goal: <strong className="text-text-primary">{learningProfileSummary.goal}</strong>
            </span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            {learningProfileSummary.description}
          </p>
        </div>

        {/* Right Progression Visual */}
        <div className="p-4 bg-[#F8FAFC] border border-border-light rounded-btn flex flex-col justify-between shrink-0 min-w-[280px]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Current
              </span>
              <span className="text-xl font-bold text-text-primary font-mono">
                {learningProfileSummary.currentCompetency}%
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-success">+8% Lift</span>
              <ArrowRight className="w-4 h-4 text-teal" />
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-teal block">
                Target
              </span>
              <span className="text-xl font-bold text-teal font-mono">
                {learningProfileSummary.targetCompetency}%
              </span>
            </div>
          </div>

          <div className="relative w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-2">
            <div
              className="absolute top-0 bottom-0 bg-teal/25 rounded-full"
              style={{ width: `${learningProfileSummary.targetCompetency}%` }}
            />
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${learningProfileSummary.currentCompetency}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal" />
              Estimated Duration: <strong className="text-text-primary">{learningProfileSummary.estimatedDuration}</strong>
            </span>
            <span className="font-semibold text-primary">Pathway Active</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
