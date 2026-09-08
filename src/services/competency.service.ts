/**
 * Competency Management API Service
 */

import { apiClient } from '@/lib/api-client';
import { CompetencyResponse, UserCompetencyResponse } from '@/types/api';

class CompetencyService {
  /**
   * Retrieve caller's evaluated competency proficiencies.
   */
  async getMyCompetencies(): Promise<UserCompetencyResponse[]> {
    return apiClient.get<UserCompetencyResponse[]>('/competencies/me');
  }

  /**
   * Retrieve system catalog of competencies.
   */
  async getAllCompetencies(params?: {
    domain?: string;
    category?: string;
    search?: string;
  }): Promise<CompetencyResponse[]> {
    const query = new URLSearchParams();
    if (params?.domain && params.domain !== 'All') query.set('domain', params.domain);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    const endpoint = qs ? `/competencies?${qs}` : '/competencies';
    return apiClient.get<CompetencyResponse[]>(endpoint);
  }
}

export const competencyService = new CompetencyService();
