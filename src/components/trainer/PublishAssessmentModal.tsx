'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Send, CheckCircle2 } from 'lucide-react';

interface PublishAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assessmentTitle: string;
  questionsCount: number;
}

export function PublishAssessmentModal({
  isOpen,
  onClose,
  onConfirm,
  assessmentTitle,
  questionsCount,
}: PublishAssessmentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Publish Assessment"
      description="Deploy assessment into official MoSPI Capacity Building learner catalogue."
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="teal"
            size="sm"
            onClick={onConfirm}
            rightIcon={<Send className="w-3.5 h-3.5" />}
            className="font-semibold shadow-sm"
          >
            Publish Assessment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-text-secondary">
        <p className="text-sm font-medium text-text-primary">
          Are you ready to publish this assessment for learners?
        </p>

        <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-1.5">
          <div className="flex justify-between">
            <span className="text-text-muted">Target Assessment:</span>
            <span className="font-bold text-text-primary">{assessmentTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Questions Calibrated:</span>
            <span className="font-bold font-mono text-text-primary">{questionsCount} Items</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Target Cadres:</span>
            <span className="font-semibold text-text-primary">ISS &amp; SSS Officers</span>
          </div>
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed">
          Once published, the assessment will be immediately available in the Learner Assessments Hub and mapped to corresponding competency diagnostic pathways.
        </p>
      </div>
    </Modal>
  );
}
