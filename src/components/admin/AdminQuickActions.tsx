'use client';

import React from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, GraduationCap, BrainCircuit, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminQuickActions() {
  const actions = [
    {
      label: 'View Workforce',
      description: 'Inspect officer cadre distributions & profiles',
      href: '/admin/workforce',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary-light',
    },
    {
      label: 'Analyze Skill Gaps',
      description: 'Deep dive into departmental gap matrices',
      href: '/admin/skill-gaps',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    },
    {
      label: 'Training Analytics',
      description: 'iGOT Karmayogi & NSSTA course enrollments',
      href: '/admin/training',
      icon: GraduationCap,
      color: 'text-teal',
      bgColor: 'bg-teal-light',
    },
    {
      label: 'View AI Insights',
      description: 'Strategic workforce forecasting & alerts',
      href: '/admin/insights',
      icon: BrainCircuit,
      color: 'text-ai-purple',
      bgColor: 'bg-ai-light',
    },
  ];

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border-light pb-3">
        <h3 className="text-base font-bold text-text-primary">
          Administrator Strategic Actions
        </h3>
        <span className="text-xs text-text-muted">Executive Shortcuts</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="p-4 rounded-xl border border-border bg-surface-elevated/40 hover:border-primary/40 hover:bg-surface-elevated transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
            >
              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-snug mt-0.5">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-1 border-t border-border-light/60">
                <span>Access Module</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
