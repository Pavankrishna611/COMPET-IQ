'use client';

import React, { useState } from 'react';
import { LowEngagementAlertItem } from '@/data/trainingAnalytics';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, AlertCircle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface LowEngagementAlertsProps {
  alerts: LowEngagementAlertItem[];
}

export function LowEngagementAlerts({ alerts }: LowEngagementAlertsProps) {
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  const handleAcknowledge = (id: string) => {
    setAcknowledged((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAcknowledged((prev) => ({ ...prev, [id]: false }));
    }, 4000);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-text-primary">
            Directorate Low-Engagement Alerts
          </h3>
        </div>
        <span className="text-xs font-mono text-text-muted">
          Active Intervention Required
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const isDone = acknowledged[alert.id];

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                alert.severity === 'Critical'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">
                    {alert.department}
                  </span>
                  <Badge
                    variant={alert.severity === 'Critical' ? 'critical' : 'warning'}
                    size="sm"
                    withDot
                  >
                    {alert.severity}
                  </Badge>
                </div>

                <div className="text-xs font-mono">
                  <span className="text-text-muted">{alert.metricLabel}: </span>
                  <strong className={alert.severity === 'Critical' ? 'text-rose-600' : 'text-amber-600'}>
                    {alert.metricValue}
                  </strong>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {alert.recommendation}
                </p>
              </div>

              <div className="pt-2">
                {isDone ? (
                  <div className="p-2 bg-teal-light text-teal border border-teal/20 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Intervention Scheduled
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAcknowledge(alert.id)}
                    className="w-full text-xs font-semibold justify-center gap-1.5"
                  >
                    {alert.actionText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
