'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Carousel, { CarouselItemData } from '@/components/ui/Carousel';
import {
  CheckSquare,
  BookOpen,
  Bot,
  AlertTriangle,
  Zap,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';

const QUICK_ACTION_ITEMS: CarouselItemData[] = [
  {
    id: 'act-assessment',
    title: 'Take Assessment',
    description: 'Test statistical competency & earn verified official cadre badges.',
    icon: <CheckSquare className="carousel-icon" />,
    tag: 'ASSESSMENT',
    href: '/learner/assessments',
    btnText: 'Launch Test',
  },
  {
    id: 'act-courses',
    title: 'Explore Courses',
    description: 'Access accredited iGOT Karmayogi & NSSTA statistical curriculum.',
    icon: <BookOpen className="carousel-icon" />,
    tag: 'CURRICULUM',
    href: '/learner/courses',
    btnText: 'Browse Catalog',
  },
  {
    id: 'act-ai',
    title: 'Ask AI Assistant',
    description: 'Query MoSPI methodologies, sampling techniques & formula scripts.',
    icon: <Bot className="carousel-icon" />,
    tag: 'AI ASSIST',
    href: '/learner/assistant',
    btnText: 'Chat with AI',
  },
  {
    id: 'act-gaps',
    title: 'View Skill Gaps',
    description: 'Analyze critical cadre deficits & personal benchmark differentials.',
    icon: <AlertTriangle className="carousel-icon" />,
    tag: 'INTELLIGENCE',
    href: '/learner/skill-gaps',
    btnText: 'Inspect Gaps',
  },
  {
    id: 'act-quiz-gen',
    title: 'AI Quiz Generator',
    description: 'Generate on-demand practice questions from uploaded study materials.',
    icon: <Sparkles className="carousel-icon" />,
    tag: 'PRACTICE',
    href: '/learner/quiz-generator',
    btnText: 'Generate Quiz',
  },
  {
    id: 'act-pathway',
    title: 'Learning Pathway',
    description: 'Track your personalized milestone progression toward cadre mastery.',
    icon: <Compass className="carousel-icon" />,
    tag: 'ROADMAP',
    href: '/learner/learning-path',
    btnText: 'View Pathway',
  },
];

export function QuickActions() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [carouselWidth, setCarouselWidth] = useState<number>(360);

  // Dynamically measure container width for seamless responsive 3D carousel fit
  useEffect(() => {
    if (!containerRef.current) return;

    const measureWidth = () => {
      if (containerRef.current) {
        const clientW = containerRef.current.clientWidth;
        // Keep carousel well-proportioned within container bounds
        const targetWidth = Math.max(280, Math.min(clientW, 520));
        setCarouselWidth(targetWidth);
      }
    };

    measureWidth();
    window.addEventListener('resize', measureWidth);
    return () => window.removeEventListener('resize', measureWidth);
  }, []);

  return (
    <Card className="p-5 border-border shadow-card h-full flex flex-col justify-between bg-surface">
      {/* Header */}
      <CardHeader className="p-0 pb-3 border-b border-border-light">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-btn bg-teal/15 text-teal border border-teal/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-teal" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-text-primary tracking-tight">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs sm:text-[13px] font-semibold text-text-secondary mt-0.5">
                Priority civil service intelligence shortcuts
              </CardDescription>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary-light text-primary border border-primary/25">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Swipe or Auto-play
          </span>
        </div>
      </CardHeader>

      {/* Main 3D Carousel Stage */}
      <CardContent className="p-0 pt-3 flex-1 flex flex-col items-center justify-center">
        <div
          ref={containerRef}
          className="w-full flex items-center justify-center relative py-1"
        >
          <Carousel
            items={QUICK_ACTION_ITEMS}
            baseWidth={carouselWidth}
            autoplay={true}
            autoplayDelay={3500}
            pauseOnHover={true}
            loop={true}
            round={false}
          />
        </div>

        {/* Quick Launch Direct Links Footer */}
        <div className="w-full mt-3 pt-3 border-t border-border-light flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider hidden sm:inline">
            Direct Jump:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Link
              href="/learner/assessments"
              className="text-[11px] font-semibold text-text-secondary hover:text-primary px-2.5 py-1 rounded-md bg-slate-100/90 hover:bg-primary-light border border-slate-200/80 transition-colors"
            >
              Assessments
            </Link>
            <Link
              href="/learner/courses"
              className="text-[11px] font-semibold text-text-secondary hover:text-teal px-2.5 py-1 rounded-md bg-slate-100/90 hover:bg-teal-light border border-slate-200/80 transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/learner/assistant"
              className="text-[11px] font-semibold text-text-secondary hover:text-ai-purple px-2.5 py-1 rounded-md bg-slate-100/90 hover:bg-ai-light border border-slate-200/80 transition-colors"
            >
              AI Assist
            </Link>
            <Link
              href="/learner/skill-gaps"
              className="text-[11px] font-semibold text-text-secondary hover:text-warning px-2.5 py-1 rounded-md bg-slate-100/90 hover:bg-amber-50 border border-slate-200/80 transition-colors"
            >
              Skill Gaps
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
