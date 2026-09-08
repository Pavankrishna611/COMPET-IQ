'use client';

import React, { useState } from 'react';
import { FeaturedHeroInsight } from '@/data/workforceInsights';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, AlertTriangle, Users, Building2, TrendingUp, ArrowRight, CheckCircle2, BrainCircuit } from 'lucide-react';

interface WorkforceInsightHeroProps {
  hero: FeaturedHeroInsight;
  onCreateRecommendation?: () => void;
}

export function WorkforceInsightHero({ hero, onCreateRecommendation }: WorkforceInsightHeroProps) {
  const [isCreated, setIsCreated] = useState(false);

  const handleClick = () => {
    setIsCreated(true);
    if (onCreateRecommendation) onCreateRecommendation();
    setTimeout(() => {
      setIsCreated(false);
    }, 4000);
  };

  return (
    <div className="bg-gradient-to-br from-primary-light/80 via-surface to-ai-light/60 border-2 border-primary/30 rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden space-y-5">
      {/* Background ambient pattern */}
      <div className="absolute top-0 right-0 w-80 h-full bg-radial from-ai-purple/10 to-transparent pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-ai-purple text-white shadow-xs">
            <BrainCircuit className="w-3.5 h-3.5" />
            Apex Strategic AI Insight
          </span>
          <Badge variant="critical" size="sm" withDot className="font-bold text-xs">
            High Impact Cadre Deficit
          </Badge>
        </div>

        <span className="text-xs font-mono text-text-muted bg-surface/80 px-2.5 py-1 rounded-full border border-border">
          Demo Analytics • MoSPI NSS Intelligence
        </span>
      </div>

      {/* Title & Description */}
      <div className="relative z-10 space-y-2 max-w-3xl">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
          {hero.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {hero.description}
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="bg-surface/90 border border-border rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
            <Users className="w-3 h-3 text-primary" /> Affected Officials
          </span>
          <div className="text-xl font-bold font-mono text-text-primary">
            {hero.affectedOfficials.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Analytical Cadres</span>
        </div>

        <div className="bg-surface/90 border border-border rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Current Competency
          </span>
          <div className="text-xl font-bold font-mono text-rose-600">
            {hero.currentCompetency}%
          </div>
          <span className="text-[10px] text-text-muted">Assessed baseline</span>
        </div>

        <div className="bg-surface/90 border border-border rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Target Benchmark
          </span>
          <div className="text-xl font-bold font-mono text-teal">
            {hero.targetCompetency}%
          </div>
          <span className="text-[10px] text-teal font-medium">MoSPI Mandate</span>
        </div>

        <div className="bg-surface/90 border border-border rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Deficit Differential
          </span>
          <div className="text-xl font-bold font-mono text-rose-600">
            -{hero.gap}%
          </div>
          <span className="text-[10px] text-rose-600 font-medium">Critical Gap</span>
        </div>
      </div>

      {/* Affected Wings & Recommendation Action Footer */}
      <div className="pt-4 border-t border-border-light/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            Affected Statistical Directorates:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hero.affectedDepartments.map((dept) => (
              <span
                key={dept}
                className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-surface-raised border border-border text-text-primary"
              >
                {dept}
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0">
          {isCreated ? (
            <div className="px-4 py-2.5 bg-teal-light text-teal border border-teal/20 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal" />
              Strategic AI/ML Recommendation Added to Planning Queue
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleClick}
              className="gap-2 text-xs font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {hero.ctaText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
