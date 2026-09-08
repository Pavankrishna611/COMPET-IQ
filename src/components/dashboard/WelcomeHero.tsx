'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Calendar, Briefcase, Building2, CheckCircle2 } from 'lucide-react';
import { learnerProfileOverview } from '@/data/dashboard';
import { useAuth } from '@/context/AuthContext';

export function WelcomeHero() {
  const { currentUser } = useAuth();
  const name = currentUser?.name ? currentUser.name.split(' ')[0] : learnerProfileOverview.greetingName;
  const designation = currentUser?.designation || learnerProfileOverview.role;
  const department = currentUser?.department || learnerProfileOverview.department;

  return (
    <div className="flex flex-col lg:flex-row items-stretch gap-4">
      {/* Officer Greeting & Context Card */}
      <Card className="flex-1 p-5 lg:p-6 bg-surface border-border flex flex-col justify-between shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="teal" size="sm" withDot>
              Official Statistical Cadre
            </Badge>
            <span className="text-[11px] text-text-muted">
              MoSPI • Government of India
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Good morning, {name}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {learnerProfileOverview.subtitle}
          </p>
        </div>

        <div className="mt-4 pt-3.5 border-t border-border-light flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{designation}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-text-primary">
            <Building2 className="w-3.5 h-3.5 text-teal shrink-0" />
            <span>{department}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-muted ml-auto sm:ml-0">
            <Calendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span>{learnerProfileOverview.lastAnalyzedStatus}</span>
          </div>
        </div>
      </Card>

      {/* Right AI Intelligence Status Card */}
      <Card className="lg:w-80 p-5 bg-gradient-to-br from-surface to-ai-light/30 border-ai-purple/30 flex flex-col justify-between shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-ai-purple/5 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-ai-purple tracking-wide">
                {learnerProfileOverview.aiStatus.badge}
              </span>
            </div>
            
            <Badge variant="ai" size="sm" withDot>
              {learnerProfileOverview.aiStatus.status}
            </Badge>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            {learnerProfileOverview.aiStatus.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-ai-purple/20 flex items-center justify-between text-[11px] text-text-muted">
          <span className="flex items-center gap-1 text-success font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vector Benchmarked
          </span>
          <span className="font-mono text-[10px] text-ai-purple bg-ai-purple/10 px-1.5 py-0.5 rounded">
            NSSTA-2026
          </span>
        </div>
      </Card>
    </div>
  );
}
