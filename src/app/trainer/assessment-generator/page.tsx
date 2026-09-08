'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  FileUpload,
  UploadedFileInfo,
  AssessmentConfig,
  GeneratorConfigState,
  GenerationProgress,
  GENERATION_STEPS,
  GeneratedQuestionCard,
  QuestionEditorModal,
  PublishAssessmentModal,
} from '@/components/trainer';
import {
  mockAiGeneratedQuestionsPool,
  QuizQuestionItem,
} from '@/data/questions';
import {
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  BookOpen,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Database,
  Award,
} from 'lucide-react';

const INITIAL_CONFIG: GeneratorConfigState = {
  questionsCount: 10,
  difficulty: 'Mixed',
  questionType: 'MCQ',
  language: 'English',
  competency: 'Python',
};

export default function TrainerAssessmentGeneratorPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>({
    name: 'MoSPI_National_Accounts_Python_Analytics_Manual_2026.pdf',
    sizeFormatted: '4.82 MB',
    type: 'PDF Document',
  });

  const [config, setConfig] = useState<GeneratorConfigState>(INITIAL_CONFIG);

  // Generation status: 'idle' | 'generating' | 'generated' | 'published'
  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'generated' | 'published'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Generated questions list in local state
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(mockAiGeneratedQuestionsPool);

  // Modals & Toasts
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionItem | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated AI Generation Step Progression
  useEffect(() => {
    if (generationState !== 'generating') return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < GENERATION_STEPS.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setGenerationState('generated');
        setToastMessage('Assessment generated successfully! Ready for faculty review.');
        setTimeout(() => setToastMessage(null), 4000);
      }
    }, 650);

    return () => clearInterval(interval);
  }, [generationState]);

  const handleStartGeneration = () => {
    if (!uploadedFile) {
      setToastMessage('Please upload or select a curriculum document first.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setCurrentStepIndex(0);
    setGenerationState('generating');
  };

  // Question editing
  const handleSaveEditedQuestion = (updated: QuizQuestionItem) => {
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setToastMessage(`Question #${updated.questionNumber} updated.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Question regeneration
  const handleRegenerateQuestion = (questionId: string) => {
    // Find candidate from mock questions
    const alternatives = [
      'What is the mathematical condition for an estimator to be consistent as sample size approaches infinity?',
      'Which Pandas aggregation function computes weighted percentiles on grouped survey rounds?',
      'How does the Fay-Herriot model incorporate administrative auxiliary registers in Small Area Estimation?',
    ];
    const chosen = alternatives[Math.floor(Math.random() * alternatives.length)];

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            questionText: chosen,
            explanation: 'Regenerated question matching official competency syllabus criteria.',
          };
        }
        return q;
      })
    );

    setToastMessage('Question regenerated with new candidate item.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Question deletion
  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => {
      const remaining = prev.filter((q) => q.id !== questionId);
      // Re-number
      return remaining.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    });
    setToastMessage('Question removed from assessment blueprint.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Publish handler
  const handleConfirmPublish = async () => {
    try {
      const { aiAssessmentService } = await import('@/services/ai-assessment.service');
      await aiAssessmentService.createAssessment({
        material_id: 'default-mat',
        title: `${config.competency} Diagnostic Assessment`,
        description: `Automated assessment synthesized for ${config.competency} competency evaluation.`,
        duration_minutes: 20,
        difficulty: config.difficulty.toUpperCase(),
      });
    } catch (err) {
      console.warn('Backend publish fallback:', err);
    }
    setIsPublishModalOpen(false);
    setGenerationState('published');
    setToastMessage('Assessment successfully published to Learner Hub.');
    setTimeout(() => setToastMessage(null), 4500);
  };

  return (
    <AppShell
      title="AI Assessment Generator"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Trainer' },
        { label: 'Assessment Generator' },
      ]}
      defaultRole="trainer"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="ai" size="sm" className="gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Assisted Blueprint Studio
              </Badge>
              <Badge variant="teal" size="sm">
                NSSTA Faculty Portal
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              AI Assessment Generator
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Generate competency-focused assessments from approved learning materials and official MoSPI manuals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/trainer/assessments">
              <Button variant="secondary" size="sm" className="text-xs font-semibold">
                Manage Assessments
              </Button>
            </Link>
            <Link href="/trainer/question-bank">
              <Button variant="secondary" size="sm" className="text-xs font-semibold gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                Question Bank
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Notice if Published */}
        {generationState === 'published' && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Assessment Published &amp; Live for Learners
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  This test is now discoverable in the Learner Assessments Directory under {config.competency}.
                </p>
              </div>
            </div>

            <Link href="/learner/assessments">
              <Button variant="primary" size="sm" className="text-xs font-semibold whitespace-nowrap">
                View in Learner Hub
              </Button>
            </Link>
          </div>
        )}

        {/* Two-Column Setup: Left Column (Upload + Config) & Right Column (Summary & Action) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: 1. Upload Area & 2. Assessment Configuration (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Upload Area */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <FileUpload
                file={uploadedFile}
                onFileSelect={(f) => setUploadedFile(f)}
                onFileRemove={() => setUploadedFile(null)}
              />
            </div>

            {/* 2. Assessment Configuration */}
            <AssessmentConfig
              config={config}
              onChange={setConfig}
              disabled={generationState === 'generating'}
            />
          </div>

          {/* Right: 6. Assessment Summary Panel & Primary CTA (1 col) */}
          <div className="space-y-6">
            <Card className="p-6 border-border bg-surface space-y-5">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Assessment Summary
                </h3>
                <Badge variant="teal" size="sm" className="font-mono font-bold">
                  Quality Score: 94%
                </Badge>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Questions Configured</span>
                  <span className="font-bold font-mono text-text-primary">
                    {config.questionsCount}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Difficulty Level</span>
                  <span className="font-semibold text-text-primary">{config.difficulty}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Competency Domain</span>
                  <span className="font-semibold text-primary">{config.competency}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Language</span>
                  <span className="font-semibold text-text-primary">{config.language}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-text-secondary">Estimated Duration</span>
                  <span className="font-semibold text-text-primary">20 Minutes</span>
                </div>
              </div>

              {/* Responsible AI Advisory */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-amber-900 dark:text-amber-200 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Responsible AI Notice</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  AI-generated questions should be reviewed by faculty before publishing to verify alignment with MoSPI official curricula.
                </p>
              </div>

              {/* 3. Primary CTA: Generate Assessment Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGeneration}
                disabled={generationState === 'generating'}
                isLoading={generationState === 'generating'}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full justify-center text-sm font-semibold shadow-md shadow-primary/20"
              >
                {generationState === 'generating'
                  ? 'Synthesizing Questions...'
                  : 'Generate Assessment'}
              </Button>
            </Card>
          </div>
        </div>

        {/* 3. Progressive Loading Simulation */}
        {generationState === 'generating' && (
          <GenerationProgress
            currentStepIndex={currentStepIndex}
            isComplete={false}
          />
        )}

        {/* 4 & 5. Generated Questions Section & 7. Publish Button */}
        {(generationState === 'generated' || generationState === 'published') && (
          <div className="space-y-6 pt-4 border-t border-border-light">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" size="sm" withDot className="font-semibold">
                    Assessment Generated Successfully
                  </Badge>
                  <span className="text-xs font-mono text-text-muted">
                    {questions.length} Items Calibrated
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text-primary">
                  Review &amp; Calibrate Generated Questions
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Inspect question items, adjust options, or regenerate alternatives before publishing for learners.
                </p>
              </div>

              {/* 7. Publish Assessment Button */}
              <Button
                variant="teal"
                size="md"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={generationState === 'published'}
                rightIcon={<Send className="w-4 h-4" />}
                className="text-xs font-semibold shadow-sm shrink-0"
              >
                {generationState === 'published' ? 'Published' : 'Publish Assessment'}
              </Button>
            </div>

            {/* Generated Questions List */}
            <div className="space-y-4">
              {questions.map((question, idx) => (
                <GeneratedQuestionCard
                  key={question.id}
                  question={question}
                  index={idx}
                  onEdit={(q) => setEditingQuestion(q)}
                  onRegenerate={handleRegenerateQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>

            {/* Bottom Publish Bar */}
            <div className="flex items-center justify-between p-5 bg-surface border border-border rounded-2xl shadow-sm">
              <div className="text-xs text-text-secondary">
                Ready to deploy this <strong>{questions.length}-question</strong> assessment for cadre verification?
              </div>

              <Button
                variant="teal"
                size="md"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={generationState === 'published'}
                rightIcon={<Send className="w-4 h-4" />}
                className="text-xs font-semibold shadow-sm"
              >
                {generationState === 'published' ? 'Assessment Published' : 'Publish Assessment'}
              </Button>
            </div>
          </div>
        )}

        {/* 5. Question Editor Modal */}
        <QuestionEditorModal
          question={editingQuestion}
          isOpen={editingQuestion !== null}
          onClose={() => setEditingQuestion(null)}
          onSave={handleSaveEditedQuestion}
        />

        {/* 7. Publish Assessment Confirmation Modal */}
        <PublishAssessmentModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onConfirm={handleConfirmPublish}
          assessmentTitle={`${config.competency} Diagnostic Assessment`}
          questionsCount={questions.length}
        />
      </div>
    </AppShell>
  );
}
