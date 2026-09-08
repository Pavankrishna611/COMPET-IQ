/**
 * Course Recommendations API Service
 */

import { apiClient } from '@/lib/api-client';
import { CourseRecommendationResponse } from '@/types/api';

class RecommendationService {
  /**
   * Fetch dynamically calculated course recommendations tailored to active skill gaps.
   */
  async getMyRecommendations(limit: number = 10): Promise<CourseRecommendationResponse[]> {
    return apiClient.get<CourseRecommendationResponse[]>(`/recommendations/me?limit=${limit}`);
  }
}

export const recommendationService = new RecommendationService();
