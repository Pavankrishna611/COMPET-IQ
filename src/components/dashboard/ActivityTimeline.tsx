'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { recentActivities, ActivityItem } from '@/data/dashboard';
import { CheckCircle2, Award, TrendingUp, Sparkles, History, Clock } from 'lucide-react';

export function ActivityTimeline() {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'course_completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-success" />,
          bg: 'bg-success-light border-success/30',
        };
      case 'assessment_passed':
        return {
          icon: <Award className="w-4 h-4 text-primary" />,
          bg: 'bg-primary-light border-primary/30',
        };
      case 'competency_improved':
        return {
          icon: <TrendingUp className="w-4 h-4 text-teal" />,
          bg: 'bg-teal-light border-teal/30',
        };
      case 'recommendation_new':
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-ai-purple" />,
          bg: 'bg-ai-light border-ai-purple/30',
        };
    }
  };

  return (
    <Card className="p-5 border-border shadow-card h-full flex flex-col justify-between">
      <CardHeader className="p-0 pb-4 border-b border-border-light">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-primary-light text-primary flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary">
                Recent Activity
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Verified training and evaluation milestones
              </CardDescription>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            Last 7 Days
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4 flex-1">
        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border-light">
          {recentActivities.map((act) => {
            const { icon, bg } = getActivityIcon(act.type);
            return (
              <div key={act.id} className="relative group">
                {/* Node */}
                <div
                  className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center -translate-x-1/2 bg-surface shadow-xs ${bg}`}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {act.title}
                      </span>
                      {act.score && (
                        <Badge
                          variant={act.score.startsWith('+') ? 'teal' : 'info'}
                          size="sm"
                        >
                          {act.score}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      {act.meta}
                    </span>
                  </div>

                  <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {act.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
