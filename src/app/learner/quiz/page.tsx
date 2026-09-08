'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { mockQuizQuestions } from '@/data/questions';
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
} from 'lucide-react';

export default function LearnerQuizPage() {
  const router = useRouter();

  // Current question index (0-indexed: 0 to 9)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Store user answers keyed by question index (e.g. { 0: 'B', 1: 'B' })
  // Initialize with some mock answered questions to match "Answered 6 / 10" scenario
  const [answers, setAnswers] = useState<Record<number, string>>({
    0: 'B',
    1: 'B',
    3: 'C',
    4: 'B',
    6: 'B',
    7: 'B',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  const totalQuestions = mockQuizQuestions.length;
  const currentQuestion = mockQuizQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionKey,
    }));
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

  const handleSubmitQuiz = () => {
    setIsSubmitModalOpen(false);
    router.push('/learner/quiz/result');
  };

  return (
    <AppShell
      title="Interactive Assessment"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Assessments', href: '/learner/assessments' },
        { label: 'Python Fundamentals' },
      ]}
      defaultRole="learner"
    >
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
                  Competency: <strong className="text-text-primary">Python</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                Python Fundamentals Assessment
              </h1>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              {/* Timer */}
              <QuizTimer initialSeconds={1122} />

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

        {/* Main Quiz Layout: Left Question Area (2/3) & Right Context Panel (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: 2. Question Area & 3. Navigation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <QuizQuestionCard
              question={currentQuestion}
              selectedOptionKey={answers[currentIndex]}
              onSelectOption={handleSelectOption}
            />

            {/* 3. Question Navigation Controls */}
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
                    className="text-xs font-semibold shadow-md"
                  >
                    Review Answers &amp; Submit
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="text-xs font-semibold shadow-sm"
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 4. Question Navigator & 5. Quiz Context Panel */}
          <div className="space-y-6">
            {/* 5. Quiz Context Panel */}
            <Card className="p-5 border-border bg-surface space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Assessment Context
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Assessment</span>
                  <span className="font-semibold text-text-primary">Python Fundamentals</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border-light">
                  <span className="text-text-secondary">Competency Domain</span>
                  <span className="font-semibold text-text-primary">Data Analytics</span>
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

              {/* Submit Button in Sidebar */}
              <Button
                variant="teal"
                size="md"
                onClick={() => setIsSubmitModalOpen(true)}
                rightIcon={<Send className="w-4 h-4" />}
                className="w-full justify-center text-xs font-semibold shadow-sm"
              >
                Submit Assessment
              </Button>
            </Card>

            {/* 4. Question Navigator Card */}
            <Card className="p-5 border-border bg-surface">
              <QuestionNavigator
                totalQuestions={totalQuestions}
                currentIndex={currentIndex}
                answers={answers}
                onSelectQuestion={(index) => setCurrentIndex(index)}
              />
            </Card>

            {/* Assessment Help Notice */}
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

        {/* 6. Quiz Submit Confirmation Modal */}
        <QuizSubmitModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmit={handleSubmitQuiz}
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          totalQuestions={totalQuestions}
        />
      </div>
    </AppShell>
  );
}
