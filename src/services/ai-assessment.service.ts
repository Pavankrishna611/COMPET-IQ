/**
 * Trainer AI Assessment Generator & Document Processing API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  AssessmentResponse,
  GeneratedQuestionResponse,
  GeneratedQuestionsResponse,
  LearningMaterialResponse,
  MaterialAnalysisResponse,
  PracticeFeedbackResponse,
  PracticeQuizResultResponse,
  PracticeQuizSubmitRequest,
  TrainerAssessmentDraftResponse,
  TrainerAssessmentGenerateRequest,
  TrainerDraftQuestionUpdate,
  TrainerDraftSaveRequest,
  TrainerDraftSummaryItem,
  TrainerGeneratedQuestionPreview,
} from '@/types/api';

class AIAssessmentService {
  /**
   * Upload educational document (.pdf, .docx, .pptx, .txt) with multipart form data.
   */
  async uploadMaterial(file: File, title?: string): Promise<LearningMaterialResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return apiClient.post<LearningMaterialResponse>('/ai-assessments/materials/upload', formData);
  }

  /**
   * List uploaded learning materials.
   */
  async getMaterials(): Promise<LearningMaterialResponse[]> {
    return apiClient.get<LearningMaterialResponse[]>('/ai-assessments/materials');
  }

  /**
   * Get specific learning material by ID.
   */
  async getMaterial(materialId: string): Promise<LearningMaterialResponse> {
    return apiClient.get<LearningMaterialResponse>(`/ai-assessments/materials/${materialId}`);
  }

  /**
   * Delete uploaded learning material by ID.
   */
  async deleteMaterial(materialId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/ai-assessments/materials/${materialId}`);
  }

  /**
   * Upload official trainer assessment learning material (.pdf, .docx, .pptx, .txt) (Part 10F).
   */
  async uploadTrainerMaterial(file: File, title?: string): Promise<LearningMaterialResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return apiClient.post<LearningMaterialResponse>('/ai-assessments/trainer/materials/upload', formData);
  }

  /**
   * List official assessment materials uploaded by the authenticated trainer (Part 10F).
   */
  async getTrainerMaterials(): Promise<LearningMaterialResponse[]> {
    return apiClient.get<LearningMaterialResponse[]>('/ai-assessments/trainer/materials');
  }

  /**
   * Get specific trainer assessment material by ID (Part 10F).
   */
  async getTrainerMaterial(materialId: string): Promise<LearningMaterialResponse> {
    return apiClient.get<LearningMaterialResponse>(`/ai-assessments/trainer/materials/${materialId}`);
  }

  /**
   * Delete trainer assessment material by ID (Part 10F).
   */
  async deleteTrainerMaterial(materialId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/ai-assessments/trainer/materials/${materialId}`);
  }

  /**
   * Synthesize official assessment questions from trainer-owned ready material (Part 10G).
   */
  async generateTrainerAssessment(
    materialId: string,
    params?: TrainerAssessmentGenerateRequest
  ): Promise<TrainerAssessmentDraftResponse> {
    return apiClient.post<TrainerAssessmentDraftResponse>(
      `/ai-assessments/trainer/materials/${materialId}/generate-assessment`,
      params || {}
    );
  }

  /**
   * Retrieve generated draft assessment preview (Part 10G).
   */
  async getTrainerDraftAssessment(assessmentId: string): Promise<TrainerAssessmentDraftResponse> {
    return apiClient.get<TrainerAssessmentDraftResponse>(
      `/ai-assessments/trainer/drafts/${assessmentId}`
    );
  }

  /**
   * List all draft assessments belonging to the authenticated trainer (Part 10H).
   */
  async getTrainerDrafts(): Promise<TrainerDraftSummaryItem[]> {
    return apiClient.get<TrainerDraftSummaryItem[]>('/ai-assessments/trainer/drafts');
  }

  /**
   * Save draft assessment changes without publishing (Part 10H).
   */
  async saveTrainerDraft(
    assessmentId: string,
    payload: TrainerDraftSaveRequest
  ): Promise<TrainerAssessmentDraftResponse> {
    return apiClient.put<TrainerAssessmentDraftResponse>(
      `/ai-assessments/trainer/drafts/${assessmentId}`,
      payload
    );
  }

  /**
   * Validate and publish draft assessment (Part 10H).
   */
  async publishTrainerDraft(assessmentId: string): Promise<TrainerAssessmentDraftResponse> {
    return apiClient.post<TrainerAssessmentDraftResponse>(
      `/ai-assessments/trainer/drafts/${assessmentId}/publish`
    );
  }

  /**
   * Add a new question to a draft assessment (Part 10H).
   */
  async addDraftQuestion(
    assessmentId: string,
    question: TrainerDraftQuestionUpdate
  ): Promise<TrainerGeneratedQuestionPreview> {
    return apiClient.post<TrainerGeneratedQuestionPreview>(
      `/ai-assessments/trainer/drafts/${assessmentId}/questions`,
      question
    );
  }

  /**
   * Delete a question from a draft assessment (Part 10H).
   */
  async deleteDraftQuestion(
    assessmentId: string,
    questionId: string
  ): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/ai-assessments/trainer/drafts/${assessmentId}/questions/${questionId}`
    );
  }

  /**
   * Retrieve extracted content analysis metrics.
   */
  async getAnalysis(materialId: string): Promise<MaterialAnalysisResponse> {
    return apiClient.get<MaterialAnalysisResponse>(`/ai-assessments/materials/${materialId}/analysis`);
  }

  /**
   * Synthesize candidate assessment questions from processed document.
   */
  async generateQuestions(params: {
    material_id: string;
    number_of_questions: number;
    difficulty?: string;
    question_type?: string;
    competency_id?: string;
    language?: string;
  }): Promise<GeneratedQuestionResponse[]> {
    const res = await apiClient.post<{ questions: GeneratedQuestionResponse[]; total_generated: number }>(
      '/ai-assessments/generate',
      params
    );
    return res.questions || [];
  }

  /**
   * Synthesize learner practice MCQs from uploaded learner material (Part 10C-1 endpoint).
   */
  async generatePracticeQuiz(
    materialId: string,
    params?: {
      number_of_questions?: number;
      difficulty?: string;
      question_type?: string;
      language?: string;
    }
  ): Promise<GeneratedQuestionsResponse> {
    return apiClient.post<GeneratedQuestionsResponse>(
      `/ai-assessments/materials/${materialId}/generate-practice-quiz`,
      params || {}
    );
  }

  /**
   * Submit personal practice quiz answers for server-side evaluation (Part 10D).
   */
  async submitPracticeQuiz(
    materialId: string,
    payload: PracticeQuizSubmitRequest
  ): Promise<PracticeQuizResultResponse> {
    return apiClient.post<PracticeQuizResultResponse>(
      `/ai-assessments/materials/${materialId}/submit-practice-quiz`,
      payload
    );
  }

  /**
   * Retrieve previous practice quiz attempt review result (Part 10D).
   */
  async getPracticeQuizResult(attemptId: string): Promise<PracticeQuizResultResponse> {
    return apiClient.get<PracticeQuizResultResponse>(
      `/ai-assessments/practice-quiz/${attemptId}`
    );
  }

  /**
   * List staged questions for a material.
   */
  async getQuestions(materialId: string, status?: string): Promise<GeneratedQuestionResponse[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await apiClient.get<{ questions: GeneratedQuestionResponse[] }>(
      `/ai-assessments/materials/${materialId}/questions${qs}`
    );
    return res.questions || [];
  }

  /**
   * Edit staged question.
   */
  async updateQuestion(questionId: string, data: Partial<GeneratedQuestionResponse>): Promise<GeneratedQuestionResponse> {
    return apiClient.put<GeneratedQuestionResponse>(`/ai-assessments/questions/${questionId}`, data);
  }

  /**
   * Approve staged question.
   */
  async approveQuestion(questionId: string): Promise<GeneratedQuestionResponse> {
    return apiClient.post<GeneratedQuestionResponse>(`/ai-assessments/questions/${questionId}/approve`);
  }

  /**
   * Reject staged question.
   */
  async rejectQuestion(questionId: string): Promise<GeneratedQuestionResponse> {
    return apiClient.post<GeneratedQuestionResponse>(`/ai-assessments/questions/${questionId}/reject`);
  }

  /**
   * Regenerate single replacement question.
   */
  async regenerateQuestion(questionId: string): Promise<GeneratedQuestionResponse> {
    return apiClient.post<GeneratedQuestionResponse>(`/ai-assessments/questions/${questionId}/regenerate`);
  }

  /**
   * Convert approved questions into an official Part 6 Assessment in DRAFT status.
   */
  async createAssessment(data: {
    material_id: string;
    title: string;
    description?: string;
    instructions?: string;
    duration_minutes?: number;
    difficulty?: string;
    question_ids?: string[];
  }): Promise<AssessmentResponse> {
    return apiClient.post<AssessmentResponse>('/ai-assessments/create-assessment', data);
  }

  /**
   * Generate or retrieve AI learning feedback and weak-topic analysis for a practice attempt (Part 10E).
   */
  async getPracticeQuizFeedback(attemptId: string, regenerate: boolean = false): Promise<PracticeFeedbackResponse> {
    const query = regenerate ? '?regenerate=true' : '';
    return apiClient.post<PracticeFeedbackResponse>(`/ai-assessments/practice-quiz/${attemptId}/feedback${query}`);
  }

  /**
   * Retrieve cached practice quiz AI feedback (Part 10E).
   */
  async getCachedPracticeQuizFeedback(attemptId: string): Promise<PracticeFeedbackResponse> {
    return apiClient.get<PracticeFeedbackResponse>(`/ai-assessments/practice-quiz/${attemptId}/feedback`);
  }
}

export const aiAssessmentService = new AIAssessmentService();
