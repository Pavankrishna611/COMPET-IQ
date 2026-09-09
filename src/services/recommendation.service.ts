/**
 * Course Recommendations & Interested Courses API Service (Part 9E)
 */

import { apiClient } from '@/lib/api-client';
import {
  CourseRecommendationResponse,
  InterestedCourseResponse,
  LearningPathItemResponse,
} from '@/types/api';

class RecommendationService {
  /**
   * Fetch dynamically calculated course recommendations tailored to active skill gaps.
   */
  async getMyRecommendations(limit: number = 10): Promise<CourseRecommendationResponse[]> {
    return apiClient.get<CourseRecommendationResponse[]>(`/recommendations/me?limit=${limit}`);
  }

  /**
   * Fetch all courses marked as interested by the learner.
   */
  async getInterestedCourses(): Promise<InterestedCourseResponse[]> {
    return apiClient.get<InterestedCourseResponse[]>('/recommendations/interested');
  }

  /**
   * Bookmark / mark a course as interested. Does NOT auto-enroll the learner.
   */
  async markCourseInterested(courseId: string): Promise<InterestedCourseResponse> {
    return apiClient.post<InterestedCourseResponse>(`/recommendations/interested/${courseId}`);
  }

  /**
   * Remove a course from the learner's interested list.
   */
  async removeCourseInterested(courseId: string): Promise<{ status: string; message: string }> {
    return apiClient.delete<{ status: string; message: string }>(`/recommendations/interested/${courseId}`);
  }

  /**
   * Add a course to the learner's active learning path without duplicates.
   */
  async addToLearningPath(courseId: string): Promise<LearningPathItemResponse> {
    return apiClient.post<LearningPathItemResponse>(`/learning-paths/add-course/${courseId}`);
  }
}

export const recommendationService = new RecommendationService();
