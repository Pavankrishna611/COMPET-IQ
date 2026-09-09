'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/domain/StatCard';
import { mockTrainerAssessments, TrainerAssessmentItem } from '@/data/assessments';
import { aiAssessmentService } from '@/services/ai-assessment.service';
import { assessmentService } from '@/services/assessment.service';
import {
  AssignableLearnerResponse,
  LearningMaterialResponse,
  TrainerAssessmentDraftResponse,
  TrainerDraftQuestionUpdate,
  TrainerDraftSummaryItem,
  TrainerGeneratedQuestionPreview,
} from '@/types/api';
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Archive,
  CheckCircle2,
  Sparkles,
  Users,
  Award,
  BookOpen,
  FilterX,
  FileCheck,
  UploadCloud,
  FileText,
  Trash2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  FileUp,
  Loader2,
  X,
  Clock,
  Layers,
  Check,
  HelpCircle,
  Lightbulb,
  ArrowLeft,
  ChevronRight,
  Save,
  Send,
  Calendar,
  UserPlus,
  UserCheck,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt'];
const MAX_FILE_SIZE_MB = 20;

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function validateDraft(draft: TrainerAssessmentDraftResponse): string[] {
  const errors: string[] = [];
  if (!draft.title || !draft.title.trim()) {
    errors.push('Assessment title cannot be empty.');
  }
  if (!draft.questions || draft.questions.length === 0) {
    errors.push('Assessment must contain at least one question before publishing.');
    return errors;
  }
  draft.questions.forEach((q, idx) => {
    const num = idx + 1;
    if (!q.question_text || !q.question_text.trim()) {
      errors.push(`Question ${num}: Question statement is required.`);
    }
    if (!q.option_a || !q.option_a.trim()) {
      errors.push(`Question ${num}: Option A cannot be empty.`);
    }
    if (!q.option_b || !q.option_b.trim()) {
      errors.push(`Question ${num}: Option B cannot be empty.`);
    }
    if (!q.option_c || !q.option_c.trim()) {
      errors.push(`Question ${num}: Option C cannot be empty.`);
    }
    if (!q.option_d || !q.option_d.trim()) {
      errors.push(`Question ${num}: Option D cannot be empty.`);
    }
    const corr = (q.correct_option || '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(corr)) {
      errors.push(`Question ${num}: Correct option must be 'A', 'B', 'C', or 'D'.`);
    } else {
      const optMap: Record<string, string> = {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d,
      };
      if (!optMap[corr] || !optMap[corr].trim()) {
        errors.push(`Question ${num}: Correct option (${corr}) corresponds to an empty option.`);
      }
    }
  });
  return errors;
}

