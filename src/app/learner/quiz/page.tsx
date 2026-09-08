'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { mockQuizQuestions, QuizQuestionItem } from '@/data/questions';
import {
  QuizTimer,
  QuestionNavigator,
  QuizQuestionCard,
  QuizSubmitModal,
} from '@/components/assessments';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  HelpCircle,
  Save,
  Send,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { quizService, assessmentService } from '@/services';
import type { QuizStartResponse } from '@/types/api';

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdParam = searchParams.get('assessment_id');

  const [questions, setQuestions] = useState<QuizQuestionItem[]>(mockQuizQuestions);
  const [quizTitle, setQuizTitle] = useState<string>('Python Fundamentals Assessment');
  const [timeLimitSec, setTimeLimitSec] = useState<number>(1200);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({
    0: 'B',
    1: 'B',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const initializeQuiz = async () => {
      if (!assessmentIdParam) return;

      try {
        setIsLoading(true);
        const startRes: QuizStartResponse = await quizService.startQuiz(assessmentIdParam);
        if (startRes && startRes.questions && startRes.questions.length > 0) {
          setAttemptId(startRes.attempt_id);
          setQuizTitle(startRes.assessment_title || 'Competency Diagnostic');
          if (startRes.duration_minutes) {
            setTimeLimitSec(startRes.duration_minutes * 60);
          }

          const mappedQuestions: QuizQuestionItem[] = startRes.questions.map((q, idx) => ({
            id: q.id,
            questionNumber: q.sequence_order || idx + 1,
            competency: 'Official Statistics',
            difficulty: 'Intermediate',
            questionText: q.question_text,
            options: [
              { key: 'A', text: q.option_a },
              { key: 'B', text: q.option_b },
              { key: 'C', text: q.option_c },
              { key: 'D', text: q.option_d },
            ],
            correctAnswer: 'A',
            explanation: 'Verified official statistical standard response.',
          }));

          setQuestions(mappedQuestions);
          setAnswers({});
          setCurrentIndex(0);
        }
      } catch (err) {
        console.warn('Could not start live quiz attempt, using demo questions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuiz();
  }, [assessmentIdParam]);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));

    // If active backend attempt, persist answer asynchronously
    if (attemptId && currentQuestion?.id) {
      quizService
        .saveAnswer(attemptId, currentQuestion.id, optionKey)
        .catch((err: any) => console.warn('Answer sync warning:', err));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSaveProgress = () => {
    setToastMessage('Assessment progress saved.');
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitModalOpen(false);
    setIsSubmitting(true);

    if (attemptId) {
      try {
        // Map answer indices to question IDs
        const answerPayload: Record<string, string> = {};
        questions.forEach((q, idx) => {
          if (answers[idx]) {
            answerPayload[q.id] = answers[idx];
          }
        });

        const result = await quizService.submitQuiz(attemptId, answerPayload);
        router.push(`/learner/quiz/result?attempt_id=${result.attempt_id}`);
        return;
      } catch (err) {
        console.warn('Error submitting quiz to backend:', err);
      }
    }

    // Default fallback
    router.push('/learner/quiz/result');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-text-secondary">Initializing Assessment Session...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <BookmarkCheck className="w-5 h-5 text-teal shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. QUIZ HEADER */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                Active Session
              </Badge>
              <span className="text-xs font-mono text-text-muted">
                Questions: <strong className="text-text-primary">{totalQuestions}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              {quizTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            {/* Timer */}
            <QuizTimer initialSeconds={timeLimitSec} />

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveProgress}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Save Progress
            </Button>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5 pt-2 border-t border-border-light">
          <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
            <span>
              Question <strong className="text-text-primary">{currentIndex + 1}</strong> of{' '}
              <strong className="text-text-primary">{totalQuestions}</strong>
            </span>
            <span className="font-mono text-text-muted">{progressPercent}% Completed</span>
          </div>
          <ProgressBar value={progressPercent} variant="blue" size="sm" />
        </div>
      </div>

      {/* Main Quiz Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Question Area & Navigation */}
        <div className="lg:col-span-2 space-y-6">
          {currentQuestion && (
            <QuizQuestionCard
              question={currentQuestion}
              selectedOptionKey={answers[currentIndex]}
              onSelectOption={handleSelectOption}
            />
          )}

          {/* Question Navigation Controls */}
          <div className="flex items-center justify-between gap-3 p-4 bg-surface border border-border rounded-2xl shadow-sm">
            <Button
              variant="secondary"
              size="md"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-xs font-semibold"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex === totalQuestions - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsSubmitModalOpen(true)}
                  rightIcon={<Send className="w-4 h-4" />}
                  disabled={isSubmitting}
                  className="text-xs font-semibold shadow-md"
                >
                  {isSubmitting ? 'Submitting...' : 'Review Answers & Submit'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="text-xs font-semibold shadow-md"
                >
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Question Navigator & Quiz Context */}
        <div className="space-y-6">
          <Card className="p-5 border-border bg-surface space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Assessment Context
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border-light">
                <span className="text-text-secondary">Assessment</span>
                <span className="font-semibold text-text-primary truncate max-w-[170px]">{quizTitle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-light">
                <span className="text-text-secondary">Total Questions</span>
                <span className="font-semibold font-mono text-text-primary">{totalQuestions}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border-light">
                <span className="text-text-secondary">Answered</span>
                <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {answeredCount} / {totalQuestions}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-text-secondary">Remaining</span>
                <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                  {unansweredCount}
                </span>
              </div>
            </div>

            <Button
              variant="teal"
              size="md"
              onClick={() => setIsSubmitModalOpen(true)}
              rightIcon={<Send className="w-4 h-4" />}
              disabled={isSubmitting}
              className="w-full justify-center text-xs font-semibold shadow-sm"
            >
              Submit Assessment
            </Button>
          </Card>

          <Card className="p-5 border-border bg-surface">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentIndex={currentIndex}
              answers={answers}
              onSelectQuestion={(index) => setCurrentIndex(index)}
            />
          </Card>

          <div className="p-4 rounded-xl bg-surface-elevated border border-border text-[11px] text-text-muted leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-text-secondary">
              <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
              <span>Exam Guidelines</span>
            </div>
            <p>
              Each question carries equal weight. You may change your responses at any point before clicking Submit Assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Submit Confirmation Modal */}
      <QuizSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitQuiz}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        totalQuestions={totalQuestions}
      />
    </div>
  );
}

export default function LearnerQuizPage() {
  return (
    <AppShell
      title="Interactive Assessment"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Assessments', href: '/learner/assessments' },
        { label: 'Assessment Session' },
      ]}
      defaultRole="learner"
    >
      <Suspense fallback={<div className="p-12 text-center text-sm text-text-muted">Loading Assessment Session...</div>}>
        <QuizContent />
      </Suspense>
    </AppShell>
  );
}
