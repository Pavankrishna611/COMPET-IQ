'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { skillGapMatrixData, SkillGapMatrixItem } from '@/data/skillGaps';
import { Table, ArrowRight, ArrowUpRight } from 'lucide-react';

export function SkillGapMatrixTable() {
  const getPriorityBadge = (priority: SkillGapMatrixItem['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <Badge variant="critical" size="sm" withDot>
            CRITICAL
          </Badge>
        );
      case 'HIGH':
        return (
          <Badge variant="warning" size="sm" withDot>
            HIGH
          </Badge>
        );
      case 'MODERATE':
      default:
        return (
          <Badge variant="info" size="sm" withDot>
            MODERATE
          </Badge>
        );
    }
  };

  return (
    <Card className="p-5 border-border shadow-card">
      <CardHeader className="p-0 pb-4 border-b border-border-light">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-teal-light text-teal flex items-center justify-center">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-text-primary">
                Skill Gap Matrix
              </CardTitle>
              <CardDescription className="text-xs text-text-secondary">
                Tabular prioritization of competencies requiring development interventions
              </CardDescription>
            </div>
          </div>
          <Badge variant="neutral" size="sm">
            {skillGapMatrixData.length} Target Vectors
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-light bg-[#F8FAFC]">
                <th className="py-3 px-4 font-bold text-text-secondary uppercase text-[10px] tracking-wider">
                  Competency
                </th>
                <th className="py-3 px-3 font-bold text-text-secondary uppercase text-[10px] tracking-wider text-center">
                  Current
                </th>
                <th className="py-3 px-3 font-bold text-text-secondary uppercase text-[10px] tracking-wider text-center">
                  Required
                </th>
                <th className="py-3 px-3 font-bold text-text-secondary uppercase text-[10px] tracking-wider text-center">
                  Gap Delta
                </th>
                <th className="py-3 px-3 font-bold text-text-secondary uppercase text-[10px] tracking-wider">
                  Priority
                </th>
                <th className="py-3 px-4 font-bold text-text-secondary uppercase text-[10px] tracking-wider">
                  Recommended Action
                </th>
                <th className="py-3 px-4 font-bold text-text-secondary uppercase text-[10px] tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {skillGapMatrixData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F8FAFC]/80 transition-colors duration-150"
                >
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    <div>
                      <span>{row.competency}</span>
                      <span className="text-[10px] text-text-muted block font-normal">
                        {row.domain}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-center font-semibold text-text-primary">
                    {row.currentLevel.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-mono text-center font-bold text-primary">
                    {row.requiredLevel.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 font-mono text-center font-bold text-critical">
                    -{row.gap.toFixed(1)}
                  </td>
                  <td className="py-3 px-3">
                    {getPriorityBadge(row.priority)}
                  </td>
                  <td className="py-3 px-4 text-text-secondary">
                    {row.recommendedAction}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={row.actionHref}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                        Resolve
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1 inline" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Fallback */}
        <div className="md:hidden space-y-3">
          {skillGapMatrixData.map((row) => (
            <div
              key={row.id}
              className="p-3.5 bg-[#F8FAFC] border border-border-light rounded-btn space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-text-primary">
                    {row.competency}
                  </h4>
                  <span className="text-[10px] text-text-muted">{row.domain}</span>
                </div>
                {getPriorityBadge(row.priority)}
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-surface border border-border-light rounded text-center text-xs">
                <div>
                  <span className="text-[10px] text-text-muted block">Current</span>
                  <span className="font-mono font-bold text-text-primary">
                    {row.currentLevel.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Target</span>
                  <span className="font-mono font-bold text-primary">
                    {row.requiredLevel.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Gap</span>
                  <span className="font-mono font-bold text-critical">
                    -{row.gap.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-text-secondary flex items-start gap-1">
                <span className="font-semibold text-text-primary shrink-0">Action:</span>
                <span>{row.recommendedAction}</span>
              </div>

              <div className="pt-2 border-t border-border-light flex justify-end">
                <Link href={row.actionHref} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full text-xs">
                    View Pathway Intervention
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
