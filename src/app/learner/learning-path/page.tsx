'use client';

import React, { useState, useEffect } from 'react';
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
import { learningPathService } from '@/services';
import type { LearningPathResponse, LearningPathItem } from '@/types/api';

export default function LearnerLearningPathPage() {
  const [learningPath, setLearningPath] = useState<LearningPathResponse | null>(null);
  const [selectedStage, setSelectedStage] = useState<LearningStageItem | null>(null);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isRecalcModalOpen, setIsRecalcModalOpen] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(learningPathAiInsight.confidence);
  const [showRecalcSuccessToast, setShowRecalcSuccessToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLearningPath = async () => {
    try {
      setIsLoading(true);
      let res: LearningPathResponse;
      try {
        res = await learningPathService.getMyActiveLearningPath();
      } catch (e: any) {
        // If not found or empty, generate one
        const gen = await learningPathService.generateLearningPath(false);
        res = gen.learning_path;
      }
      setLearningPath(res);
    } catch (err) {
      console.warn('Using fallback learning path data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningPath();
  }, []);

  const handleStageSelect = (stage: LearningStageItem) => {
    setSelectedStage(stage);
    setIsStageModalOpen(true);
  };

  const handleRecalcComplete = async () => {
    try {
      const gen = await learningPathService.generateLearningPath(true);
      if (gen?.learning_path) {
        setLearningPath(gen.learning_path);
      } else {
        await fetchLearningPath();
      }
    } catch (err) {
      console.warn('Recalculation fallback used:', err);
    }
    setConfidenceScore(96);
    setShowRecalcSuccessToast(true);
    setTimeout(() => {
      setShowRecalcSuccessToast(false);
    }, 5000);
  };

  // Convert backend items to LearningStageItem if available
  const dynamicStages: LearningStageItem[] | undefined = learningPath?.items && learningPath.items.length > 0
    ? learningPath.items.map((item: LearningPathItem, index: number) => {
        let status: 'completed' | 'in_progress' | 'recommended' | 'upcoming' = 'upcoming';
        if (item.status === 'COMPLETED') status = 'completed';
        else if (item.status === 'IN_PROGRESS') status = 'in_progress';
        else if (index === 0) status = 'recommended';

        return {
          stageNumber: item.sequence_order || index + 1,
          title: item.course?.title || `Course Module ${index + 1}`,
          courseId: item.course?.id || `crs-${index + 1}`,
          provider: item.course?.provider || 'NSSTA / iGOT Karmayogi',
          status,
          progress: item.status === 'COMPLETED' ? 100 : item.status === 'IN_PROGRESS' ? 45 : 0,
          duration: `${item.estimated_duration_hours || item.course?.duration_hours || 12}h Estimated`,
          skills: [item.course?.domain || 'Statistical Methodology', 'Data Quality'],
          competencyImpact: {
            competency: item.course?.domain || 'Statistical Domain',
            from: 'Level 2.0',
            to: 'Level 4.0',
          },
          description: item.reason || 'Targeted course module designed to bridge cadre competency gaps.',
          whyRecommended: item.reason || 'Aligned with official MoSPI career progression track and mandate.',
          prerequisites: index > 0 ? [`Stage ${index}`] : ['None'],
          learningObjectives: [
            'Master core statistical concepts and industry tooling',
            'Comply with official validation standards and guidelines',
            'Implement practical workflows in official domain tasks',
          ],
        };
      })
    : undefined;

  const totalItemsCount = learningPath?.items?.length || 6;
  const completedCount = learningPath?.items?.filter((i) => i.status === 'COMPLETED').length || 0;

  const dynamicStats = learningPath
    ? {
        totalCourses: totalItemsCount,
        completedCourses: completedCount,
        inProgressCourses: learningPath.items?.filter((i) => i.status === 'IN_PROGRESS').length || 1,
        progressPercentage: Math.round((completedCount / Math.max(1, totalItemsCount)) * 100),
        currentStage: 2,
        totalStages: totalItemsCount,
      }
    : undefined;

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="ai" size="sm" className="gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Curated Trajectory
              </Badge>
              <span className="text-xs text-text-muted font-mono">
                Trajectory ID: {learningPath?.id ? `LP-${learningPath.id.slice(0, 8)}` : 'LP-2026-ISS-042'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {learningPath?.title || 'Your Personalized Learning Path'}
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              {learningPath?.description || 'An AI-curated learning journey based on your competency profile, identified skill gaps, and MoSPI role requirements.'}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsRecalcModalOpen(true)}
              className="text-xs font-semibold gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
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
          <LearningPathProgressCard stats={dynamicStats} />
        </div>

        {/* Connected 6-Stage Timeline Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Route className="w-5 h-5 text-indigo-600" />
                Competency Roadmap
              </h2>
              <p className="text-xs text-text-secondary">
                Stages are unlocked sequentially to guarantee solid prerequisites before advanced coursework.
              </p>
            </div>

            <span className="text-xs font-medium text-text-muted bg-surface-alt px-3 py-1 rounded-full self-start sm:self-auto border border-border-light">
              Click any milestone card to inspect syllabus &amp; competencies
            </span>
          </div>

          <LearningJourneyTimeline
            stages={dynamicStages}
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
