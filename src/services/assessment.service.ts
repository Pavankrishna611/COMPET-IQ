/**
 * Assessment Catalog API Service
 */

import { apiClient } from '@/lib/api-client';
import { AssessmentResponse } from '@/types/api';

class AssessmentService {
  /**
   * Retrieve catalog of assessments (Learners receive PUBLISHED assessments).
   */
  async getAssessments(params?: {
    status?: string;
    difficulty?: string;
  }): Promise<AssessmentResponse[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);

    const qs = query.toString();
    const endpoint = qs ? `/assessments?${qs}` : '/assessments';
    return apiClient.get<AssessmentResponse[]>(endpoint);
  }

  /**
   * Fetch full assessment details.
   */
  async getAssessment(assessmentId: string): Promise<AssessmentResponse> {
    return apiClient.get<AssessmentResponse>(`/assessments/${assessmentId}`);
  }

  /**
   * Trainer/Admin: Publish a draft assessment.
   */
  async publishAssessment(assessmentId: string): Promise<AssessmentResponse> {
    return apiClient.post<AssessmentResponse>(`/assessments/${assessmentId}/publish`);
  }
}

export const assessmentService = new AssessmentService();
