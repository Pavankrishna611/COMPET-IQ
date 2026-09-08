'use client';

import React, { useState } from 'react';
import { Official } from '@/data/workforce';
import { X, User, Mail, Award, BookOpen, ClipboardCheck, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface OfficialDetailDrawerProps {
  official: Official | null;
  onClose: () => void;
}

export function OfficialDetailDrawer({
  official,
  onClose,
}: OfficialDetailDrawerProps) {
  const [isActionAssigned, setIsActionAssigned] = useState(false);

  if (!official) return null;

  const handleAssignAction = () => {
    setIsActionAssigned(true);
    setTimeout(() => {
      setIsActionAssigned(false);
    }, 4000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface border-l border-border h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between space-y-6 animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-6">
          {/* Top Bar with Close Button */}
          <div className="flex items-center justify-between border-b border-border-light pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full border border-primary/20">
                Official Dossier
              </span>
              <span className="text-xs text-text-muted font-mono">
                {official.id}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Officer Header Card */}
          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md">
                {getInitials(official.name)}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-text-primary">
                  {official.name}
                </h3>
                <p className="text-xs font-medium text-text-secondary">
                  {official.designation} • {official.department}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-mono">{official.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border-light text-xs font-mono">
              <div>
                <span className="text-[10px] text-text-muted block">Cadre Service</span>
                <span className="font-semibold text-text-primary">{official.cadre}</span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted block">Service Tenure</span>
                <span className="font-semibold text-text-primary">{official.experienceYears} Years</span>
              </div>
            </div>
          </div>

          {/* Overall Competency Score Banner */}
          <div className="bg-gradient-to-r from-primary-light/50 to-teal-light/50 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
                Overall Competency Rating
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-primary">
                  {official.overallCompetency}%
                </span>
                <span className="text-xs text-text-muted">/ 100 benchmark</span>
              </div>
            </div>

            <Badge
              variant={
                official.status === 'Strong'
                  ? 'success'
                  : official.status === 'Good'
                  ? 'teal'
                  : official.status === 'Developing'
                  ? 'warning'
                  : 'critical'
              }
              size="sm"
              withDot
              className="font-semibold text-xs px-3 py-1"
            >
              {official.status}
            </Badge>
          </div>

          {/* Competency Breakdown Progress Bars */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              Core Competency Breakdown
            </h4>

            <div className="bg-surface-raised border border-border rounded-2xl p-4 space-y-3.5">
              {official.competencyBreakdown.map((comp) => {
                const isBelowTarget = comp.level < comp.target;
                return (
                  <div key={comp.skill} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">{comp.skill}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`font-bold ${isBelowTarget ? 'text-amber-600 dark:text-amber-400' : 'text-teal'}`}>
                          {comp.level}%
                        </span>
                        <span className="text-[10px] text-text-muted">
                          (Target: {comp.target}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-border-light rounded-full h-2 overflow-hidden relative">
                      {/* Target indicator marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-text-muted z-10 opacity-70"
                        style={{ left: `${comp.target}%` }}
                      />
                      <div
                        className={`h-full rounded-full transition-all ${
                          comp.level >= comp.target ? 'bg-teal' : 'bg-amber-500'
                        }`}
                        style={{ width: `${comp.level}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning Path & Recent Assessment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Current Path */}
            <div className="bg-surface-raised border border-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <BookOpen className="w-3.5 h-3.5" />
                Active Learning Track
              </div>
              <p className="font-medium text-text-primary leading-tight">
                {official.currentLearningPath}
              </p>
              <div className="pt-1 text-[11px] text-text-muted font-mono">
                {official.learningProgress}% Modules Completed
              </div>
            </div>

            {/* Recent Assessment */}
            <div className="bg-surface-raised border border-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                <ClipboardCheck className="w-3.5 h-3.5" />
                Latest Assessment
              </div>
              <p className="font-medium text-text-primary leading-tight">
                {official.recentAssessment.title}
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span>Score: <strong className="text-teal font-bold">{official.recentAssessment.score}%</strong></span>
                <span>{official.recentAssessment.date}</span>
              </div>
            </div>
          </div>

          {/* Critical Skill Gaps */}
          {official.criticalSkillGaps.length > 0 && (
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Identified Skill Deficits
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {official.criticalSkillGaps.map((gap) => (
                  <span
                    key={gap}
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800/40"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action */}
          <div className="bg-surface-raised border border-primary/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="w-4 h-4 text-primary" />
              Strategic Recommendation
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {official.recommendedAction}
            </p>

            {isActionAssigned ? (
              <div className="p-2.5 bg-teal-light text-teal border border-teal/20 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal" />
                Pathway successfully queued in official&apos;s iGOT profile.
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleAssignAction}
                className="w-full gap-2 text-xs font-semibold"
              >
                Assign Recommended Pathway
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border-light flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Dossier
          </Button>
        </div>
      </div>
    </div>
  );
}
