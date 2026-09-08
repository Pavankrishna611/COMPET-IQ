'use client';

import React from 'react';
import { DetailedInsightItem } from '@/data/workforceInsights';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { X, Sparkles, BrainCircuit, ShieldCheck, CheckCircle2, AlertCircle, Info, FileText } from 'lucide-react';

interface InsightDetailModalProps {
  insight: DetailedInsightItem | null;
  onClose: () => void;
}

export function InsightDetailModal({ insight, onClose }: InsightDetailModalProps) {
  if (!insight) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border-light pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-ai-purple bg-ai-light px-2.5 py-0.5 rounded-full border border-ai-purple/20">
                {insight.category}
              </span>
              <Badge
                variant={insight.priority === 'Critical' ? 'critical' : insight.priority === 'High' ? 'warning' : 'info'}
                size="sm"
              >
                {insight.priority} Priority
              </Badge>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-text-primary">
              {insight.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description & Impact Metric */}
        <div className="bg-surface-raised border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {insight.description}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-light text-xs font-mono">
            <span className="text-primary font-bold">{insight.trendOrRisk}</span>
            <span className="text-teal font-semibold">{insight.impactMetric}</span>
          </div>
        </div>

        {/* Evidence Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-primary" />
            Cadre Assessment Evidence &amp; Signals
          </h4>
          <ul className="space-y-1.5 text-xs text-text-secondary bg-surface-raised/50 border border-border-light rounded-xl p-3.5">
            {insight.evidence.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Affected Workforce & Recommended Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-surface-raised border border-border rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Affected Cadre Scope
            </span>
            <p className="font-medium text-text-primary leading-tight">
              {insight.affectedWorkforceSummary}
            </p>
          </div>

          <div className="bg-primary-light/60 border border-primary/20 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
              Prescribed Action
            </span>
            <p className="font-semibold text-primary leading-tight">
              {insight.actionText}
            </p>
          </div>
        </div>

        {/* Confidence & Source Attribution Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-ai-light/50 border border-ai-purple/20 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-ai-purple shrink-0" />
            <span>
              Heuristic Confidence Score: <strong className="text-ai-purple font-mono">{insight.confidenceScore}%</strong>
            </span>
          </div>
          <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
            <Info className="w-3 h-3" />
            Source: COMPETIQ Demo Analytics
          </span>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border-light">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done Reviewing
          </Button>
        </div>
      </div>
    </div>
  );
}
