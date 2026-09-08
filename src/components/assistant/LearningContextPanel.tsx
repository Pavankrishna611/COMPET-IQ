'use client';

import React from 'react';
import Link from 'next/link';
import { LearningContextProfile } from '@/data/assistant';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Compass,
  CheckCircle2,
  Flame,
  Award,
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface LearningContextPanelProps {
  context: LearningContextProfile;
}

export function LearningContextPanel({ context }: LearningContextPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface border-l border-border p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-light">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
            Learning Context
          </h3>
        </div>

        <Badge variant="teal" size="sm" className="font-mono text-[10px]">
          Sync Active
        </Badge>
      </div>

      {/* 1. Context Awareness Demo Banner (SIH Presentation Highlight) */}
      <div className="p-3.5 bg-gradient-to-br from-primary-light/80 via-surface to-teal-light/40 border border-primary/20 rounded-xl space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Personalized Learning Context</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          COMPETIQ considers your role, competency profile, learning history and assessment performance when generating learning guidance.
        </p>

        {/* Signals Checklist */}
        <div className="space-y-1 pt-1.5 border-t border-border-light">
          {context.contextSignals.map((signal, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{signal.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Role & Goal */}
      <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border-light space-y-2 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Current Cadre Role
          </span>
          <span className="font-bold text-text-primary">{context.role}</span>
          <p className="text-[11px] text-text-muted">{context.division}</p>
        </div>

        <div className="pt-2 border-t border-border-light">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Active Learning Goal
          </span>
          <span className="font-semibold text-text-primary">{context.currentLearningGoal}</span>
        </div>
      </div>

      {/* 3. Overall Competency & Focus */}
      <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border-light space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            Overall Competency Score
          </span>
          <span className="font-mono font-bold text-primary">{context.overallCompetencyScore}%</span>
        </div>
        <ProgressBar value={context.overallCompetencyScore} variant="blue" size="sm" />

        <div className="pt-2 border-t border-border-light">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
            Current Course Focus
          </span>
          <span className="font-bold text-text-primary block mt-0.5">
            {context.currentFocusCourse}
          </span>
        </div>
      </div>

      {/* 4. Priority Competency Level Gap */}
      <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border-light space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {context.priorityCompetency.name} Competency
          </span>
          <Badge variant="critical" size="sm">
            Critical Gap
          </Badge>
        </div>

        <div className="flex items-center justify-between font-mono pt-1">
          <span className="text-text-secondary text-xs">
            Current: <strong>{context.priorityCompetency.current} / 5</strong>
          </span>
          <span className="text-text-primary text-xs">
            Req: <strong>{context.priorityCompetency.required} / 5</strong>
          </span>
        </div>

        <Link href="/learner/skill-gaps" className="block pt-1">
          <Button
            size="sm"
            variant="ghost"
            rightIcon={<ArrowRight className="w-3 h-3" />}
            className="w-full justify-between text-[11px] h-7 px-2 font-semibold text-primary hover:bg-primary-light/50"
          >
            Analyze Skill Gap
          </Button>
        </Link>
      </div>

      {/* 5. Recommended Next Step */}
      <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border-light space-y-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
          Recommended Next Step
        </span>
        <span className="font-bold text-text-primary block">
          {context.recommendedNextStep.title}
        </span>

        <Link href={context.recommendedNextStep.actionUrl}>
          <Button
            size="sm"
            variant="secondary"
            rightIcon={<ArrowRight className="w-3 h-3" />}
            className="w-full justify-center text-xs h-8 font-semibold mt-1"
          >
            View Learning Path
          </Button>
        </Link>
      </div>

      {/* 6. Recent Assessment & Learning Streak */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-surface-elevated/60 rounded-xl border border-border-light space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase">
            <Award className="w-3 h-3 text-amber-500" />
            <span>Recent Test</span>
          </div>
          <span className="font-bold text-text-primary block truncate">
            {context.recentAssessment.title}
          </span>
          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
            Score: {context.recentAssessment.score}%
          </span>
        </div>

        <div className="p-2.5 bg-surface-elevated/60 rounded-xl border border-border-light space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Streak</span>
          </div>
          <span className="font-bold font-mono text-text-primary text-sm block">
            {context.learningStreakDays} Days
          </span>
          <span className="text-[10px] text-text-muted block">Consistent Learner</span>
        </div>
      </div>
    </div>
  );
}
