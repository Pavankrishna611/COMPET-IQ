'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckSquare, BookOpen, Bot, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'Take Assessment',
      description: 'Test statistical competency & earn verified badges',
      href: '/learner/assessments',
      icon: <CheckSquare className="w-4 h-4 text-primary" />,
      btnText: 'Launch Test',
      variant: 'primary' as const,
      borderClass: 'hover:border-primary',
    },
    {
      title: 'Explore Courses',
      description: 'Access accredited iGOT & NSSTA curriculum',
      href: '/learner/courses',
      icon: <BookOpen className="w-4 h-4 text-teal" />,
      btnText: 'Browse Catalog',
      variant: 'teal' as const,
      borderClass: 'hover:border-teal',
    },
    {
      title: 'Ask AI Assistant',
      description: 'Query MoSPI methodologies, sampling & formulas',
      href: '/learner/assistant',
      icon: <Bot className="w-4 h-4 text-ai-purple" />,
      btnText: 'Chat with AI',
      variant: 'ai' as const,
      borderClass: 'hover:border-ai-purple',
    },
    {
      title: 'View Skill Gaps',
      description: 'Detailed analysis of critical cadre deficiencies',
      href: '/learner/skill-gaps',
      icon: <AlertTriangle className="w-4 h-4 text-warning" />,
      btnText: 'Inspect Gaps',
      variant: 'secondary' as const,
      borderClass: 'hover:border-warning',
    },
  ];

  return (
    <Card className="p-5 border-border shadow-card h-full flex flex-col justify-between">
      <CardHeader className="p-0 pb-4 border-b border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-btn bg-teal-light text-teal flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-text-primary">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs text-text-secondary">
              Direct access to priority intelligence workflows
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full">
          {actions.map((act) => (
            <Link
              key={act.title}
              href={act.href}
              className={`p-3.5 bg-[#F8FAFC] border border-border-light rounded-btn flex flex-col justify-between transition-all duration-200 hover:shadow-xs hover:bg-surface group ${act.borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-btn bg-surface border border-border-light flex items-center justify-center shadow-xs">
                      {act.icon}
                    </div>
                    <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      {act.title}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed pl-9">
                  {act.description}
                </p>
              </div>

              <div className="mt-3 pl-9">
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                  {act.btnText}
                  <span className="text-xs">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
