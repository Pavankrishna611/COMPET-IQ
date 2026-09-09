'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { aiAssessmentService } from '@/services/ai-assessment.service';
import type {
  LearningMaterialResponse,
  GeneratedQuestionsResponse,
  PracticeQuizResultResponse,
  PracticeQuizSubmitRequest,
  PracticeFeedbackResponse,
  WeakTopicAnalysis,
  CompetencyReference,
  CourseReference,
} from '@/types/api';
import {
  Upload,
  FileText,
  FileUp,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BrainCircuit,
  ShieldCheck,
  Clock,
  BookOpen,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ArrowRight,
  Info,
  Layers,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Trophy,
  RotateCcw,
  Send,
  Target,
  Lightbulb,
  TrendingUp,
  Award,
  GraduationCap,
  AlertTriangle,
} from 'lucide-react';

const MAX_FILE_SIZE_MB = 20;
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt'];

export default function LearnerQuizGeneratorPage() {
  // File selection state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload and processing state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMaterial, setUploadedMaterial] = useState<LearningMaterialResponse | null>(null);

  // Quiz generation configuration state (Part 10C)
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'>('MEDIUM');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<GeneratedQuestionsResponse | null>(null);

  // Practice Quiz Taking State (Part 10D)
  type QuizViewMode = 'PREVIEW' | 'TAKING' | 'RESULT';
  const [quizViewMode, setQuizViewMode] = useState<QuizViewMode>('PREVIEW');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [quizSubmitError, setQuizSubmitError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<PracticeQuizResultResponse | null>(null);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  // AI Learning Feedback & Weak-Topic Analysis State (Part 10E)
  const [feedback, setFeedback] = useState<PracticeFeedbackResponse | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [resultSubTab, setResultSubTab] = useState<'FEEDBACK' | 'REVIEW'>('FEEDBACK');

  // Learner's materials history
  const [myMaterials, setMyMaterials] = useState<LearningMaterialResponse[]>([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load existing learner materials on mount
  const fetchMyMaterials = async () => {
    try {
      setIsLoadingMaterials(true);
      const data = await aiAssessmentService.getMaterials();
      setMyMaterials(data || []);
    } catch (err: any) {
      console.error('Failed to fetch personal materials:', err);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchMyMaterials();
  }, []);

  // Memoized deduplicated questions list to prevent duplicate questions from rendering (Item 12)
  const displayQuestions = React.useMemo(() => {
    if (!generatedQuiz?.questions || !Array.isArray(generatedQuiz.questions)) {
      return [];
    }
    const seenTexts = new Set<string>();
    const seenIds = new Set<string>();
    return generatedQuiz.questions.filter((q) => {
      if (!q) return false;
      const qId = q.id?.trim();
      if (qId && seenIds.has(qId)) return false;

      // Normalize text for comparison: lowercase, remove non-alphanumeric except spaces, trim
      const normText = (q.question_text || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (normText && seenTexts.has(normText)) return false;

      if (qId) seenIds.add(qId);
      if (normText) seenTexts.add(normText);
      return true;
    });
  }, [generatedQuiz]);

  // Validate selected file
  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported format "${ext}". Please upload a PDF, DOCX, PPTX, or TXT file.`;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return `File exceeds maximum allowable size of ${MAX_FILE_SIZE_MB}MB (Selected: ${sizeMB.toFixed(1)}MB).`;
    }
    if (file.size === 0) {
      return 'Selected file is empty (0 bytes).';
    }
    return null;
  };

  const handleFileSelection = (file: File) => {
    setUploadError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    if (!customTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCustomTitle(cleanName);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setCustomTitle('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadedMaterial(null);
    setGeneratedQuiz(null);
    setGenerationError(null);

    try {
      const titleToUse = customTitle.trim() || selectedFile.name;
      const response = await aiAssessmentService.uploadMaterial(selectedFile, titleToUse);
      
      setUploadedMaterial(response);
      showToast('Learning material uploaded and text successfully extracted!');
      handleRemoveSelectedFile();
      // Refresh user's materials
      await fetchMyMaterials();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(
        err.detail?.message ||
        err.detail ||
        err.message ||
        'Failed to upload and extract material text. Please ensure the document is valid.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Delete material handler
  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await aiAssessmentService.deleteMaterial(id);
      showToast('Material deleted successfully.');
      if (uploadedMaterial?.id === id) {
        setUploadedMaterial(null);
        setGeneratedQuiz(null);
        setGenerationError(null);
      }
      setMyMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error('Failed to delete material:', err);
      showToast(err.message || 'Failed to delete material.');
    }
  };

  // Quiz generation handler (Part 10C)
  const handleGeneratePracticeQuiz = async () => {
    if (!uploadedMaterial) {
      setGenerationError('Please select an uploaded learning material first.');
      return;
    }

    if (uploadedMaterial.status !== 'PROCESSED') {
      setGenerationError('This document is not yet processed or text extraction failed.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await aiAssessmentService.generatePracticeQuiz(uploadedMaterial.id, {
        number_of_questions: questionCount,
        difficulty: difficulty,
      });
      setGeneratedQuiz(result);
      setQuizViewMode('PREVIEW');
      setSelectedAnswers({});
      setQuizResult(null);
      setQuizSubmitError(null);
      setCurrentQuestionIndex(0);
      showToast(`Synthesized ${result.questions.length} practice MCQs successfully!`);
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setGenerationError(
        err.detail?.message ||
        err.detail ||
        err.message ||
        'Failed to generate practice questions from this material. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Practice Quiz Taking Handlers (Part 10D)
  const handleStartQuiz = () => {
    if (!displayQuestions || displayQuestions.length === 0) return;
    setQuizViewMode('TAKING');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitError(null);
    setQuizStartTime(Date.now());
  };

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < displayQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleExitQuiz = () => {
    if (Object.keys(selectedAnswers).length > 0) {
      if (!window.confirm('Are you sure you want to exit the quiz? Your current answers will be discarded.')) {
        return;
      }
    }
    setQuizViewMode('PREVIEW');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitError(null);
  };

  const handleSubmitPracticeQuiz = async () => {
    if (!uploadedMaterial) {
      setQuizSubmitError('No active material selected.');
      return;
    }
    if (displayQuestions.length === 0) {
      setQuizSubmitError('No questions to submit.');
      return;
    }

    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < displayQuestions.length) {
      const unanswered = displayQuestions.length - answeredCount;
      if (
        !window.confirm(
          `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Unanswered questions will be scored as incorrect. Do you want to submit now?`
        )
      ) {
        return;
      }
    }

    setIsSubmittingQuiz(true);
    setQuizSubmitError(null);

    const timeTaken = quizStartTime ? Math.max(1, Math.round((Date.now() - quizStartTime) / 1000)) : undefined;

    try {
      const answersPayload = displayQuestions.map((q) => ({
        question_id: q.id,
        selected_option: selectedAnswers[q.id] || null,
      }));

      const result = await aiAssessmentService.submitPracticeQuiz(uploadedMaterial.id, {
        answers: answersPayload,
        time_taken_seconds: timeTaken,
      });

      setQuizResult(result);
      setQuizViewMode('RESULT');
      setResultSubTab('FEEDBACK');
      showToast(`Practice quiz evaluated: ${result.correct_answers}/${result.total_questions} (${result.percentage}%)`);
      // Auto-load AI Learning Feedback (Part 10E)
      handleLoadFeedback(result.attempt_id);
    } catch (err: any) {
      console.error('Quiz submission failed:', err);
      setQuizSubmitError(
        err.detail?.message ||
        err.detail ||
        err.message ||
        'Failed to submit practice quiz. Please check your network and try again.'
      );
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Load or synthesize AI feedback for a completed practice attempt (Part 10E)
  const handleLoadFeedback = async (attemptId: string, forceRegenerate: boolean = false) => {
    setIsLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const fb = await aiAssessmentService.getPracticeQuizFeedback(attemptId, forceRegenerate);
      setFeedback(fb);
    } catch (err: any) {
      console.error('Failed to load AI feedback:', err);
      setFeedbackError(
        err.detail?.message ||
        err.detail ||
        err.message ||
        'Failed to synthesize AI learning feedback. Please try again.'
      );
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizViewMode('TAKING');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitError(null);
    setFeedback(null);
    setFeedbackError(null);
    setQuizStartTime(Date.now());
  };

  // Copy material ID to clipboard
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-text-primary text-surface px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Learner / Practice Center
              </span>
              <span className="text-text-muted">•</span>
              <Badge variant="ai" size="sm" className="gap-1 font-bold">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              AI Quiz Generator
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Upload course manuals, statistical notes, or official training materials in PDF format. 
              Our AI analyzes the content and extracts core concepts to generate personalized practice quizzes.
            </p>
          </div>

          {/* Formative Notice Badge */}
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs text-secondary shadow-xs">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div>
              <span className="font-semibold text-text-primary block">Formative Practice</span>
              <span className="text-[11px] text-text-muted">Does not alter official competency scores</span>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Column (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-6 bg-surface border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-text-primary">
                      Upload Learning Material
                    </h2>
                    <p className="text-xs text-text-muted">
                      PDF is the primary supported document format (max {MAX_FILE_SIZE_MB}MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleInputChange}
                className="hidden"
                id="learner-file-upload-input"
              />

              {/* Drag & Drop Area */}
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer select-none ${
                    isDragOver
                      ? 'border-primary bg-primary-light/30 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40 bg-surface-elevated/40 hover:bg-surface-elevated/80'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <FileUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mb-1">
                    Drag and drop your document here, or click to browse
                  </h3>
                  <p className="text-xs text-text-muted mb-4">
                    Supports <span className="font-semibold text-text-secondary">PDF (recommended)</span>, DOCX, PPTX, TXT up to {MAX_FILE_SIZE_MB}MB
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold pointer-events-none"
                  >
                    Select PDF / Document
                  </Button>
                </div>
              ) : (
                /* Selected File Card */
                <div className="border border-border rounded-2xl p-4 bg-surface-elevated/40 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-text-primary truncate">
                          {selectedFile.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          <span>•</span>
                          <span className="uppercase font-semibold text-primary">
                            {selectedFile.name.split('.').pop()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      disabled={isUploading}
                      className="p-1.5 rounded-lg border border-border text-text-muted hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors shrink-0 disabled:opacity-50"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Optional Custom Title Input */}
                  <div>
                    <label
                      htmlFor="custom-material-title"
                      className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider"
                    >
                      Document Title (Optional)
                    </label>
                    <input
                      id="custom-material-title"
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., National Accounts Statistics Chapter 4"
                      disabled={isUploading}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-border bg-surface text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Upload Action Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveSelectedFile}
                      disabled={isUploading}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="gap-2 text-xs font-semibold min-w-[150px]"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting Text...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload & Extract Text</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block mb-0.5">Upload Failed</span>
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-rose-500 hover:text-rose-800 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Loading State Animation */}
              {isUploading && (
                <div className="mt-4 p-4 rounded-xl bg-primary-light/40 border border-primary/20 animate-pulse">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">
                        Processing PDF & Extracting Text...
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Clean text extraction in progress via PyPDF. Large documents may take several seconds.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Success State Card (When Material Just Uploaded) */}
            {uploadedMaterial && (
              <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-surface to-surface border-emerald-500/30 shadow-card animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-text-primary">
                          Material Ready for Quiz Generation
                        </h3>
                        <Badge variant="success" size="sm" withDot>
                          PROCESSED
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Uploaded by your account • Associated with your personal practice profile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs">
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">Document Title</span>
                    <span className="font-bold text-text-primary truncate block mt-0.5">
                      {uploadedMaterial.title}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">Format & Size</span>
                    <span className="font-bold text-text-primary block mt-0.5">
                      {uploadedMaterial.file_type.toUpperCase()} • {(uploadedMaterial.file_size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">Extracted Content</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {uploadedMaterial.word_count ? `${uploadedMaterial.word_count.toLocaleString()} Words` : 'Text Extracted'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-border">
                    <span className="text-[11px] text-text-muted block">Status</span>
                    <span className="font-bold text-text-primary block mt-0.5">
                      Ready for AI
                    </span>
                  </div>
                </div>

                {/* Material / Document ID Badge & Part 10C Forward Hook */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-0.5">
                      Document Staging ID (For Part 10C Question Synthesis)
                    </span>
                    <code className="text-xs font-mono text-primary font-bold break-all">
                      {uploadedMaterial.id}
                    </code>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopyId(uploadedMaterial.id)}
                    className="text-xs gap-1.5 shrink-0 self-start sm:self-center"
                  >
                    {copiedId === uploadedMaterial.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied ID</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Material ID</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Quiz Configuration & Generation Controls (Part 10C) */}
                <div className="mt-5 pt-5 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-ai-purple" />
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        Configure AI Practice Quiz
                      </h4>
                    </div>
                    <Badge variant="ai" size="sm">
                      Part 10C Practice
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Question Count Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                        Question Count
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([5, 10, 15] as const).map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setQuestionCount(cnt)}
                            disabled={isGenerating}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                              questionCount === cnt
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-surface border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
                            } disabled:opacity-50`}
                          >
                            <span>{cnt}</span>
                            <span className="text-[10px] font-normal opacity-80">MCQs</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Level Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['EASY', 'MEDIUM', 'HARD', 'MIXED'] as const).map((diff) => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => setDifficulty(diff)}
                            disabled={isGenerating}
                            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center border ${
                              difficulty === diff
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-surface border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
                            } disabled:opacity-50`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generation Action Row */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Questions synthesized strictly from extracted document text.</span>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleGeneratePracticeQuiz}
                      disabled={isGenerating || uploadedMaterial.status !== 'PROCESSED'}
                      className="gap-2 text-xs font-bold shrink-0 shadow-xs"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Synthesizing MCQs...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-4 h-4" />
                          <span>Generate {questionCount} Practice MCQs</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Generation Error Banner */}
                  {generationError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold block mb-0.5">Quiz Generation Error</span>
                        <span>{generationError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGenerationError(null)}
                        className="text-rose-500 hover:text-rose-800 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Active Generation Loading State */}
                  {isGenerating && (
                    <div className="p-4 rounded-xl bg-ai-light/40 border border-ai-purple/30 animate-pulse space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ai-purple/10 text-ai-purple flex items-center justify-center shrink-0">
                          <BrainCircuit className="w-4 h-4 animate-spin" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-text-primary">
                            AI Psychometric Generator Active
                          </h5>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Formulating {questionCount} validated MCQs strictly derived from "{uploadedMaterial.title}"...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Prompt to Select Material If Materials Exist but None Selected */}
            {!uploadedMaterial && myMaterials.length > 0 && (
              <Card className="p-5 bg-surface border-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Ready to Generate a Practice Quiz
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      You have {myMaterials.length} uploaded practice document{myMaterials.length > 1 ? 's' : ''}. Select one below to configure questions.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const firstProcessed = myMaterials.find((m) => m.status === 'PROCESSED') || myMaterials[0];
                    if (firstProcessed) setUploadedMaterial(firstProcessed);
                  }}
                  className="text-xs shrink-0 self-start sm:self-center"
                >
                  Select Active Document
                </Button>
              </Card>
            )}

            {/* Empty State: No Uploaded Material at All (Item 11) */}
            {!uploadedMaterial && myMaterials.length === 0 && !isLoadingMaterials && (
              <Card className="p-6 bg-surface border border-dashed border-border text-center space-y-3 shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-primary-light/50 text-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    No Learning Material Available for Practice
                  </h3>
                  <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                    Upload your first course document, study notes, or official MoSPI guidelines using the upload box above. Once processed, you can synthesize 5, 10, or 15 practice MCQs.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs gap-1.5 font-semibold mx-auto"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select Document to Upload</span>
                </Button>
              </Card>
            )}

            {/* Generated Practice MCQs Display Section */}
            {generatedQuiz && displayQuestions.length > 0 && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-3 duration-300">
                {/* ---------------------------------------------------- */}
                {/* MODE 1: PREVIEW MODE (Default after generation)       */}
                {/* ---------------------------------------------------- */}
                {quizViewMode === 'PREVIEW' && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-card">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="ai" size="sm" className="gap-1 font-bold">
                            <Sparkles className="w-3 h-3" />
                            Generated MCQs
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            Mode: {generatedQuiz.generation_mode}
                          </Badge>
                          <span className="text-[11px] text-text-muted font-medium">
                            {displayQuestions.length} Questions Generated
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-text-primary">
                          Practice Questions: {uploadedMaterial?.title}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          Review the generated questions below or start an interactive self-assessment quiz.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleGeneratePracticeQuiz}
                          disabled={isGenerating}
                          className="gap-1.5 text-xs font-semibold"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                          <span>Regenerate</span>
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleStartQuiz}
                          disabled={isGenerating}
                          className="gap-1.5 text-xs font-bold shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Start Practice Quiz</span>
                        </Button>
                      </div>
                    </div>

                    {/* Regenerating State Indicator */}
                    {isGenerating && (
                      <div className="p-4 rounded-xl bg-primary-light/40 border border-primary/20 animate-pulse flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                        <div>
                          <h4 className="text-xs font-bold text-text-primary">Synthesizing Fresh MCQs...</h4>
                          <p className="text-[11px] text-text-muted">Updating questions with latest parameters</p>
                        </div>
                      </div>
                    )}

                    {/* Question Cards Preview List */}
                    <div className="space-y-4">
                      {displayQuestions.map((q, qIndex) => {
                        const optionsList = [
                          { key: 'A', text: q.option_a || (q.options && q.options[0]) || '' },
                          { key: 'B', text: q.option_b || (q.options && q.options[1]) || '' },
                          { key: 'C', text: q.option_c || (q.options && q.options[2]) || '' },
                          { key: 'D', text: q.option_d || (q.options && q.options[3]) || '' },
                        ];

                        const correctKey = (q.correct_option || '').trim().toUpperCase();

                        return (
                          <Card
                            key={q.id || `q-${qIndex}`}
                            className="p-5 bg-surface border-border shadow-card space-y-4 transition-all hover:border-primary/30 overflow-hidden"
                          >
                            {/* Question Metadata Header */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary-light">
                                  Question {qIndex + 1} of {displayQuestions.length}
                                </span>

                                {q.topic && (
                                  <Badge variant="neutral" size="sm" className="text-[11px] font-medium max-w-xs truncate" title={q.topic}>
                                    Topic: {q.topic}
                                  </Badge>
                                )}

                                {q.difficulty && (
                                  <Badge
                                    variant={
                                      q.difficulty === 'HARD'
                                        ? 'critical'
                                        : q.difficulty === 'EASY'
                                        ? 'success'
                                        : 'neutral'
                                    }
                                    size="sm"
                                    className="font-bold uppercase tracking-wider"
                                  >
                                    {q.difficulty}
                                  </Badge>
                                )}

                                <Badge variant="success" size="sm" withDot>
                                  {q.validation_status || 'VALID'}
                                </Badge>
                              </div>

                              {/* Clearly Identifiable Correct Answer Badge in Preview Mode */}
                              {correctKey && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Correct: Option {correctKey}</span>
                                </div>
                              )}
                            </div>

                            {/* Question Statement */}
                            <div className="break-words">
                              <p className="text-sm sm:text-base font-bold text-text-primary leading-relaxed break-words">
                                {q.question_text}
                              </p>
                            </div>

                            {/* MCQ Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {optionsList.map((opt) => {
                                const isCorrect = correctKey === opt.key;
                                return (
                                  <div
                                    key={opt.key}
                                    className={`p-3 rounded-xl border transition-all flex items-start gap-3 overflow-hidden ${
                                      isCorrect
                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/30 shadow-xs'
                                        : 'bg-surface-elevated/40 border-border text-text-primary'
                                    }`}
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-border text-text-muted'
                                      }`}
                                    >
                                      {opt.key}
                                    </div>
                                    <div className="flex-1 min-w-0 break-words">
                                      <span className="text-xs sm:text-sm block leading-snug break-words">
                                        {opt.text}
                                      </span>
                                      {isCorrect && (
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                                          <span>Correct Answer</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Educational Explanation & Context */}
                            {q.explanation && (
                              <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border space-y-1.5 text-xs break-words">
                                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>Educational Explanation & Context</span>
                                </div>
                                <p className="text-text-secondary leading-relaxed text-[11px] sm:text-xs break-words">
                                  {q.explanation}
                                </p>
                                {q.source_reference && (
                                  <p className="text-[10px] text-text-muted italic pt-1 border-t border-border break-words">
                                    {q.source_reference}
                                  </p>
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>

                    {/* Bottom Practice Actions Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-card">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">
                          Ready to test your comprehension?
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          Take this practice quiz one question at a time to test your knowledge with server-evaluated feedback.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            window.scrollTo({ top: 150, behavior: 'smooth' });
                          }}
                          className="text-xs font-semibold"
                        >
                          Adjust Settings
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleStartQuiz}
                          className="text-xs gap-1.5 font-bold shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Start Practice Quiz</span>
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODE 2: QUIZ-TAKING MODE (One question at a time)    */}
                {/* ---------------------------------------------------- */}
                {quizViewMode === 'TAKING' && (
                  <div className="space-y-4">
                    {/* Quiz Progress & Navigation Stepper Header */}
                    <Card className="p-4 bg-surface border-border shadow-card space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Badge variant="ai" size="sm" className="font-bold gap-1">
                            <BrainCircuit className="w-3.5 h-3.5" />
                            Practice Quiz
                          </Badge>
                          <span className="text-xs font-bold text-text-primary">
                            Question {currentQuestionIndex + 1} of {displayQuestions.length}
                          </span>
                          <span className="text-text-muted text-xs">•</span>
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {Object.keys(selectedAnswers).length} of {displayQuestions.length} Answered
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleExitQuiz}
                          className="text-xs text-text-muted hover:text-rose-600 gap-1 self-start sm:self-center"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Exit Quiz</span>
                        </Button>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${Math.round(
                              ((currentQuestionIndex + 1) / displayQuestions.length) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Question Navigation Stepper Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                        {displayQuestions.map((q, idx) => {
                          const isCurrent = idx === currentQuestionIndex;
                          const isAnswered = Boolean(selectedAnswers[q.id]);

                          return (
                            <button
                              key={q.id || idx}
                              type="button"
                              onClick={() => setCurrentQuestionIndex(idx)}
                              disabled={isSubmittingQuiz}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 border ${
                                isCurrent
                                  ? 'bg-primary text-white border-primary shadow-xs ring-2 ring-primary/20'
                                  : isAnswered
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'bg-surface border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
                              }`}
                              title={`Jump to Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                            >
                              {isAnswered && !isCurrent ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                idx + 1
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </Card>

                    {/* Active Question Card */}
                    {(() => {
                      const currentQ = displayQuestions[currentQuestionIndex];
                      if (!currentQ) return null;

                      const optionsList = [
                        { key: 'A', text: currentQ.option_a || (currentQ.options && currentQ.options[0]) || '' },
                        { key: 'B', text: currentQ.option_b || (currentQ.options && currentQ.options[1]) || '' },
                        { key: 'C', text: currentQ.option_c || (currentQ.options && currentQ.options[2]) || '' },
                        { key: 'D', text: currentQ.option_d || (currentQ.options && currentQ.options[3]) || '' },
                      ];

                      const currentSelected = selectedAnswers[currentQ.id];

                      return (
                        <Card className="p-6 bg-surface border-border shadow-card space-y-6">
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-border flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary-light">
                                Question {currentQuestionIndex + 1} of {displayQuestions.length}
                              </span>

                              {currentQ.topic && (
                                <Badge variant="neutral" size="sm" className="text-[11px] font-medium max-w-xs truncate" title={currentQ.topic}>
                                  Topic: {currentQ.topic}
                                </Badge>
                              )}

                              {currentQ.difficulty && (
                                <Badge
                                  variant={
                                    currentQ.difficulty === 'HARD'
                                      ? 'critical'
                                      : currentQ.difficulty === 'EASY'
                                      ? 'success'
                                      : 'neutral'
                                  }
                                  size="sm"
                                  className="font-bold uppercase tracking-wider"
                                >
                                  {currentQ.difficulty}
                                </Badge>
                              )}
                            </div>

                            <span className="text-xs text-text-muted">
                              Select the single best answer below
                            </span>
                          </div>

                          {/* Question Statement */}
                          <div className="break-words py-1">
                            <p className="text-base sm:text-lg font-bold text-text-primary leading-relaxed break-words">
                              {currentQ.question_text}
                            </p>
                          </div>

                          {/* MCQ Answer Option Cards (Selectable, No Spoilers) */}
                          <div className="space-y-3">
                            {optionsList.map((opt) => {
                              const isSelected = currentSelected === opt.key;

                              return (
                                <div
                                  key={opt.key}
                                  onClick={() => handleSelectOption(currentQ.id, opt.key)}
                                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                                    isSelected
                                      ? 'bg-primary-light/20 border-primary ring-2 ring-primary/20 text-text-primary shadow-xs'
                                      : 'bg-surface-elevated/40 border-border hover:border-primary/40 hover:bg-surface-elevated text-text-secondary hover:text-text-primary'
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 transition-colors ${
                                      isSelected
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-surface border border-border text-text-muted'
                                    }`}
                                  >
                                    {opt.key}
                                  </div>
                                  <div className="flex-1 min-w-0 break-words pt-0.5">
                                    <span className="text-xs sm:text-sm block leading-relaxed font-medium">
                                      {opt.text}
                                    </span>
                                  </div>
                                  <div className="shrink-0 pt-0.5">
                                    {isSelected ? (
                                      <CheckCircle2 className="w-5 h-5 text-primary" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border border-border" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Submission Error Alert */}
                          {quizSubmitError && (
                            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-2.5 text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-semibold block mb-0.5">Submission Error</span>
                                <span>{quizSubmitError}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setQuizSubmitError(null)}
                                className="text-rose-500 hover:text-rose-800 shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Navigation & Submit Controls */}
                          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              size="md"
                              onClick={handlePreviousQuestion}
                              disabled={currentQuestionIndex === 0 || isSubmittingQuiz}
                              className="gap-1.5 text-xs font-semibold self-start sm:self-center"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Previous Question</span>
                            </Button>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {currentQuestionIndex < displayQuestions.length - 1 ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="md"
                                  onClick={handleNextQuestion}
                                  disabled={isSubmittingQuiz}
                                  className="gap-1.5 text-xs font-semibold"
                                >
                                  <span>Next Question</span>
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              ) : null}

                              <Button
                                type="button"
                                variant="primary"
                                size="md"
                                onClick={handleSubmitPracticeQuiz}
                                disabled={isSubmittingQuiz}
                                className="gap-2 text-xs font-bold shadow-xs min-w-[140px]"
                              >
                                {isSubmittingQuiz ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Evaluating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4" />
                                    <span>Submit Practice Quiz</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })()}
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODE 3: RESULT SCREEN (Post-Submission Review)       */}
                {/* ---------------------------------------------------- */}
                {quizViewMode === 'RESULT' && quizResult && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
                    {/* Score Summary Hero Card */}
                    <Card className="p-6 bg-gradient-to-br from-primary-light/20 via-surface to-surface border-border shadow-card space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0 shadow-xs">
                            <Trophy className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg sm:text-xl font-extrabold text-text-primary">
                                Practice Quiz Results
                              </h3>
                              <Badge
                                variant={
                                  quizResult.percentage >= 80
                                    ? 'success'
                                    : quizResult.percentage >= 60
                                    ? 'ai'
                                    : 'neutral'
                                }
                                size="sm"
                                className="font-bold text-xs"
                              >
                                {quizResult.percentage}% Score
                              </Badge>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                              {quizResult.material_title}
                            </p>
                          </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleRetakeQuiz}
                            className="gap-1.5 text-xs font-semibold"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retake Quiz</span>
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => setQuizViewMode('PREVIEW')}
                            className="gap-1.5 text-xs font-semibold shadow-xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>View All Questions</span>
                          </Button>
                        </div>
                      </div>

                      {/* Performance Metric Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl bg-surface border border-border">
                          <span className="text-[11px] font-semibold text-text-muted block">Final Score</span>
                          <span className="text-lg sm:text-xl font-extrabold text-text-primary block mt-0.5">
                            {quizResult.correct_answers} / {quizResult.total_questions}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-surface border border-border">
                          <span className="text-[11px] font-semibold text-text-muted block">Correct Answers</span>
                          <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            {quizResult.correct_answers}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-surface border border-border">
                          <span className="text-[11px] font-semibold text-text-muted block">Incorrect / Skipped</span>
                          <span className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">
                            {quizResult.incorrect_answers}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-surface border border-border">
                          <span className="text-[11px] font-semibold text-text-muted block">Time Taken</span>
                          <span className="text-lg sm:text-xl font-extrabold text-text-primary block mt-0.5">
                            {quizResult.time_taken_seconds
                              ? `${Math.floor(quizResult.time_taken_seconds / 60)}m ${quizResult.time_taken_seconds % 60}s`
                              : 'Self-Paced'}
                          </span>
                        </div>
                      </div>

                      {/* Performance Feedback Banner */}
                      <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-text-secondary">
                            {quizResult.percentage >= 80
                              ? 'Outstanding performance! You demonstrated exceptional mastery of this material.'
                              : quizResult.percentage >= 60
                              ? 'Solid performance! Review the questions below to strengthen any gap areas.'
                              : 'Good practice effort! Take time to review the educational explanations below.'}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted shrink-0 hidden sm:inline">
                          Formative practice only
                        </span>
                      </div>
                    </Card>

                      {/* Result Screen View Sub-Tabs (Part 10E) */}
                      <div className="flex items-center gap-2 border-b border-border pb-3 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setResultSubTab('FEEDBACK')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            resultSubTab === 'FEEDBACK'
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Learning Feedback & Weak Topics</span>
                          {feedback && (
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                resultSubTab === 'FEEDBACK'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-primary-light text-primary'
                              }`}
                            >
                              {feedback.weak_topics.length} Gap{feedback.weak_topics.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setResultSubTab('REVIEW')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            resultSubTab === 'REVIEW'
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Question-by-Question Review</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                              resultSubTab === 'REVIEW'
                                ? 'bg-white/20 text-white'
                                : 'bg-surface-elevated text-text-muted'
                            }`}
                          >
                            {quizResult.total_questions}
                          </span>
                        </button>
                      </div>

                      {/* ---------------------------------------------------- */}
                      {/* SUB-TAB 1: AI LEARNING FEEDBACK & WEAK-TOPIC ANALYSIS */}
                      {/* ---------------------------------------------------- */}
                      {resultSubTab === 'FEEDBACK' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          {/* Loading State */}
                          {isLoadingFeedback && (
                            <Card className="p-8 text-center bg-surface border-border shadow-card space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto shadow-xs">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                              </div>
                              <h4 className="text-sm font-bold text-text-primary">
                                Analyzing Quiz Performance & Diagnosing Weak Topics...
                              </h4>
                              <p className="text-xs text-text-muted max-w-md mx-auto">
                                Our AI tutor is evaluating your mistake patterns, identifying conceptual gaps,
                                and cross-referencing competencies to formulate actionable next steps.
                              </p>
                            </Card>
                          )}

                          {/* Error State */}
                          {feedbackError && !isLoadingFeedback && (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3 text-xs">
                              <div className="flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold block mb-0.5">Feedback Synthesis Failed</span>
                                  <span>{feedbackError}</span>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => handleLoadFeedback(quizResult.attempt_id)}
                                className="text-xs shrink-0"
                              >
                                Retry
                              </Button>
                            </div>
                          )}

                          {/* Loaded Feedback View */}
                          {feedback && !isLoadingFeedback && (
                            <div className="space-y-5">
                              {/* Mode & Formative Header Banner */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-border">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <Badge
                                    variant={feedback.is_mock_fallback ? 'neutral' : 'ai'}
                                    size="sm"
                                    className="gap-1 font-bold"
                                  >
                                    {feedback.is_mock_fallback ? (
                                      <>
                                        <Info className="w-3 h-3" />
                                        <span>Demonstration Engine (Mock Fallback)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3" />
                                        <span>AI Tutor Analysis (GPT)</span>
                                      </>
                                    )}
                                  </Badge>
                                  <span className="text-xs text-text-muted">
                                    {feedback.disclaimer}
                                  </span>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleLoadFeedback(quizResult.attempt_id, true)}
                                  className="text-xs gap-1.5 self-start sm:self-center"
                                  title="Re-run performance analysis"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Re-analyze</span>
                                </Button>
                              </div>

                              {/* Overall Summary Card */}
                              <Card className="p-5 bg-gradient-to-r from-primary-light/10 via-surface to-surface border-border shadow-card space-y-2">
                                <div className="flex items-center gap-2">
                                  <BrainCircuit className="w-4 h-4 text-primary" />
                                  <h4 className="text-sm font-bold text-text-primary">
                                    Overall Diagnostic Summary
                                  </h4>
                                </div>
                                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                                  {feedback.overall_summary}
                                </p>
                              </Card>

                              {/* Strengths & Growth Areas Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strengths Card */}
                                <Card className="p-5 bg-surface border-border shadow-card space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                      <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                      Observed Strengths
                                    </h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {feedback.strengths.map((st, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-text-secondary"
                                      >
                                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                        <span className="leading-snug">{st}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </Card>

                                {/* Priority Improvement Areas Card */}
                                <Card className="p-5 bg-surface border-border shadow-card space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                      <Target className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                      Priority Improvement Areas
                                    </h4>
                                  </div>
                                  <ul className="space-y-2">
                                    {feedback.improvement_areas.map((ia, i) => (
                                      <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-text-secondary"
                                      >
                                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                        <span className="leading-snug">{ia}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </Card>
                              </div>

                              {/* Weak-Topics & Mistake Pattern Analysis */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    <h4 className="text-sm font-bold text-text-primary">
                                      Weak-Topic Diagnosis & Mistake Patterns
                                    </h4>
                                  </div>
                                  <span className="text-xs text-text-muted">
                                    Derived directly from incorrect answers
                                  </span>
                                </div>

                                {feedback.weak_topics.length > 0 ? (
                                  <div className="space-y-3">
                                    {feedback.weak_topics.map((wt, i) => (
                                      <Card
                                        key={i}
                                        className="p-4 bg-surface border-border shadow-card space-y-2.5"
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-text-primary">
                                              {wt.topic}
                                            </span>
                                            <Badge
                                              variant={
                                                wt.miss_rate >= 75
                                                  ? 'critical'
                                                  : wt.miss_rate >= 50
                                                  ? 'warning'
                                                  : 'neutral'
                                              }
                                              size="sm"
                                              className="font-bold text-[10px]"
                                            >
                                              {wt.miss_rate}% Miss Rate
                                            </Badge>
                                          </div>

                                          <span className="text-[11px] font-semibold text-text-muted">
                                            {wt.missed_count} of {wt.total_count} questions missed
                                          </span>
                                        </div>

                                        <p className="text-xs text-text-secondary leading-relaxed">
                                          {wt.diagnosis}
                                        </p>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <Card className="p-4 text-center bg-surface border-border text-xs text-text-muted">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                    <span>No critical topic gaps detected in this practice session!</span>
                                  </Card>
                                )}
                              </div>

                              {/* Weak Skills Section */}
                              {feedback.weak_skills.length > 0 && (
                                <Card className="p-5 bg-surface border-border shadow-card space-y-3">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-primary" />
                                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                      Micro-Skills & Conceptual Rules to Strengthen
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {feedback.weak_skills.map((ws, i) => (
                                      <div
                                        key={i}
                                        className="p-3 rounded-xl bg-surface-elevated/50 border border-border text-xs text-text-secondary flex items-start gap-2"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <span className="leading-snug font-medium">{ws}</span>
                                      </div>
                                    ))}
                                  </div>
                                </Card>
                              )}

                              {/* AI-Generated Actionable Next Steps */}
                              <Card className="p-5 bg-surface border-border shadow-card space-y-3">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                    AI-Recommended Next Steps
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {feedback.recommended_next_steps.map((step, i) => (
                                    <div
                                      key={i}
                                      className="p-3 rounded-xl bg-surface-elevated/40 border border-border flex items-start gap-3 text-xs"
                                    >
                                      <span className="w-5 h-5 rounded-full bg-primary-light text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                                        {i + 1}
                                      </span>
                                      <span className="text-text-primary leading-relaxed font-medium">
                                        {step}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </Card>

                              {/* Mapped Platform Competencies (Catalog Entities) */}
                              {feedback.mapped_competencies.length > 0 && (
                                <Card className="p-5 bg-surface border-border shadow-card space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Award className="w-4 h-4 text-primary" />
                                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                                        Mapped Platform Competencies
                                      </h4>
                                    </div>
                                    <span className="text-[11px] text-text-muted">
                                      Official framework alignment
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-muted">
                                    These verified platform competencies relate to the topics covered in your practice session:
                                  </p>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {feedback.mapped_competencies.map((comp) => (
                                      <div
                                        key={comp.id}
                                        className="px-3 py-2 rounded-xl bg-surface-elevated border border-border flex items-center gap-2"
                                      >
                                        <span className="text-xs font-bold text-text-primary">
                                          {comp.name}
                                        </span>
                                        <Badge variant="neutral" size="sm" className="text-[10px]">
                                          {comp.code}
                                        </Badge>
                                        {comp.domain && (
                                          <Badge variant="info" size="sm" className="text-[10px]">
                                            {comp.domain}
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </Card>
                              )}

                              {/* Recommended Catalog Courses */}
                              {feedback.recommended_courses.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="w-4 h-4 text-primary" />
                                      <h4 className="text-sm font-bold text-text-primary">
                                        Recommended Platform Courses
                                      </h4>
                                    </div>
                                    <span className="text-xs text-text-muted">
                                      From verified course catalog
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {feedback.recommended_courses.map((c) => (
                                      <Card
                                        key={c.id}
                                        className="p-4 bg-surface border-border shadow-card space-y-2 flex flex-col justify-between"
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <Badge variant="neutral" size="sm" className="text-[10px]">
                                              {c.provider}
                                            </Badge>
                                            <Badge
                                              variant={
                                                c.difficulty === 'Beginner'
                                                  ? 'success'
                                                  : c.difficulty === 'Advanced'
                                                  ? 'critical'
                                                  : 'ai'
                                              }
                                              size="sm"
                                              className="text-[10px]"
                                            >
                                              {c.difficulty}
                                            </Badge>
                                          </div>
                                          <h5 className="text-xs font-bold text-text-primary line-clamp-1">
                                            {c.title}
                                          </h5>
                                          <p className="text-[11px] text-text-muted mt-0.5">
                                            {c.domain} • {c.duration_hours}h estimated
                                          </p>
                                        </div>

                                        <Link
                                          href="/courses"
                                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                                        >
                                          <span>View Course in Catalog</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </Link>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ---------------------------------------------------- */}
                      {/* SUB-TAB 2: QUESTION-BY-QUESTION REVIEW              */}
                      {/* ---------------------------------------------------- */}
                      {resultSubTab === 'REVIEW' && (
                        <div className="space-y-4 pt-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-text-primary">
                                Detailed Answer Review & Explanations
                              </h4>
                              <p className="text-xs text-text-muted">
                                Compare your answers with the validated correct choices and study the contextual explanations.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {quizResult.question_review.map((item, qIdx) => {
                              const optionsList = [
                                { key: 'A', text: item.option_a },
                                { key: 'B', text: item.option_b },
                                { key: 'C', text: item.option_c },
                                { key: 'D', text: item.option_d },
                              ];

                              const learnerAnswer = item.selected_option?.toUpperCase();
                              const correctAnswer = item.correct_option?.toUpperCase();

                              return (
                                <Card
                                  key={item.question_id || qIdx}
                                  className="p-5 bg-surface border-border shadow-card space-y-4 transition-all overflow-hidden"
                                >
                                  {/* Question Metadata Header */}
                                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-primary-light">
                                        Question {qIdx + 1} of {quizResult.total_questions}
                                      </span>

                                      {item.topic && (
                                        <Badge variant="neutral" size="sm" className="text-[11px] font-medium max-w-xs truncate" title={item.topic}>
                                          Topic: {item.topic}
                                        </Badge>
                                      )}

                                      {item.difficulty && (
                                        <Badge
                                          variant={
                                            item.difficulty === 'HARD'
                                              ? 'critical'
                                              : item.difficulty === 'EASY'
                                              ? 'success'
                                              : 'neutral'
                                          }
                                          size="sm"
                                          className="font-bold uppercase tracking-wider"
                                        >
                                          {item.difficulty}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Correct / Incorrect Status Badge */}
                                    {item.is_correct ? (
                                      <Badge variant="success" size="sm" className="font-bold gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Correct (+1.0)</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="critical" size="sm" className="font-bold gap-1">
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span>Incorrect (0.0)</span>
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Question Statement */}
                                  <div className="break-words">
                                    <p className="text-sm sm:text-base font-bold text-text-primary leading-relaxed break-words">
                                      {item.question_text}
                                    </p>
                                  </div>

                                  {/* Options Review Grid */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {optionsList.map((opt) => {
                                      const isLearnerPick = learnerAnswer === opt.key;
                                      const isCorrectChoice = correctAnswer === opt.key;

                                      let cardStyle = 'bg-surface-elevated/40 border-border text-text-secondary';
                                      let badgeStyle = 'bg-border text-text-muted';

                                      if (isCorrectChoice) {
                                        cardStyle = 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-700 text-text-primary font-medium';
                                        badgeStyle = 'bg-emerald-600 text-white';
                                      } else if (isLearnerPick && !isCorrectChoice) {
                                        cardStyle = 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-text-primary';
                                        badgeStyle = 'bg-rose-600 text-white';
                                      }

                                      return (
                                        <div
                                          key={opt.key}
                                          className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${cardStyle}`}
                                        >
                                          <div
                                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${badgeStyle}`}
                                          >
                                            {opt.key}
                                          </div>
                                          <div className="flex-1 min-w-0 break-words">
                                            <span className="text-xs sm:text-sm block leading-snug break-words">
                                              {opt.text}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                              {isCorrectChoice && (
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                  <span>Correct Answer</span>
                                                </span>
                                              )}
                                              {isLearnerPick && (
                                                <span
                                                  className={`text-[10px] font-bold flex items-center gap-1 ${
                                                    isCorrectChoice
                                                      ? 'text-emerald-600 dark:text-emerald-400'
                                                      : 'text-rose-600 dark:text-rose-400'
                                                  }`}
                                                >
                                                  <span>• Your Choice</span>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Educational Explanation */}
                                  {item.explanation && (
                                    <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-border space-y-1.5 text-xs break-words">
                                      <div className="flex items-center gap-1.5 font-bold text-text-primary">
                                        <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span>Educational Explanation & Context</span>
                                      </div>
                                      <p className="text-text-secondary leading-relaxed text-[11px] sm:text-xs break-words">
                                        {item.explanation}
                                      </p>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Bottom Action Card in Result Screen */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border shadow-card">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary">
                          What would you like to do next?
                        </h4>
                        <p className="text-[11px] text-text-muted">
                          You can retake this practice quiz, review questions, or configure a new quiz with different settings.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleRetakeQuiz}
                          className="text-xs gap-1.5 font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Quiz</span>
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setQuizViewMode('PREVIEW');
                            window.scrollTo({ top: 150, behavior: 'smooth' });
                          }}
                          className="text-xs gap-1.5 font-bold shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Configure New Quiz</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State when generation returned 0 valid questions */}
            {generatedQuiz && displayQuestions.length === 0 && !isGenerating && (
              <Card className="p-6 bg-surface border border-dashed border-border text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <h3 className="text-sm font-bold text-text-primary">No Valid MCQs Generated</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  The AI generator could not synthesize valid questions from the selected material. Try selecting another material or regenerating.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGeneratePracticeQuiz}
                  className="text-xs gap-1.5 font-semibold mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar / Info Column (1 col) */}
          <div className="space-y-5">
            {/* Guide Card */}
            <Card className="p-5 bg-surface border-border shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">
                  How AI Quiz Practice Works
                </h3>
              </div>

              <ol className="space-y-3 text-xs text-text-secondary">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-text-primary block">Upload Material</strong>
                    Upload official MoSPI guidelines, research papers, or syllabus slides.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-text-primary block">Automated Parsing</strong>
                    Text is extracted, cleaned, and stored in your private practice vault.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-text-primary block">Contextual MCQs (Part 10C)</strong>
                    AI synthesizes questions strictly from your document concepts.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                    4
                  </div>
                  <div>
                    <strong className="text-text-primary block">Zero Risk Practice</strong>
                    Attempts test your understanding without affecting official competency metrics.
                  </div>
                </li>
              </ol>

              <div className="p-3 rounded-xl bg-surface-elevated/60 border border-border text-[11px] text-text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Only you can view or generate quizzes from your uploaded documents.</span>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-4 bg-surface border-border shadow-card">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-2">
                Related Learning Areas
              </span>
              <div className="space-y-1.5">
                <Link
                  href="/learner/learning-path"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-teal" />
                    Interactive Learning Path
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
                <Link
                  href="/learner/assessments"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    Official Assessments
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Section: My Uploaded Practice Materials */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                My Uploaded Practice Materials
              </h2>
              <p className="text-xs text-text-muted">
                Private documents uploaded by your account ready for quiz generation
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={fetchMyMaterials}
              disabled={isLoadingMaterials}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMaterials ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </Button>
          </div>

          {isLoadingMaterials ? (
            <div className="p-8 text-center bg-surface border border-border rounded-2xl">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-text-muted">Loading your practice documents...</p>
            </div>
          ) : myMaterials.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-dashed border-border rounded-2xl">
              <FileText className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-text-primary">No practice materials uploaded yet</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Upload your first lecture slide or manual above to begin building personalized AI practice quizzes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myMaterials.map((mat) => {
                const isSelected = uploadedMaterial?.id === mat.id;
                return (
                  <Card
                    key={mat.id}
                    className={`p-4 bg-surface border shadow-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary-light/10'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {isSelected && (
                            <Badge variant="ai" size="sm">
                              Active for Quiz
                            </Badge>
                          )}
                          <Badge
                            variant={mat.status === 'PROCESSED' ? 'success' : mat.status === 'FAILED' ? 'critical' : 'neutral'}
                            size="sm"
                          >
                            {mat.status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
                          {mat.title}
                        </h4>
                        <p className="text-[11px] text-text-muted truncate mt-0.5">
                          {mat.original_filename}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-text-muted pt-1 border-t border-border">
                        <span className="uppercase font-semibold text-primary">{mat.file_type}</span>
                        <span>•</span>
                        <span>{(mat.file_size / 1024).toFixed(0)} KB</span>
                        {mat.word_count !== undefined && mat.word_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{mat.word_count.toLocaleString()} words</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyId(mat.id)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                        title="Copy Material ID"
                      >
                        {copiedId === mat.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy ID</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant={isSelected ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            setUploadedMaterial(mat);
                            setGeneratedQuiz(null);
                            setGenerationError(null);
                          }}
                          className={`text-[11px] h-7 px-2.5 ${
                            isSelected ? 'font-bold shadow-xs' : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                          className="p-1 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
