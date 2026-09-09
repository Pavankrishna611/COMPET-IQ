'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  ClipboardCheck,
  Database,
  ArrowRight,
  BrainCircuit,
  Users,
} from 'lucide-react';

export default function TrainerDashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                NSSTA Faculty &amp; Evaluator Portal
              </span>
              <Badge variant="teal" size="sm">
                Active Session
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Trainer Dashboard
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Design AI-grounded competency assessments, curate official question banks, and review learner evaluation benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/trainer/assessment-generator">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-medium shadow-sm"
              >
                Generate Assessment
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-panel border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase">Question Bank</span>
              <Database className="w-4 h-4 text-teal" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-primary">128</span>
              <span className="text-xs text-text-muted block mt-0.5">Verified Items</span>
            </div>
          </div>

          <div className="p-4 rounded-panel border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase">Published Tests</span>
              <ClipboardCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-primary">14</span>
              <span className="text-xs text-text-muted block mt-0.5">Active Assessments</span>
            </div>
          </div>

          <div className="p-4 rounded-panel border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase">Learners Evaluated</span>
              <Users className="w-4 h-4 text-ai-purple" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-text-primary">342</span>
              <span className="text-xs text-text-muted block mt-0.5">Officers Assessed</span>
            </div>
          </div>

          <div className="p-4 rounded-panel border border-border bg-surface flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase">AI Calibration</span>
              <Sparkles className="w-4 h-4 text-warning" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600">96.4%</span>
              <span className="text-xs text-text-muted block mt-0.5">Bloom Accuracy</span>
            </div>
          </div>
        </div>

        {/* Core Workspace Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Assessment Generator */}
          <Card className="border border-border bg-surface hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div>
                <div className="w-10 h-10 rounded-btn bg-teal/10 text-teal flex items-center justify-center mb-3">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">
                  AI Assessment Generator
                </h2>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Synthesize structured multiple choice, scenario, and code evaluation items directly from MoSPI curriculum documents.
                </p>
              </div>
              <div className="pt-4 border-t border-border-light">
                <Link href="/trainer/assessment-generator">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Launch Generator
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Assessments Management */}
          <Card className="border border-border bg-surface hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div>
                <div className="w-10 h-10 rounded-btn bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">
                  Assessments
                </h2>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Review published evaluations, monitor official completion rates, and verify proficiency benchmark distributions.
                </p>
              </div>
              <div className="pt-4 border-t border-border-light">
                <Link href="/trainer/assessments">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full font-medium"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    View Assessments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Question Bank */}
          <Card className="border border-border bg-surface hover:shadow-md transition-all flex flex-col justify-between">
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div>
                <div className="w-10 h-10 rounded-btn bg-ai-light text-ai-purple flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">
                  Question Bank
                </h2>
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  Explore and edit the repository of verified questions tagged by competency, domain, difficulty, and Bloom taxonomy level.
                </p>
              </div>
              <div className="pt-4 border-t border-border-light">
                <Link href="/trainer/question-bank">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full font-medium"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Question Bank
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