export default function TrainerAssessmentsPage() {
  // Tab Navigation: 'assessments' | 'materials'
  const [activeTab, setActiveTab] = useState<'assessments' | 'materials'>('assessments');

  // Existing Assessments State
  const [assessments, setAssessments] = useState<TrainerAssessmentItem[]>(mockTrainerAssessments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Part 10F: Trainer Assessment Materials State
  const [materials, setMaterials] = useState<LearningMaterialResponse[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Part 10G: Trainer Assessment Generation & Draft Preview State
  const [generatingMaterial, setGeneratingMaterial] = useState<LearningMaterialResponse | null>(null);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15>(5);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'>('MEDIUM');
  const [draftTitle, setDraftTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [draftPreview, setDraftPreview] = useState<TrainerAssessmentDraftResponse | null>(null);

  // Part 10H: Trainer Review, Edit & Publish State
  const [editingDraft, setEditingDraft] = useState<TrainerAssessmentDraftResponse | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [trainerDrafts, setTrainerDrafts] = useState<TrainerDraftSummaryItem[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  // Part 10I: Trainer Assessment Assignment State
  const [assigningAssessment, setAssigningAssessment] = useState<TrainerAssessmentItem | null>(null);
  const [assignableLearners, setAssignableLearners] = useState<AssignableLearnerResponse[]>([]);
  const [isLoadingLearners, setIsLoadingLearners] = useState(false);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [assignedLearnerIds, setAssignedLearnerIds] = useState<Set<string>>(new Set());
  const [assignDueDate, setAssignDueDate] = useState<string>('');
  const [learnerSearchQuery, setLearnerSearchQuery] = useState<string>('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAssignModal = async (asmt: TrainerAssessmentItem) => {
    setAssigningAssessment(asmt);
    setIsLoadingLearners(true);
    setSelectedLearnerIds([]);
    setAssignDueDate('');
    setLearnerSearchQuery('');

    try {
      const [learners, assignments] = await Promise.all([
        assessmentService.getAssignableLearners().catch(() => []),
        assessmentService.getAssessmentAssignments(asmt.id).catch(() => []),
      ]);

      setAssignableLearners(learners);
      const assignedIds = new Set(assignments.map((a) => a.user_id));
      setAssignedLearnerIds(assignedIds);
    } catch {
      setAssignableLearners([]);
      setAssignedLearnerIds(new Set());
    } finally {
      setIsLoadingLearners(false);
    }
  };

  const handleToggleSelectLearner = (id: string) => {
    if (assignedLearnerIds.has(id)) return;
    setSelectedLearnerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (selectableIds: string[]) => {
    const unselected = selectableIds.filter((id) => !selectedLearnerIds.includes(id));
    if (unselected.length > 0) {
      setSelectedLearnerIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
    } else {
      setSelectedLearnerIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
    }
  };

  const handleExecuteAssignment = async () => {
    if (!assigningAssessment) return;
    if (selectedLearnerIds.length === 0) {
      showToast('Please select at least one learner to assign.');
      return;
    }

    setIsSubmittingAssignment(true);
    try {
      const res = await assessmentService.assignAssessment(assigningAssessment.id, {
        learner_ids: selectedLearnerIds,
        due_date: assignDueDate ? new Date(assignDueDate).toISOString() : undefined,
      });

      showToast(res.message);
      setAssessments((prev) =>
        prev.map((a) =>
          a.id === assigningAssessment.id
            ? {
                ...a,
                status: 'Assigned',
                learnersCount: a.learnersCount + res.assigned_count,
              }
            : a
        )
      );
      setAssigningAssessment(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign assessment.';
      showToast(`Error: ${msg}`);
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  // Load Trainer Materials
  const fetchTrainerMaterials = async () => {
    setLoadingMaterials(true);
    setMaterialsError(null);
    try {
      const data = await aiAssessmentService.getTrainerMaterials();
      setMaterials(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assessment materials.';
      setMaterialsError(msg);
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Part 10H: Load Trainer Drafts
  const fetchTrainerDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const drafts = await aiAssessmentService.getTrainerDrafts();
      setTrainerDrafts(drafts);
      // Merge with assessments list if not already present
      setAssessments((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        const newItems: TrainerAssessmentItem[] = [];
        for (const d of drafts) {
          if (!existingIds.has(d.assessment_id)) {
            newItems.push({
              id: d.assessment_id,
              title: d.title,
              competency: 'Official Curriculum',
              questionsCount: d.number_of_questions,
              learnersCount: 0,
              averageScore: 0,
              status: 'Draft',
              lastUpdated: d.updated_at ? formatDate(d.updated_at) : formatDate(d.created_at),
              author: 'Faculty Trainer',
            });
          }
        }
        return [...newItems, ...prev];
      });
    } catch {
      // Gracefully continue with local state
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    fetchTrainerDrafts();
  }, []);

  useEffect(() => {
    if (activeTab === 'materials') {
      fetchTrainerMaterials();
    }
  }, [activeTab]);

  // Part 10H: Draft Review & Question Editor Handlers
  const handleOpenDraftEditor = async (assessmentId: string) => {
    try {
      const draft = await aiAssessmentService.getTrainerDraftAssessment(assessmentId);
      setEditingDraft(draft);
      setValidationErrors([]);
    } catch (err: unknown) {
      if (draftPreview && draftPreview.assessment_id === assessmentId) {
        setEditingDraft(draftPreview);
        setValidationErrors([]);
      } else {
        const msg = err instanceof Error ? err.message : 'Unable to load draft assessment details.';
        showToast(msg);
      }
    }
  };

  const handleUpdateDraftField = (field: keyof TrainerAssessmentDraftResponse, value: any) => {
    if (!editingDraft) return;
    setEditingDraft({ ...editingDraft, [field]: value });
  };

  const handleUpdateQuestion = (index: number, field: keyof TrainerGeneratedQuestionPreview, value: any) => {
    if (!editingDraft) return;
    const updated = [...editingDraft.questions];
    updated[index] = { ...updated[index], [field]: value };
    setEditingDraft({ ...editingDraft, questions: updated });
  };

  const handleAddQuestion = () => {
    if (!editingDraft) return;
    const newSeq = editingDraft.questions.length + 1;
    const newQ: TrainerGeneratedQuestionPreview = {
      id: `new-${Date.now()}`,
      sequence_order: newSeq,
      question_text: '',
      question_type: 'MCQ',
      difficulty: editingDraft.difficulty === 'MIXED' ? 'MEDIUM' : editingDraft.difficulty,
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      explanation: '',
      topic: editingDraft.title,
    };
    setEditingDraft({
      ...editingDraft,
      questions: [...editingDraft.questions, newQ],
      number_of_questions: newSeq,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (!editingDraft) return;
    if (editingDraft.questions.length <= 1) {
      showToast('Assessment must contain at least one question.');
      return;
    }
    const filtered = editingDraft.questions
      .filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, sequence_order: i + 1 }));
    setEditingDraft({
      ...editingDraft,
      questions: filtered,
      number_of_questions: filtered.length,
    });
  };

  const handleSaveDraft = async () => {
    if (!editingDraft) return;
    setIsSavingDraft(true);
    setValidationErrors([]);

    try {
      const payload: any = {
        title: editingDraft.title,
        description: editingDraft.description,
        difficulty: editingDraft.difficulty,
        questions: editingDraft.questions.map((q, idx) => ({
          id: q.id && !q.id.startsWith('new-') ? q.id : undefined,
          sequence_order: idx + 1,
          question_text: q.question_text,
          question_type: q.question_type,
          difficulty: q.difficulty,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation,
          topic: q.topic,
        })),
      };

      const saved = await aiAssessmentService.saveTrainerDraft(editingDraft.assessment_id, payload);
      setEditingDraft(saved);
      showToast('Draft assessment changes saved successfully.');
      fetchTrainerDrafts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft.';
      showToast(`Error: ${msg}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePromptPublish = () => {
    if (!editingDraft) return;
    const errors = validateDraft(editingDraft);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setPublishConfirmOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!editingDraft) return;
    setIsPublishing(true);
    try {
      const savePayload: any = {
        title: editingDraft.title,
        description: editingDraft.description,
        difficulty: editingDraft.difficulty,
        questions: editingDraft.questions.map((q, idx) => ({
          id: q.id && !q.id.startsWith('new-') ? q.id : undefined,
          sequence_order: idx + 1,
          question_text: q.question_text,
          question_type: q.question_type,
          difficulty: q.difficulty,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation,
          topic: q.topic,
        })),
      };
      await aiAssessmentService.saveTrainerDraft(editingDraft.assessment_id, savePayload);

      const published = await aiAssessmentService.publishTrainerDraft(editingDraft.assessment_id);

      setPublishConfirmOpen(false);
      setEditingDraft(null);
      setDraftPreview(null);
      showToast(`Official assessment "${published.title}" published successfully!`);

      setAssessments((prev) =>
        prev.map((a) =>
          a.id === published.assessment_id
            ? { ...a, status: 'Published', title: published.title, questionsCount: published.number_of_questions }
            : a
        )
      );
      fetchTrainerDrafts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish assessment.';
      showToast(`Error: ${msg}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Existing Assessment Actions
  const handleDuplicate = (item: TrainerAssessmentItem) => {
    const duplicated: TrainerAssessmentItem = {
      ...item,
      id: `tr-asmt-${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'Draft',
      learnersCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setAssessments((prev) => [duplicated, ...prev]);
    showToast(`Assessment "${item.title}" duplicated as Draft.`);
  };

  const handleArchive = (id: string) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'Archived' ? 'Published' : 'Archived' } : a))
    );
    showToast('Assessment status updated.');
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesComp = item.competency.toLowerCase().includes(q);
        if (!matchesTitle && !matchesComp) return false;
      }
      return true;
    });
  }, [assessments, searchQuery, statusFilter]);

  const totalLearners = assessments.reduce((acc, a) => acc + a.learnersCount, 0);
  const avgOverallScore = Math.round(
    assessments.reduce((acc, a) => acc + a.averageScore, 0) / (assessments.length || 1)
  );

  // Part 10F: Material Upload Handlers
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

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    if (!customTitle.trim()) {
      const base = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setCustomTitle(base);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const uploaded = await aiAssessmentService.uploadTrainerMaterial(
        selectedFile,
        customTitle.trim() || undefined
      );
      const wordCountMsg = uploaded.word_count ? ` (${uploaded.word_count.toLocaleString()} words extracted)` : '';
      setUploadSuccess(`"${uploaded.title}" uploaded and processed successfully${wordCountMsg}.`);
      showToast(`Material "${uploaded.title}" ready for AI assessment generation.`);

      setSelectedFile(null);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchTrainerMaterials();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check the document and try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the assessment material "${title}"?`)) return;

    setDeletingId(materialId);
    try {
      await aiAssessmentService.deleteTrainerMaterial(materialId);
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      showToast(`Material "${title}" removed.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete material.';
      showToast(`Error: ${msg}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Part 10G: Question Generation Handlers
  const handleOpenGenerateModal = (mat: LearningMaterialResponse) => {
    setGeneratingMaterial(mat);
    setDraftTitle(`${mat.title} Assessment Blueprint`);
    setQuestionCount(5);
    setDifficulty('MEDIUM');
    setGenerationError(null);
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatingMaterial) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await aiAssessmentService.generateTrainerAssessment(
        generatingMaterial.id,
        {
          number_of_questions: questionCount,
          difficulty: difficulty,
          title: draftTitle.trim() || undefined,
        }
      );

      setDraftPreview(response);
      setGeneratingMaterial(null);

      // Add to assessments table as Draft
      setAssessments((prev) => [
        {
          id: response.assessment_id,
          title: response.title,
          competency: 'Official Curriculum',
          questionsCount: response.number_of_questions,
          learnersCount: 0,
          averageScore: 0,
          status: 'Draft',
          lastUpdated: new Date().toISOString().split('T')[0],
          author: 'Faculty Trainer',
        },
        ...prev,
      ]);

      showToast(`Draft assessment "${response.title}" generated successfully with ${response.number_of_questions} questions.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Question generation failed. Please try again.';
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!materialSearchQuery.trim()) return materials;
    const q = materialSearchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.original_filename.toLowerCase().includes(q) ||
        m.file_type.toLowerCase().includes(q)
    );
  }, [materials, materialSearchQuery]);

  return (
    <AppShell
      title="Manage Assessments"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Trainer' },
        { label: 'Manage Assessments' },
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
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                Faculty Governance Portal
              </Badge>
              <span className="text-xs text-text-muted">MoSPI Cadre Capacity Building</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Manage Assessments
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Calibrate competency tests, upload official curriculum blueprints, and synthesize AI-generated assessment drafts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className="flex items-center gap-2 px-3.5 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-semibold transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Materials
            </button>
            <Link href="/trainer/assessment-generator">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />} className="text-xs font-semibold shadow-sm">
                AI Assessment Generator
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Assessments"
            value={assessments.length}
            accent="blue"
            icon={<ClipboardCheck className="w-5 h-5" />}
            subtitle="Across 4 MoSPI domains"
          />
          <StatCard
            title="Active Learners"
            value={`${totalLearners} Officers`}
            accent="teal"
            icon={<Users className="w-5 h-5" />}
            subtitle="ISS / SSS Cadre cohorts"
          />
          <StatCard
            title="Cohort Pass Rate"
            value={`${avgOverallScore}% Avg`}
            accent="warning"
            icon={<Award className="w-5 h-5" />}
            subtitle="Baseline benchmark: 75%"
          />
          <StatCard
            title="Published Blueprints"
            value={assessments.filter((a) => a.status === 'Published').length}
            accent="ai"
            icon={<BookOpen className="w-5 h-5" />}
            subtitle="Live in Learner Hub"
          />
        </div>

        {/* Section Navigation Tabs: Official Assessments vs Assessment Materials */}
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assessments');
              setDraftPreview(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'assessments'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Official Assessments
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'assessments' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-muted'
              }`}
            >
              {assessments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'materials'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Assessment Materials
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'materials' ? 'bg-white/20 text-white' : 'bg-surface-elevated text-text-muted'
              }`}
            >
              {materials.length}
            </span>
          </button>
        </div>

        {/* TAB 1: OFFICIAL ASSESSMENTS */}
        {activeTab === 'assessments' && (
          editingDraft ? (
            /* PART 10H: REVIEW & QUESTION EDITOR */
            <div className="bg-surface border-2 border-primary/30 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="warning" size="sm" withDot className="font-bold">
                      Draft — Under Review
                    </Badge>
                    <Badge variant="teal" size="sm" className="font-semibold">
                      Official Assessment Blueprint
                    </Badge>
                    <span className="text-xs text-text-muted font-mono">
                      ID: {editingDraft.assessment_id.slice(0, 8)}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">
                    Review & Edit Assessment
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Review stems, customize options, designate correct answer keys, and publish to the official catalog.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingDraft(null)}
                    leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Back to Catalog
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    leftIcon={isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePromptPublish}
                    disabled={isPublishing}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Publish Assessment
                  </Button>
                </div>
              </div>

              {/* Validation Errors Alert Banner */}
              {validationErrors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 text-xs text-rose-700 dark:text-rose-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Please correct the following issues before publishing:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px]">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Assessment Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-elevated/50 p-4 rounded-xl border border-border">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-text-primary">Assessment Title</label>
                  <input
                    type="text"
                    value={editingDraft.title}
                    onChange={(e) => handleUpdateDraftField('title', e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary">Difficulty</label>
                  <select
                    value={editingDraft.difficulty}
                    onChange={(e) => handleUpdateDraftField('difficulty', e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-semibold"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Question Editor Cards */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    Assessment Questions ({editingDraft.questions.length})
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddQuestion}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Add Question Manually
                  </Button>
                </div>

                {editingDraft.questions.map((q, qIndex) => {
                  const isStemEmpty = !q.question_text || !q.question_text.trim();
                  const hasEmptyOpt = !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim();

                  return (
                    <div
                      key={q.id || qIndex}
                      className="bg-surface-elevated/70 border border-border rounded-xl p-5 space-y-4 relative group"
                    >
                      {/* Question Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                            Question {qIndex + 1}
                          </span>
                          {(isStemEmpty || hasEmptyOpt) && (
                            <Badge variant="critical" size="sm">
                              Incomplete Fields
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">Difficulty:</span>
                          <select
                            value={q.difficulty}
                            onChange={(e) => handleUpdateQuestion(qIndex, 'difficulty', e.target.value)}
                            className="px-2.5 py-1 bg-surface border border-border rounded-lg text-xs font-semibold text-text-primary focus:outline-none"
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            title="Remove question from assessment"
                            className="p-1 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question Stem Textarea */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-muted uppercase">
                          Question Statement / Stem
                        </label>
                        <textarea
                          value={q.question_text}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'question_text', e.target.value)}
                          rows={2}
                          placeholder="Enter question statement..."
                          className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                        />
                      </div>

                      {/* Options 2x2 Grid */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-text-muted uppercase">
                            Options (Click Letter to Designate Correct Answer)
                          </label>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Current Key: Option {q.correct_option}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                            const optField = `option_${letter.toLowerCase()}` as keyof typeof q;
                            const optVal = (q[optField] as string) || '';
                            const isCorrect = q.correct_option === letter;

                            return (
                              <div
                                key={letter}
                                className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                                    : 'bg-surface border-border'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestion(qIndex, 'correct_option', letter)}
                                  title={`Mark option ${letter} as correct answer`}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-surface-elevated text-text-muted hover:bg-primary/20 hover:text-primary border border-border'
                                  }`}
                                >
                                  {letter}
                                </button>

                                <input
                                  type="text"
                                  value={optVal}
                                  onChange={(e) => handleUpdateQuestion(qIndex, optField, e.target.value)}
                                  placeholder={`Option ${letter}`}
                                  className="flex-1 bg-transparent text-xs text-text-primary focus:outline-none placeholder-text-muted font-medium"
                                />

                                {isCorrect && (
                                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation Field */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Educational Explanation</span>
                        </label>
                        <textarea
                          value={q.explanation || ''}
                          onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                          rows={2}
                          placeholder="Explain why the correct answer is right..."
                          className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Add Question Card Footer */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-3 border-2 border-dashed border-border hover:border-primary/50 hover:bg-surface-elevated/40 rounded-xl text-xs font-semibold text-text-secondary hover:text-primary transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Question to Draft
                  </button>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-light pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingDraft(null)}
                  className="text-xs font-semibold"
                >
                  Cancel & Back
                </Button>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft}
                    leftIcon={isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePromptPublish}
                    disabled={isPublishing}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Publish Assessment
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assessment name, competency..."
                    className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted whitespace-nowrap">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Assessments Management Table */}
              <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated text-text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3.5 px-4">Assessment Name</th>
                        <th className="py-3.5 px-4">Competency</th>
                        <th className="py-3.5 px-4 text-center">Questions</th>
                        <th className="py-3.5 px-4 text-center">Learners</th>
                        <th className="py-3.5 px-4 text-center">Avg Score</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light text-text-primary">
                      {filteredAssessments.length > 0 ? (
                        filteredAssessments.map((asmt) => (
                          <tr
                            key={asmt.id}
                            className="hover:bg-surface-elevated/50 transition-colors group"
                          >
                            {/* Title & Author */}
                            <td className="py-4 px-4 min-w-[220px]">
                              <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                                {asmt.title}
                              </div>
                              <div className="text-[11px] text-text-muted mt-0.5">
                                {asmt.author} • Updated {asmt.lastUpdated}
                              </div>
                            </td>

                            {/* Competency */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <Badge variant="teal" size="sm" className="font-semibold">
                                {asmt.competency}
                              </Badge>
                            </td>

                            {/* Questions Count */}
                            <td className="py-4 px-4 text-center font-mono font-bold whitespace-nowrap">
                              {asmt.questionsCount}
                            </td>

                            {/* Learners Count */}
                            <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                              {asmt.learnersCount}
                            </td>

                            {/* Average Score */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                                  asmt.averageScore >= 80
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                {asmt.averageScore}%
                              </span>
                            </td>

                            {/* Status Badge */}
                            <td className="py-4 px-4 text-center whitespace-nowrap">
                              <Badge
                                variant={
                                  asmt.status === 'Published'
                                    ? 'success'
                                    : asmt.status === 'Assigned'
                                    ? 'teal'
                                    : asmt.status === 'Draft'
                                    ? 'warning'
                                    : 'neutral'
                                }
                                size="sm"
                                withDot
                              >
                                {asmt.status}
                              </Badge>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {asmt.status === 'Draft' ? (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenDraftEditor(asmt.id)}
                                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                                    className="text-[11px] font-semibold py-1 px-2.5 h-7 shadow-xs"
                                  >
                                    Review & Edit
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="teal"
                                      size="sm"
                                      onClick={() => handleOpenAssignModal(asmt)}
                                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                                      className="text-[11px] font-semibold py-1 px-2.5 h-7 shadow-xs"
                                    >
                                      Assign
                                    </Button>

                                    <Link href="/learner/quiz">
                                      <button
                                        type="button"
                                        title="Preview Assessment in Learner View"
                                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    </Link>

                                    <Link href="/trainer/assessment-generator">
                                      <button
                                        type="button"
                                        title="Edit Assessment Blueprint"
                                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    </Link>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(asmt)}
                                  title="Duplicate Assessment"
                                  className="p-1.5 rounded-lg text-text-muted hover:text-teal hover:bg-surface-elevated transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleArchive(asmt.id)}
                                  title={asmt.status === 'Archived' ? 'Unarchive' : 'Archive'}
                                  className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-surface-elevated transition-colors"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-text-muted">
                            No assessments match your filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 2: ASSESSMENT MATERIALS & GENERATION (PARTS 10F & 10G) */}
        {activeTab === 'materials' && (
          <div className="space-y-8">
            {/* PART 10G: DRAFT ASSESSMENT PREVIEW (IF ACTIVE) */}
            {draftPreview ? (
              <div className="bg-surface border-2 border-primary/30 rounded-2xl p-6 shadow-md space-y-6 animate-in fade-in-50 duration-200">
                {/* Preview Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="warning" size="sm" withDot className="font-bold tracking-wide">
                        Draft — Not Published
                      </Badge>
                      <Badge variant="teal" size="sm" className="font-semibold">
                        Official Assessment Blueprint
                      </Badge>
                      {draftPreview.is_mock_fallback ? (
                        <Badge variant="neutral" size="sm" className="font-semibold">
                          Mock Simulation Mode
                        </Badge>
                      ) : (
                        <Badge variant="ai" size="sm" className="font-semibold">
                          AI-Powered
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-text-primary tracking-tight">
                      {draftPreview.title}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">
                      {draftPreview.description || `Synthesized from ${draftPreview.material_title}`}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                      <span>Derived from: <strong className="text-text-primary">{draftPreview.material_title}</strong></span>
                      <span>•</span>
                      <span>Questions: <strong className="text-text-primary">{draftPreview.number_of_questions} MCQs</strong></span>
                      <span>•</span>
                      <span>Difficulty: <strong className="text-text-primary">{draftPreview.difficulty}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDraftPreview(null)}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Back to Materials List
                    </Button>
                  </div>
                </div>

                {/* Staging Notice Banner */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Staged as Faculty Draft</p>
                    <p className="text-[11px] mt-0.5 text-amber-700 dark:text-amber-300">
                      This assessment blueprint has been saved as a Draft. It is strictly not visible to learners. In Part 10H, you will be able to review, edit options, approve individual questions, and publish the blueprint to the official assessment catalog.
                    </p>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    Generated Assessment Questions ({draftPreview.questions.length})
                  </h3>

                  <div className="space-y-4">
                    {draftPreview.questions.map((q) => (
                      <div
                        key={q.id || q.sequence_order}
                        className="bg-surface-elevated/60 border border-border rounded-xl p-5 space-y-3.5"
                      >
                        {/* Question Metadata Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                              Question {q.sequence_order}
                            </span>
                            <span className="text-[11px] font-semibold text-text-muted uppercase">
                              {q.question_type}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {q.topic && (
                              <span className="text-[11px] text-text-muted">
                                Topic: <strong className="text-text-primary">{q.topic}</strong>
                              </span>
                            )}
                            <Badge
                              variant={
                                q.difficulty === 'EASY'
                                  ? 'success'
                                  : q.difficulty === 'HARD'
                                  ? 'critical'
                                  : 'warning'
                              }
                              size="sm"
                              className="text-[10px] font-bold"
                            >
                              {q.difficulty}
                            </Badge>
                          </div>
                        </div>

                        {/* Question Text */}
                        <p className="text-sm font-semibold text-text-primary leading-relaxed">
                          {q.question_text}
                        </p>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                            const optKey = `option_${letter.toLowerCase()}` as keyof typeof q;
                            const optText = (q[optKey] as string) || '';
                            const isCorrect = q.correct_option === letter;

                            return (
                              <div
                                key={letter}
                                className={`p-3 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-semibold shadow-sm'
                                    : 'bg-surface border-border text-text-secondary'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-surface-elevated text-text-muted border border-border'
                                  }`}
                                >
                                  {letter}
                                </span>
                                <span className="flex-1 leading-snug">{optText}</span>
                                {isCorrect && (
                                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                    <Check className="w-3 h-3" />
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Educational Explanation Box */}
                        {q.explanation && (
                          <div className="p-3 bg-surface border border-border/80 rounded-xl text-xs text-text-secondary flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <strong className="text-text-primary">Explanation: </strong>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-light pt-4">
                  <span className="text-xs text-text-muted">
                    Saved as Draft Assessment #{draftPreview.assessment_id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDraftPreview(null)}
                      className="text-xs font-semibold"
                    >
                      Close Preview
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingDraft(draftPreview);
                        setDraftPreview(null);
                        setActiveTab('assessments');
                      }}
                      leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      className="text-xs font-semibold"
                    >
                      Review & Edit Questions
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Upload Material Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-light pb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-primary" />
                    Upload Assessment Learning Material
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Upload official syllabi, survey methodology manuals, or national accounts guidelines to generate verified AI assessment questions.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] font-semibold text-text-muted border border-border">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] font-semibold text-text-muted border border-border">
                    DOCX
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] font-semibold text-text-muted border border-border">
                    PPTX
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[11px] font-semibold text-text-muted border border-border">
                    TXT
                  </span>
                  <span className="text-[10px] text-text-muted ml-1">· Max 20MB</span>
                </div>
              </div>

              {/* Feedback Alerts */}
              {uploadSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadSuccess(null)}
                    className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-700 dark:text-rose-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Dropzone & Form */}
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/5 scale-[0.99]'
                      : 'border-border hover:border-primary/50 hover:bg-surface-elevated/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-text-primary">
                        Drag and drop assessment reference document here
                      </span>
                      <span className="text-xs text-text-muted">, or click to browse</span>
                    </div>
                    <p className="text-[11px] text-text-muted max-w-md">
                      Supports official MoSPI training modules, statistical guidelines, and survey field manuals.
                    </p>
                  </div>
                </div>

                {/* Selected File Details & Title Input */}
                {selectedFile && (
                  <div className="bg-surface-elevated border border-border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-text-primary truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {formatBytes(selectedFile.size)} · {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Material Title (Optional)"
                        className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />

                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          disabled={isUploading}
                          leftIcon={
                            isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )
                          }
                          className="text-xs font-semibold whitespace-nowrap"
                        >
                          {isUploading ? 'Extracting Text...' : 'Upload & Process'}
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setCustomTitle('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          disabled={isUploading}
                          className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-surface transition-colors"
                          title="Cancel selection"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Uploaded Materials List Card */}
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light pb-4">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-5 h-5 text-teal" />
                  <div>
                    <h2 className="text-base font-bold text-text-primary">
                      Assessment Reference Materials
                    </h2>
                    <p className="text-xs text-text-muted">
                      Official materials uploaded for AI-assisted question calibration.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="text"
                      value={materialSearchQuery}
                      onChange={(e) => setMaterialSearchQuery(e.target.value)}
                      placeholder="Search materials..."
                      className="w-full pl-9 pr-3 py-1.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={fetchTrainerMaterials}
                    disabled={loadingMaterials}
                    className="p-2 bg-surface-elevated border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors shrink-0"
                    title="Refresh materials list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingMaterials ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Table / Empty State / Loading State */}
              {loadingMaterials ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span>Loading assessment materials...</span>
                </div>
              ) : materialsError ? (
                <div className="p-6 text-center text-xs text-rose-600 bg-rose-500/5 rounded-xl border border-rose-500/20">
                  <p className="font-semibold">{materialsError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={fetchTrainerMaterials}
                    className="mt-3 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-xl bg-surface-elevated/40 border border-border border-dashed flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-xs font-bold text-text-primary mt-1">
                    {materialSearchQuery.trim()
                      ? 'No materials match your search'
                      : 'No Assessment Materials Uploaded Yet'}
                  </h3>
                  <p className="text-[11px] text-text-muted max-w-md">
                    {materialSearchQuery.trim()
                      ? 'Try adjusting your search terms or clearing the filter.'
                      : 'Upload reference materials such as National Accounts blueprints, survey methodologies, or statistical guidelines to generate official exam questions with AI.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-elevated text-text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
                      <tr>
                        <th className="py-3 px-4">Material Name & Filename</th>
                        <th className="py-3 px-4 text-center">Format</th>
                        <th className="py-3 px-4 text-center">Size</th>
                        <th className="py-3 px-4 text-center">Extracted Words</th>
                        <th className="py-3 px-4 text-center">Upload Date</th>
                        <th className="py-3 px-4 text-center">Processing Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light text-text-primary">
                      {filteredMaterials.map((mat) => {
                        const isDocx = mat.file_type === 'docx' || mat.file_type === 'doc';
                        const isPptx = mat.file_type === 'pptx' || mat.file_type === 'ppt';
                        const isPdf = mat.file_type === 'pdf';
                        const isReady = mat.status === 'PROCESSED';

                        return (
                          <tr
                            key={mat.id}
                            className="hover:bg-surface-elevated/50 transition-colors group"
                          >
                            {/* Material Name & Filename */}
                            <td className="py-3.5 px-4 min-w-[220px]">
                              <div className="font-bold text-text-primary group-hover:text-primary transition-colors flex items-center gap-2">
                                <FileText className="w-4 h-4 text-text-muted shrink-0" />
                                <span className="truncate">{mat.title}</span>
                              </div>
                              <div className="text-[11px] text-text-muted ml-6 truncate">
                                {mat.original_filename}
                              </div>
                            </td>

                            {/* Format Badge */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                  isPdf
                                    ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                    : isDocx
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                    : isPptx
                                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                    : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                                }`}
                              >
                                {mat.file_type}
                              </span>
                            </td>

                            {/* File Size */}
                            <td className="py-3.5 px-4 text-center font-mono text-[11px] whitespace-nowrap">
                              {formatBytes(mat.file_size)}
                            </td>

                            {/* Extracted Words */}
                            <td className="py-3.5 px-4 text-center font-mono whitespace-nowrap">
                              {mat.word_count ? (
                                <span className="font-bold text-text-primary">
                                  {mat.word_count.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-text-muted text-[11px]">—</span>
                              )}
                            </td>

                            {/* Upload Date */}
                            <td className="py-3.5 px-4 text-center text-text-muted whitespace-nowrap">
                              {formatDate(mat.created_at)}
                            </td>

                            {/* Processing Status Badge */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {mat.status === 'PROCESSED' ? (
                                <Badge variant="success" size="sm" withDot className="font-semibold">
                                  READY
                                </Badge>
                              ) : mat.status === 'PROCESSING' ? (
                                <Badge variant="info" size="sm" withDot className="font-semibold">
                                  PROCESSING
                                </Badge>
                              ) : (
                                <Badge variant="critical" size="sm" withDot className="font-semibold">
                                  FAILED
                                </Badge>
                              )}
                            </td>

                            {/* Actions: Generate Assessment (Part 10G) & Delete */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {isReady && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleOpenGenerateModal(mat)}
                                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                                    className="text-[11px] font-semibold py-1 px-3 shadow-xs h-7"
                                  >
                                    Generate with AI
                                  </Button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                                  disabled={deletingId === mat.id}
                                  title="Delete assessment material"
                                  className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-surface-elevated transition-colors disabled:opacity-50"
                                >
                                  {deletingId === mat.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PART 10G: GENERATE ASSESSMENT MODAL */}
        {generatingMaterial && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
            <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-light pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Generate Assessment with AI
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Synthesize official MCQs calibrated from verified material.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setGeneratingMaterial(null)}
                  disabled={isGenerating}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Material Info Box */}
              <div className="bg-surface-elevated border border-border rounded-xl p-3.5 flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {generatingMaterial.title}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {generatingMaterial.original_filename} • {generatingMaterial.word_count ? `${generatingMaterial.word_count.toLocaleString()} words` : 'Ready'}
                  </p>
                </div>
                <Badge variant="success" size="sm" withDot>
                  READY
                </Badge>
              </div>

              {/* Form Options */}
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                {/* Number of Questions (5, 10, 15) */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-2">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([5, 10, 15] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                          questionCount === cnt
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-elevated border-border text-text-secondary hover:border-primary/40'
                        }`}
                      >
                        <span>{cnt} Questions</span>
                        <span className={`text-[10px] font-normal ${questionCount === cnt ? 'text-white/80' : 'text-text-muted'}`}>
                          ~{cnt * 3} mins
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-2">
                    Assessment Difficulty
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'EASY', label: 'Easy' },
                      { key: 'MEDIUM', label: 'Medium' },
                      { key: 'HARD', label: 'Hard' },
                      { key: 'MIXED', label: 'Mixed' },
                    ].map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setDifficulty(d.key as any)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          difficulty === d.key
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-elevated border-border text-text-secondary hover:border-primary/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Custom Blueprint Title */}
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    Assessment Blueprint Title
                  </label>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g. National Accounts Statistics Evaluation"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Error Banner */}
                {generationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-light">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setGeneratingMaterial(null)}
                    disabled={isGenerating}
                    className="text-xs font-semibold"
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isGenerating}
                    leftIcon={
                      isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {isGenerating ? 'Synthesizing Questions...' : 'Generate Questions'}
                  </Button>
                </div>
              </form>

              {/* Generating Overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3 z-10 animate-in fade-in-50 duration-200">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Synthesizing Assessment Questions
                    </h4>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                      Parsing curriculum context, formulating question stems, crafting distractor options, and verifying correct answer keys...
                    </p>
                  </div>
                  <Loader2 className="w-5 h-5 text-primary animate-spin mt-2" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publish Confirmation Modal */}
        {publishConfirmOpen && editingDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    Publish Official Assessment?
                  </h3>
                  <p className="text-xs text-text-muted">
                    Lock questions and transition to official assessment
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Pre-Publish Verification Notice
                </div>
                <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px]">
                  <li>
                    Status will transition from <span className="font-semibold">DRAFT</span> to <span className="font-semibold text-emerald-600 dark:text-emerald-400">PUBLISHED</span>.
                  </li>
                  <li>
                    Assessment type will be confirmed as <span className="font-semibold">TRAINER_OFFICIAL</span>.
                  </li>
                  <li>
                    All <span className="font-semibold">{editingDraft.questions.length} questions</span> and answer options will become permanently immutable.
                  </li>
                  <li>
                    Learner assignment and cohort scheduling will become available in Part 10I.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-light">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPublishConfirmOpen(false)}
                  disabled={isPublishing}
                  className="text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmPublish}
                  disabled={isPublishing}
                  leftIcon={
                    isPublishing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )
                  }
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Assessment Modal (Part 10I) */}
        {assigningAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl max-w-2xl w-full space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border-light pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">
                      Assign Assessment to Learners
                    </h3>
                    <p className="text-xs text-text-muted">
                      {assigningAssessment.title} • {assigningAssessment.questionsCount} Questions
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningAssessment(null)}
                  disabled={isSubmittingAssignment}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Due Date & Scheduling Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-elevated/60 p-3.5 rounded-xl border border-border shrink-0">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                </div>
                <div className="flex flex-col justify-center text-[11px] text-text-secondary leading-snug">
                  <span className="font-semibold text-text-primary">Assignment Policy:</span>
                  <span>Assigned learners will see this official assessment in their portal. Duplicate assignments are automatically prevented.</span>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                  <input
                    type="text"
                    value={learnerSearchQuery}
                    onChange={(e) => setLearnerSearchQuery(e.target.value)}
                    placeholder="Search by learner name, official ID, or designation..."
                    className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
                  Selected: <strong className="text-teal">{selectedLearnerIds.length}</strong>
                </span>
              </div>

              {/* Learners Selection List */}
              <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[360px] border border-border rounded-xl divide-y divide-border-light bg-surface">
                {isLoadingLearners ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 text-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">Loading eligible civil service learners...</span>
                  </div>
                ) : assignableLearners.length === 0 ? (
                  <div className="py-12 text-center text-xs text-text-muted">
                    No active learners available for assignment.
                  </div>
                ) : (
                  (() => {
                    const filtered = assignableLearners.filter((l) => {
                      const q = learnerSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        l.full_name.toLowerCase().includes(q) ||
                        l.official_id.toLowerCase().includes(q) ||
                        (l.designation && l.designation.toLowerCase().includes(q)) ||
                        (l.department_name && l.department_name.toLowerCase().includes(q))
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="py-10 text-center text-xs text-text-muted">
                          No learners match your search query.
                        </div>
                      );
                    }

                    const selectable = filtered.filter((l) => !assignedLearnerIds.has(l.id));

                    return (
                      <>
                        <div className="p-2.5 bg-surface-elevated flex items-center justify-between text-[11px] font-semibold text-text-secondary border-b border-border">
                          <span>Learner Details</span>
                          {selectable.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectAll(selectable.map((l) => l.id))}
                              className="text-primary hover:underline font-semibold"
                            >
                              {selectable.every((l) => selectedLearnerIds.includes(l.id))
                                ? 'Deselect All'
                                : 'Select All Filtered'}
                            </button>
                          )}
                        </div>

                        {filtered.map((learner) => {
                          const isAlreadyAssigned = assignedLearnerIds.has(learner.id);
                          const isSelected = selectedLearnerIds.includes(learner.id) || isAlreadyAssigned;

                          return (
                            <div
                              key={learner.id}
                              onClick={() => handleToggleSelectLearner(learner.id)}
                              className={`p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                                isAlreadyAssigned
                                  ? 'bg-surface-elevated/40 opacity-75 cursor-default'
                                  : isSelected
                                  ? 'bg-teal/5 hover:bg-teal/10'
                                  : 'hover:bg-surface-elevated/60'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isAlreadyAssigned}
                                  onChange={() => handleToggleSelectLearner(learner.id)}
                                  className="w-4 h-4 rounded text-teal focus:ring-teal cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-text-primary truncate">
                                      {learner.full_name}
                                    </span>
                                    <span className="font-mono text-[10px] text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-border">
                                      {learner.official_id}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-text-secondary">
                                    {learner.designation && <span>{learner.designation}</span>}
                                    {learner.department_name && (
                                      <>
                                        <span>•</span>
                                        <span className="text-text-muted">{learner.department_name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isAlreadyAssigned ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Already Assigned
                                  </span>
                                ) : isSelected ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                                    Selected
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border-light shrink-0">
                <span className="text-xs text-text-muted">
                  {selectedLearnerIds.length === 0
                    ? 'Select at least one learner'
                    : `Ready to assign to ${selectedLearnerIds.length} learner(s)`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setAssigningAssessment(null)}
                    disabled={isSubmittingAssignment}
                    className="text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={handleExecuteAssignment}
                    disabled={isSubmittingAssignment || selectedLearnerIds.length === 0}
                    leftIcon={
                      isSubmittingAssignment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5" />
                      )
                    }
                    className="text-xs font-semibold"
                  >
                    {isSubmittingAssignment ? 'Assigning...' : `Assign Assessment (${selectedLearnerIds.length})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
