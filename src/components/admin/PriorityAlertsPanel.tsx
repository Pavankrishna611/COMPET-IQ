'use client';

import React from 'react';
import Link from 'next/link';
import { PriorityAlertItem } from '@/data/adminDashboard';
import { AlertCircle, AlertTriangle, Info, ArrowRight, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PriorityAlertsPanelProps {
  alerts: PriorityAlertItem[];
}

export function PriorityAlertsPanel({ alerts }: PriorityAlertsPanelProps) {
  const getSeverityBadge = (severity: PriorityAlertItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="critical" size="sm">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'MEDIUM':
      default:
        return <Badge variant="info" size="sm">Medium</Badge>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border-light pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-500" />
          <h3 className="text-base font-bold text-text-primary">
            Priority Alerts
          </h3>
        </div>

        <Link href="/admin/insights">
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            className="text-xs text-primary font-semibold h-7"
          >
            View All Insights
          </Button>
        </Link>
      </div>

      {/* Alerts list */}
      <div className="space-y-2.5">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated transition-colors flex items-start gap-3 text-xs"
          >
            <div className="pt-0.5 shrink-0">
              {getSeverityBadge(alert.severity)}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-semibold text-text-primary leading-snug">
                {alert.message}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-text-muted">
                {alert.departmentScope && (
                  <span>Scope: {alert.departmentScope}</span>
                )}
                <span>•</span>
                <span>{alert.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
