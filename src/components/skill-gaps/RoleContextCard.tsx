'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { roleContextData } from '@/data/skillGaps';
import { Briefcase, Building2, Layers, Sparkles, CheckCircle2 } from 'lucide-react';

export interface RoleContextCardProps {
  roleTitle?: string;
  departmentName?: string;
}

export function RoleContextCard({ roleTitle, departmentName }: RoleContextCardProps = {}) {
  const displayRole = roleTitle || roleContextData.role;
  const displayDept = departmentName || `${roleContextData.department} (${roleContextData.division})`;

  return (
    <Card className="p-5 bg-surface border-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="teal" size="sm" withDot>
            {roleContextData.framework}
          </Badge>
          <Badge variant="neutral" size="sm">
            {roleContextData.roleLevel}
          </Badge>
          <Badge variant="ai" size="sm" withDot>
            <Sparkles className="w-3 h-3 text-ai-purple mr-1 inline" />
            {roleContextData.aiStatus}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-bold text-text-primary">
            <Briefcase className="w-4 h-4 text-primary shrink-0" />
            Role: {displayRole}
          </span>
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <Building2 className="w-4 h-4 text-teal shrink-0" />
            Dept: {displayDept}
          </span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed max-w-3xl">
          {roleContextData.explanation}
        </p>
      </div>

      <div className="p-3.5 bg-gradient-to-r from-ai-light/50 to-teal-light/30 border border-ai-purple/20 rounded-btn flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface border border-ai-purple/30 flex items-center justify-center text-ai-purple font-bold font-mono text-sm shadow-xs">
          {roleContextData.confidenceScore}%
        </div>
        <div>
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">
            Model Precision
          </span>
          <span className="text-xs font-bold text-text-primary flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            High Confidence
          </span>
        </div>
      </div>
    </Card>
  );
}
