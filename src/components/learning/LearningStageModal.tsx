'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LearningStageItem } from '@/data/learningPaths';
import {
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BookOpen,
  ListChecks,
} from 'lucide-react';

export interface LearningStageModalProps {
  stage: LearningStageItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LearningStageModal({ stage, isOpen, onClose }: LearningStageModalProps) {
  if (!stage) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stage ${stage.stageNumber}: ${stage.title}`}
      description={`Provider: ${stage.provider} • Duration: ${stage.duration}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Link href={`/learner/courses/${stage.courseId}`} onClick={onClose}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Course Details
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4 text-text-primary text-xs">
        {/* Course Overview */}
        <div>
          <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Course Overview
          </span>
          <p className="text-xs text-text-secondary leading-relaxed bg-[#F8FAFC] p-3 rounded-btn border border-border-light">
            {stage.description}
          </p>
        </div>

        {/* Why Recommended */}
        <div className="p-3 bg-gradient-to-r from-ai-light/50 to-teal-light/30 border border-ai-purple/20 rounded-btn">
          <div className="flex items-center gap-1.5 font-bold text-ai-purple mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why This Course Is Recommended</span>
          </div>
          <p className="text-text-secondary leading-relaxed">
            {stage.whyRecommended}
          </p>
        </div>

        {/* Expected Competency Improvement */}
        <div className="p-3 bg-surface border border-border-light rounded-btn flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-text-primary block">
                Expected Competency Improvement
              </span>
              <span className="text-[11px] text-text-muted">
                {stage.competencyImpact.competency}
              </span>
            </div>
          </div>
          <div className="font-mono font-bold text-sm bg-[#F5F8FC] px-3 py-1.5 rounded border border-border-light text-primary">
            {stage.competencyImpact.from} → {stage.competencyImpact.to}
          </div>
        </div>

        {/* Skills Developed */}
        <div>
          <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider block mb-1.5">
            Skills Developed
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stage.skills.map((skill) => (
              <Badge key={skill} variant="neutral" size="sm">
                #{skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Learning Objectives */}
        <div>
          <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <ListChecks className="w-3.5 h-3.5 text-primary" />
            Learning Objectives
          </span>
          <div className="space-y-1.5">
            {stage.learningObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-[#F8FAFC] p-2 rounded text-text-secondary">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                <span>{obj}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prerequisites */}
        <div>
          <span className="font-bold text-[10px] text-text-muted uppercase tracking-wider block mb-1">
            Prerequisites
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stage.prerequisites.map((req, idx) => (
              <span key={idx} className="bg-surface text-text-muted px-2 py-1 rounded border border-border-light text-[11px]">
                • {req}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
