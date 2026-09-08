'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { learningPathAiInsight } from '@/data/learningPaths';
import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export function PathInsightCard({ confidence = 94 }: { confidence?: number }) {
  return (
    <Card className="p-5 bg-gradient-to-br from-surface to-ai-light/30 border-ai-purple/30 shadow-card flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-ai-purple/20 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                {learningPathAiInsight.title}
              </CardTitle>
              <CardDescription className="text-[11px] text-text-secondary">
                Curriculum sequencing optimization
              </CardDescription>
            </div>
          </div>

          <Badge variant="ai" size="sm" withDot>
            {confidence}% Confidence
          </Badge>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-3.5">
          {learningPathAiInsight.explanation}
        </p>

        <div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
            Prioritized Development Sequences
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {learningPathAiInsight.priorities.map((item, idx) => (
              <div
                key={item.name}
                className="p-2 bg-surface/90 border border-ai-purple/15 rounded-btn flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-text-primary truncate max-w-[150px]">
                  {idx + 1}. {item.name}
                </span>
                <Badge variant={item.badgeVariant} size="sm">
                  {item.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-ai-purple/20 flex items-center justify-between text-[11px] text-text-muted">
        <span className="flex items-center gap-1 text-teal font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          NSSTA Curriculum Matched
        </span>
        <span className="font-mono text-[10px] text-ai-purple">v2026.4</span>
      </div>
    </Card>
  );
}
