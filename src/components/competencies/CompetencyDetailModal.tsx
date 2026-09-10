'use client';

import React from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DetailedCompetency } from '@/data/competencies';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Activity,
  Layers,
} from 'lucide-react';

export interface CompetencyDetailModalProps {
  competency: DetailedCompetency | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompetencyDetailModal({
  competency,
  isOpen,
  onClose,
}: CompetencyDetailModalProps) {
  if (!competency) return null;

  const isGap = competency.gap > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={competency.name}
      description={`Domain: ${competency.domain} • Cadre Code: ${competency.code}`}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Inspection
          </Button>

          <Link href="/learner/learning-path" onClick={onClose}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View Learning Path
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-5 text-text-primary">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-[#F5F8FC] border border-border-light rounded-btn text-center">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
              Current Level
            </span>
            <span className="text-xl font-bold text-text-primary font-mono">
              {competency.currentLevel.toFixed(1)} / 5
            </span>
            <span className="text-[10px] text-teal font-medium block mt-0.5">
              Assessed
            </span>
          </div>

          <div className="p-3.5 bg-[#F5F8FC] border border-border-light rounded-btn text-center">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
              Role Requirement
            </span>
            <span className="text-xl font-bold text-primary font-mono">
              {competency.requiredLevel.toFixed(1)} / 5
            </span>
            <span className="text-[10px] text-text-muted block mt-0.5">
              Role Standard
            </span>
          </div>

          <div className="p-3.5 bg-[#F5F8FC] border border-border-light rounded-btn text-center">
            <span className="text-[10px] text-text-secondary uppercase font-semibold block mb-1">
              Skill Gap
            </span>
            <span
              className={`text-xl font-bold font-mono ${competency.gap > 1.0
                ? 'text-critical'
                : competency.gap > 0
                  ? 'text-warning'
                  : 'text-success'
                }`}
            >
              {competency.gap > 0 ? `-${competency.gap.toFixed(1)}` : '0.0'}
            </span>
            <span className="text-[10px] font-medium block mt-0.5 text-text-secondary">
              {competency.gap > 0 ? 'Deficit' : 'Benchmark Met'}
            </span>
          </div>
        </div>

        {/* Evidence Grid */}
        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-primary" />
            Verified Profile Evidence
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-surface border border-border rounded-btn text-center">
              <span className="text-xs font-bold text-text-primary block font-mono">
                {competency.evidence.assessmentScore}%
              </span>
              <span className="text-[10px] text-text-muted">Assessment Score</span>
            </div>
            <div className="p-2.5 bg-surface border border-border rounded-btn text-center">
              <span className="text-xs font-bold text-text-primary block font-mono">
                {competency.evidence.completedCourses}
              </span>
              <span className="text-[10px] text-text-muted">Completed Courses</span>
            </div>
            <div className="p-2.5 bg-surface border border-border rounded-btn text-center">
              <span className="text-xs font-bold text-text-primary block font-mono">
                {competency.evidence.practiceActivities}
              </span>
              <span className="text-[10px] text-text-muted">Practice Activities</span>
            </div>
            <div className="p-2.5 bg-surface border border-border rounded-btn text-center">
              <span className="text-xs font-bold text-text-primary block font-mono">
                {competency.evidence.recentLearningHours}h
              </span>
              <span className="text-[10px] text-text-muted">Learning Hours</span>
            </div>
          </div>
        </div>

        {/* Recent Assessment Box */}
        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-teal" />
            Recent Assessment Record
          </h4>
          <div className="p-3 bg-surface border border-border rounded-btn flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-primary block">
                {competency.recentAssessment.title}
              </span>
              <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Assessed {competency.recentAssessment.date}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-primary font-mono">
                {competency.recentAssessment.score}%
              </span>
              <span className="text-[10px] text-success block font-medium">Verified</span>
            </div>
          </div>
        </div>

        {/* Learning History */}
        <div>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            Learning Pathway History
          </h4>
          <div className="space-y-2">
            {competency.learningHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-surface border border-border-light rounded-btn flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-text-primary block">
                    {item.title}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    {item.provider} • {item.duration}
                  </span>
                </div>
                <Badge
                  variant={
                    item.status === 'Completed'
                      ? 'success'
                      : item.status === 'In Progress'
                        ? 'info'
                        : 'neutral'
                  }
                  size="sm"
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Next Action */}
        <div className="p-3.5 bg-gradient-to-r from-ai-light/50 to-teal-light/30 border border-ai-purple/20 rounded-btn">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ai-purple mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended Next Action</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            {competency.recommendedAction}
          </p>
        </div>
      </div>
    </Modal>
  );
}
