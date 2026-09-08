'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { Role } from '@/types';
import { ArrowLeft, Construction } from 'lucide-react';

export interface RoutePlaceholderProps {
  title: string;
  section: string;
  role?: Role;
  routePath: string;
  plannedPhase?: string;
}

export function RoutePlaceholder({
  title,
  section,
  role = 'learner',
  routePath,
  plannedPhase = 'Part 1 / Future Part',
}: RoutePlaceholderProps) {
  return (
    <AppShell
      title={title}
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: section },
        { label: title },
      ]}
      defaultRole={role}
    >
      <div className="max-w-2xl mx-auto py-8">
        <Card className="text-center p-6">
          <CardHeader className="items-center pb-2">
            <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3">
              <Construction className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="neutral" size="sm">
                Route Prepared
              </Badge>
              <Badge variant="teal" size="sm">
                {plannedPhase}
              </Badge>
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="font-mono text-[11px] text-text-muted mt-1">
              {routePath}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <p className="text-xs text-text-secondary leading-relaxed max-w-md mx-auto mb-6">
              This route shell is registered and ready in the Next.js App Router architecture. 
              The complete domain view will be constructed during its designated implementation phase in accordance with the project roadmap.
            </p>

            <Link href="/">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Return to Foundation Showcase
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
