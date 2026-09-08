'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@/components/ui';
import { Role } from '@/types';
import { ArrowLeft, Clock, LucideIcon } from 'lucide-react';

export interface PlaceholderPageProps {
  title: string;
  section: string;
  description: string;
  icon: LucideIcon;
  role?: Role;
  routePath: string;
  plannedPhase?: string;
}

export function PlaceholderPage({
  title,
  section,
  description,
  icon: Icon,
  role = 'learner',
  routePath,
  plannedPhase = 'Next Phase',
}: PlaceholderPageProps) {
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
      <div className="max-w-2xl mx-auto py-12">
        <Card className="text-center p-8 border-border shadow-card">
          <CardHeader className="items-center pb-3">
            <div className="w-14 h-14 rounded-full bg-primary-light text-primary flex items-center justify-center mb-3.5 shadow-sm">
              <Icon className="w-7 h-7" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="teal" size="sm" withDot>
                Coming Soon
              </Badge>
              <Badge variant="neutral" size="sm">
                {plannedPhase}
              </Badge>
            </div>

            <CardTitle className="text-xl font-bold text-text-primary">{title}</CardTitle>
            <CardDescription className="text-xs text-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="p-3.5 bg-[#F5F8FC] border border-border-light rounded-btn mb-6 flex items-center justify-center gap-2 text-xs text-text-muted">
              <Clock className="w-4 h-4 text-primary" />
              <span>
                Registered route: <strong className="text-text-primary font-mono">{routePath}</strong>
              </span>
            </div>

            <Link href={role === 'admin' ? '/admin/dashboard' : role === 'trainer' ? '/trainer/assessment-generator' : '/learner/dashboard'}>
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
