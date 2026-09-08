/**
 * Course Catalog API Service
 */

import { apiClient } from '@/lib/api-client';
import { CourseResponse } from '@/types/api';

class CourseService {
  /**
   * List and filter courses.
   */
  async getCourses(params?: {
    provider?: string;
    domain?: string;
    difficulty?: string;
    search?: string;
  }): Promise<CourseResponse[]> {
    const query = new URLSearchParams();
    if (params?.provider && params.provider !== 'all') query.set('provider', params.provider);
    if (params?.domain && params.domain !== 'all') query.set('domain', params.domain);
    if (params?.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    const endpoint = qs ? `/courses?${qs}` : '/courses';
    return apiClient.get<CourseResponse[]>(endpoint);
  }

  /**
   * Retrieve full details and prerequisites for a specific course.
   */
  async getCourseDetails(courseId: string): Promise<CourseResponse> {
    return apiClient.get<CourseResponse>(`/courses/${courseId}`);
  }
}

export const courseService = new CourseService();
