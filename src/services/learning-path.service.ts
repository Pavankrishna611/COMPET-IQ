/**
 * Personalized Learning Path API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  LearningPathGenerationResponse,
  LearningPathItemResponse,
  LearningPathResponse,
  WatchTimeStatsResponse,
} from '@/types/api';

class LearningPathService {
  /**
   * Retrieve caller's currently active personalized learning path.
   */
  async getMyActiveLearningPath(): Promise<LearningPathResponse> {
    return apiClient.get<LearningPathResponse>('/learning-paths/me');
  }

  /**
   * Retrieve caller's real calculated watch time and learning progress.
   */
  async getMyWatchTime(): Promise<WatchTimeStatsResponse> {
    return apiClient.get<WatchTimeStatsResponse>('/learning-paths/watch-time');
  }

  /**
   * Generate or recalculate personalized learning path based on updated competency profile.
   */
  async generateLearningPath(force: boolean = false): Promise<LearningPathGenerationResponse> {
    return apiClient.post<LearningPathGenerationResponse>(`/learning-paths/generate?force=${force}`);
  }

  /**
   * Update completion status for an individual learning step.
   */
  async updateItemStatus(
    itemId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  ): Promise<LearningPathItemResponse> {
    return apiClient.patch<LearningPathItemResponse>(`/learning-paths/items/${itemId}`, { status });
  }

  /**
   * Add a course to the learner's active learning path.
   */
  async addCourseToLearningPath(courseId: string): Promise<LearningPathItemResponse> {
    return apiClient.post<LearningPathItemResponse>(`/learning-paths/add-course/${courseId}`);
  }
}

export const learningPathService = new LearningPathService();
