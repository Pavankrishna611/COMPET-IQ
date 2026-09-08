'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Route, 
  Sparkles, 
  RefreshCw, 
  Compass, 
  ArrowRight,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';
import {
  learningProfileSummary,
  learningPathAiInsight,
  learningPathProgressStats,
  learningPathStages,
  LearningStageItem,
} from '@/data/learningPaths';
import {
  LearningProfileSummary,
  PathInsightCard,
  LearningPathProgressCard,
  LearningJourneyTimeline,
  LearningStageModal,
  PathRecalculationModal,
} from '@/components/learning';

export default function LearnerLearningPathPage() {
  const [selectedStage, setSelectedStage] = useState<LearningStageItem | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isRecalcModalOpen, setIsRecalcModalOpen] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(learningPathAiInsight.confidence);
  const [showRecalcSuccessToast, setShowRecalcSuccessToast] = useState(false);

  const handleStageSelect = (stage: LearningStageItem) => {
    setSelectedStage(stage);
    setIsStageModalOpen(true);
  };

  const handleRecalcComplete = () => {
    setConfidenceScore(96);
    setShowRecalcSuccessToast(true);
    setTimeout(() => {
      setShowRecalcSuccessToast(false);
    }, 5000);
  };

  return (
    <AppShell
      title="Personalized Learning Path"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Learning Path' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Recalculation Success Toast */}
      {showRecalcSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Learning Path Recalibrated</p>
            <p className="text-xs text-emerald-200">
              Confidence score updated to 96% with optimized prerequisites.
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="ai" size="sm" className="gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Curated Trajectory
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Trajectory ID: LP-2026-ISS-042
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Your Personalized Learning Path
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            An AI-curated learning journey based on your competency profile, identified skill gaps, and MoSPI role requirements.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRecalcModalOpen(true)}
            className="text-xs font-semibold gap-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Recalculate Learning Path
          </Button>

          <Link href="/learner/courses">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-2">
              <Compass className="w-3.5 h-3.5" />
              Browse All Courses
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Summary Card */}
      <LearningProfileSummary />

      {/* AI Path Insight & Progress Stats Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PathInsightCard confidence={confidenceScore} />
        <LearningPathProgressCard />
      </div>

      {/* Connected 6-Stage Timeline Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Route className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              6-Stage Competency Roadmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stages are unlocked sequentially to guarantee solid prerequisites before advanced coursework.
            </p>
          </div>

          <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
            Click any milestone card to inspect syllabus &amp; competencies
          </span>
        </div>

        <LearningJourneyTimeline
          onSelectStage={handleStageSelect}
        />
      </div>

      {/* Stage Detail Modal */}
      <LearningStageModal
        stage={selectedStage}
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
      />

      {/* AI Recalculation Modal */}
      <PathRecalculationModal
        isOpen={isRecalcModalOpen}
        onClose={() => setIsRecalcModalOpen(false)}
        onComplete={handleRecalcComplete}
      />
      </div>
    </AppShell>
  );
}
