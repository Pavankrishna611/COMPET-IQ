import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: number | string;
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  height = 280,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="pt-2">
        <div
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="w-full relative"
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
