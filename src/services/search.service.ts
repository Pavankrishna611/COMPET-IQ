/**
 * Unified Global Search API Service
 */

import { apiClient } from '@/lib/api-client';
import { SearchResponse } from '@/types/api';

class SearchService {
  /**
   * Execute global unified search across courses, competencies, assessments, learning paths, and resources.
   */
  async search(
    query: string,
    options?: {
      category?: string;
      limit?: number;
    }
  ): Promise<SearchResponse> {
    const trimmed = (query || '').trim();
    if (!trimmed || trimmed.length < 2) {
      return {
        query: trimmed,
        total_results: 0,
        results: [],
        category_counts: {},
      };
    }

    const params = new URLSearchParams();
    params.set('q', trimmed);
    if (options?.category && options.category !== 'all') {
      params.set('category', options.category);
    }
    if (options?.limit) {
      params.set('limit', String(options.limit));
    }

    return apiClient.get<SearchResponse>(`/search?${params.toString()}`);
  }
}

export const searchService = new SearchService();
