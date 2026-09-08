/**
 * Trainer AI Assessment Generator & Document Processing API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  AssessmentResponse,
  GeneratedQuestionResponse,
  LearningMaterialResponse,
  MaterialAnalysisResponse,
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
}

export const aiAssessmentService = new AIAssessmentService();
