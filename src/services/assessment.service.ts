/**
 * Assessment Catalog API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  AssessmentAssignRequest,
  AssessmentAssignResult,
  AssessmentAssignmentResponse,
  AssessmentResponse,
  AssignableLearnerResponse,
} from '@/types/api';

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

  /**
   * Trainer/Admin: Assign a published assessment to learners.
   */
  async assignAssessment(
    assessmentId: string,
    payload: AssessmentAssignRequest
  ): Promise<AssessmentAssignResult> {
    return apiClient.post<AssessmentAssignResult>(`/assessments/${assessmentId}/assign`, payload);
  }

  /**
   * Trainer/Admin: Retrieve existing assignments for an assessment.
   */
  async getAssessmentAssignments(
    assessmentId: string
  ): Promise<AssessmentAssignmentResponse[]> {
    return apiClient.get<AssessmentAssignmentResponse[]>(`/assessments/${assessmentId}/assignments`);
  }

  /**
   * Trainer/Admin: Fetch available learners to assign assessments.
   */
  async getAssignableLearners(): Promise<AssignableLearnerResponse[]> {
    return apiClient.get<AssignableLearnerResponse[]>('/assessments/learners/available');
  }
}

export const assessmentService = new AssessmentService();

