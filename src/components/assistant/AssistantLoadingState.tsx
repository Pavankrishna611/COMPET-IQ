'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, BrainCircuit, FileSearch, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const STAGES = [
  { id: 1, label: 'Analyzing your learning context...', icon: BrainCircuit },
  { id: 2, label: 'Reviewing relevant learning materials...', icon: FileSearch },
  { id: 3, label: 'Preparing a competency-focused response...', icon: Sparkles },
];

export function AssistantLoadingState() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStageIndex(1), 300);
    const timer2 = setTimeout(() => setStageIndex(2), 650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const currentStage = STAGES[stageIndex];
  const IconComponent = currentStage.icon;

  return (
    <div className="flex items-start gap-3 p-4 bg-surface border border-border rounded-2xl shadow-sm animate-in fade-in duration-300 max-w-2xl">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#123B66] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary">
              COMPETIQ Intelligence
            </span>
            <span className="flex items-center gap-1 text-[11px] text-primary font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Thinking</span>
            </span>
          </div>

          <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
            Demo Simulation
          </Badge>
        </div>

        {/* Dynamic Thinking Step */}
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface-elevated/60 px-3 py-2 rounded-xl border border-border-light">
          <IconComponent className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
          <span className="font-medium">{currentStage.label}</span>
        </div>
      </div>
    </div>
  );
}
