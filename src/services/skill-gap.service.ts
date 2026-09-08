/**
 * Skill Gap Analysis API Service
 */

import { apiClient } from '@/lib/api-client';
import { SkillGapAnalysisResponse } from '@/types/api';

class SkillGapService {
  /**
   * Calculate and retrieve active skill gap report for authenticated learner.
   */
  async getMySkillGaps(): Promise<SkillGapAnalysisResponse> {
    return apiClient.get<SkillGapAnalysisResponse>('/skill-gaps/me');
  }

  /**
   * Admin: Retrieve organizational skill gap summary across departments.
   */
  async getOrganizationSummary(params?: {
    department_id?: string;
    role_id?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.department_id) query.set('department_id', params.department_id);
    if (params?.role_id) query.set('role_id', params.role_id);

    const qs = query.toString();
    const endpoint = qs ? `/skill-gaps/organization/summary?${qs}` : '/skill-gaps/organization/summary';
    return apiClient.get(endpoint);
  }
}

export const skillGapService = new SkillGapService();
