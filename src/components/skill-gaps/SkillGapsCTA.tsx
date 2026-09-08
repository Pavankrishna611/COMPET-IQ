'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowRight, BookOpen, Route, Sparkles } from 'lucide-react';

export function SkillGapsCTA() {
  return (
    <Card className="p-6 lg:p-8 bg-gradient-to-r from-navy via-navy to-[#1a4a7d] text-white border-navy shadow-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[11px] font-semibold text-teal-light backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-light" />
            <span>Targeted Professional Progression</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Ready to Close Your Skill Gaps?
          </h2>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Follow your personalized learning path to develop the competencies required for your current and future roles in India&apos;s Official Statistical System.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Link href="/learner/learning-path">
            <Button
              variant="teal"
              size="md"
              className="w-full sm:w-auto font-semibold shadow-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Personalized Learning Path
            </Button>
          </Link>

          <Link href="/learner/courses">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              Explore Recommended Courses
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
