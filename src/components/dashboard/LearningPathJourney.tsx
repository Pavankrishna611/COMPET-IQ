'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import dynamic from 'next/dynamic';
import type { DepthCarouselItem } from '@/components/ui/DepthCarousel';

const DepthCarousel = dynamic(
  () => import('@/components/ui/DepthCarousel').then((m) => m.DepthCarousel),
  { ssr: false }
);
import { learnerLearningPathSteps, LearningJourneyStep } from '@/data/dashboard';
import {
  CheckCircle2,
  PlayCircle,
  Sparkles,
  CircleDashed,
  ArrowRight,
  Clock,
  BookOpen,
  Route,
  Layers,
  ListOrdered,
  ExternalLink,
} from 'lucide-react';

const STEP_IMAGES = [
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop', // Code / Python
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop', // Charts / Sampling
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop', // Analytics / National Accounts
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=800&auto=format&fit=crop', // Data Quality
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop', // AI / Machine Learning
  'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop', // Hardware / Computing
];

export function LearningPathJourney({ steps }: { steps?: LearningJourneyStep[] }) {
  const [viewMode, setViewMode] = useState<'depth' | 'timeline'>('depth');
  const displaySteps = steps && steps.length > 0 ? steps : learnerLearningPathSteps;

  const getStatusBadge = (status: LearningJourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" size="sm" withDot>
            Completed
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="info" size="sm" withDot>
            In Progress
          </Badge>
        );
      case 'recommended':
        return (
          <Badge variant="ai" size="sm" withDot>
            Recommended
          </Badge>
        );
      case 'upcoming':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Upcoming
          </Badge>
        );
    }
  };

  const getStepIcon = (status: LearningJourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-white animate-pulse" />;
      case 'recommended':
        return <Sparkles className="w-4 h-4 text-ai-purple" />;
      case 'upcoming':
      default:
        return <CircleDashed className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStepCircleClass = (status: LearningJourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-white border-success';
      case 'in_progress':
        return 'bg-primary text-white border-primary shadow-sm shadow-primary/30 ring-4 ring-primary/10';
      case 'recommended':
        return 'bg-ai-light text-ai-purple border-ai-purple/40';
      case 'upcoming':
      default:
        return 'bg-[#F5F8FC] text-text-muted border-border';
    }
  };

  const carouselItems: DepthCarouselItem[] = displaySteps.map((step, idx) => ({
    image: STEP_IMAGES[idx % STEP_IMAGES.length],
    alt: step.title,
    step,
  }));

  return (
    <Card className="p-5 lg:p-6 border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-light">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Your AI-Powered Learning Path
              </h2>
              <span className="text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                3D Interactive Journey
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Personalized sequencing targeting critical MoSPI competency gaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F0F4F8] p-0.5 rounded-btn border border-border">
            <button
              type="button"
              onClick={() => setViewMode('depth')}
              title="3D Depth View"
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'depth'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Depth</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              title="Timeline Sequence View"
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          <Link href="/learner/learning-path">
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Path
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-4">
        {steps !== undefined && steps.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center">
              <Route className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-text-primary">No Active Learning Path Yet</h3>
              <p className="text-xs text-text-secondary mt-1">
                Generate a personalized learning journey based on your cadre and current skill requirements.
              </p>
            </div>
            <Link href="/learner/learning-path">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Generate Learning Path
              </Button>
            </Link>
          </div>
        ) : viewMode === 'depth' ? (
          /* =========================================================================
              3D DEPTH CAROUSEL VIEW
             ========================================================================= */
          <div className="w-full relative py-2">
            <div className="w-full h-[450px] relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#0e2238] via-[#102d4c] to-[#0a192f] rounded-2xl border border-[#1b3d63] shadow-inner">
              <DepthCarousel
                items={carouselItems}
                depth={210}
                spread={90}
                tilt={20}
                tiltDirection="right"
                perspective={1400}
                visibleCards={4}
                falloff={0.22}
                blur={5}
                cardWidth={310}
                cardHeight={370}
                radius={16}
                tint="#071322"
                autoplay={false}
                loop={true}
                showControls={true}
                showIndicators={true}
                renderCard={(item) => {
                  const step: LearningJourneyStep = item.step;
                  return (
                    <div className="flex flex-col justify-between h-full w-full">
                      {/* Top Header inside card */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-mono font-bold text-teal bg-teal/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-teal/30">
                            STEP {step.stepNumber} OF {displaySteps.length}
                          </span>
                          {getStatusBadge(step.status)}
                        </div>

                        <span className="text-[11px] text-white/70 uppercase tracking-wider font-semibold block mt-1">
                          {step.provider}
                        </span>

                        <h3 className="text-sm sm:text-base font-bold text-white mt-1 line-clamp-2 leading-snug drop-shadow-sm">
                          {step.title}
                        </h3>
                      </div>

                      {/* Bottom Footer inside card */}
                      <div className="pt-3 border-t border-white/15 backdrop-blur-sm bg-black/20 -mx-5 -mb-5 p-4 rounded-b-2xl">
                        {step.status === 'in_progress' && typeof step.progress === 'number' && (
                          <div className="mb-2.5">
                            <div className="flex justify-between text-[11px] font-semibold text-teal mb-1">
                              <span>Course Progress</span>
                              <span>{step.progress}%</span>
                            </div>
                            <ProgressBar value={step.progress} variant="teal" size="sm" />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-white/80 mb-3">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-teal" />
                            {step.duration}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium text-white/90 truncate max-w-[130px]" title={step.skill}>
                            <BookOpen className="w-3.5 h-3.5 text-teal" />
                            {step.skill}
                          </span>
                        </div>

                        <Link href="/learner/learning-path" className="block w-full">
                          <button
                            type="button"
                            className="w-full py-2 px-3 rounded-lg bg-teal text-white font-semibold text-xs hover:bg-teal-dark transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                          >
                            <span>
                              {step.status === 'completed'
                                ? 'Review Module'
                                : step.status === 'in_progress'
                                  ? 'Continue Learning'
                                  : 'Start Module'}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        ) : (
          /* =========================================================================
              TRADITIONAL TIMELINE SEQUENCE VIEW
             ========================================================================= */
          <>
            {/* Desktop Horizontal View (lg+) */}
            <div className="hidden lg:grid grid-cols-5 gap-3 relative pt-3">
              {/* Connector Line behind steps */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-border -z-0" />

              {displaySteps.map((step) => (
                <div key={step.stepNumber} className="relative z-10 flex flex-col items-center text-center">
                  {/* Step indicator node */}
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-transform hover:scale-105 ${getStepCircleClass(
                      step.status
                    )}`}
                  >
                    {getStepIcon(step.status)}
                  </div>

                  {/* Step Card Content */}
                  <div className="w-full bg-[#F8FAFC] border border-border-light rounded-btn p-3.5 flex flex-col justify-between min-h-[190px] transition-all duration-200 hover:border-primary/30 hover:shadow-card-hover text-left">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase font-mono">
                          Step {step.stepNumber}
                        </span>
                        {getStatusBadge(step.status)}
                      </div>

                      <h4 className="text-xs font-bold text-text-primary mb-1 line-clamp-2 leading-snug">
                        {step.title}
                      </h4>

                      <span className="text-[11px] text-text-secondary block mb-2 font-medium">
                        {step.provider}
                      </span>
                    </div>

                    <div>
                      {step.status === 'in_progress' && typeof step.progress === 'number' && (
                        <div className="mb-2.5">
                          <div className="flex justify-between text-[10px] font-semibold text-primary mb-1">
                            <span>Progress</span>
                            <span>{step.progress}%</span>
                          </div>
                          <ProgressBar value={step.progress} variant="blue" size="sm" />
                        </div>
                      )}

                      <div className="pt-2 border-t border-border-light/70 flex items-center justify-between text-[10px] text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.duration}
                        </span>
                        <span className="truncate max-w-[80px] font-medium text-text-secondary" title={step.skill}>
                          {step.skill}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile & Tablet Vertical View (< lg) */}
            <div className="lg:hidden relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border pt-2">
              {displaySteps.map((step) => (
                <div key={step.stepNumber} className="relative">
                  {/* Timeline Node */}
                  <div
                    className={`absolute -left-6 top-3 w-6 h-6 rounded-full border-2 flex items-center justify-center -translate-x-1/2 ${getStepCircleClass(
                      step.status
                    )}`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : step.status === 'in_progress' ? (
                      <PlayCircle className="w-3 h-3 text-white" />
                    ) : step.status === 'recommended' ? (
                      <Sparkles className="w-3 h-3 text-ai-purple" />
                    ) : (
                      <span className="text-[9px] font-bold text-text-muted">{step.stepNumber}</span>
                    )}
                  </div>

                  {/* Step Card */}
                  <div className="bg-[#F8FAFC] border border-border-light rounded-btn p-4 transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-text-muted uppercase">
                        Step {step.stepNumber} • {step.provider}
                      </span>
                      {getStatusBadge(step.status)}
                    </div>

                    <h4 className="text-sm font-bold text-text-primary mb-1">
                      {step.title}
                    </h4>

                    {step.status === 'in_progress' && typeof step.progress === 'number' && (
                      <div className="my-2 max-w-xs">
                        <div className="flex justify-between text-xs font-semibold text-primary mb-1">
                          <span>In Progress</span>
                          <span>{step.progress}%</span>
                        </div>
                        <ProgressBar value={step.progress} variant="blue" size="sm" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {step.duration}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-text-secondary">
                        <BookOpen className="w-3.5 h-3.5 text-teal" />
                        {step.skill}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
