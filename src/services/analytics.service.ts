/**
 * Administrative and Organization-Wide Analytics API Service
 */

import { apiClient } from '@/lib/api-client';
import {
  AIInsightsResponse,
  DashboardAnalyticsResponse,
  SkillGapAnalyticsResponse,
  TrainingAnalyticsResponse,
  WorkforceAnalyticsResponse,
} from '@/types/api';

class AnalyticsService {
  /**
   * Executive overview dashboard metrics (officer counts, average competency, critical gaps, department health).
   */
  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    return apiClient.get<DashboardAnalyticsResponse>('/analytics/dashboard');
  }

  /**
   * Workforce competency, assessment coverage, and cadre distributions.
   */
  async getWorkforceAnalytics(): Promise<WorkforceAnalyticsResponse> {
    return apiClient.get<WorkforceAnalyticsResponse>('/analytics/workforce');
  }

  /**
   * Organizational skill gap metrics and division-wise rankings.
   */
  async getSkillGapAnalytics(): Promise<SkillGapAnalyticsResponse> {
    return apiClient.get<SkillGapAnalyticsResponse>('/analytics/skill-gaps');
  }

  /**
   * Training engagement, pass rates, and popular course completions.
   */
  async getTrainingAnalytics(): Promise<TrainingAnalyticsResponse> {
    return apiClient.get<TrainingAnalyticsResponse>('/analytics/training');
  }

  /**
   * Data-driven explainable insights derived from organizational metrics.
   */
  async getInsights(): Promise<AIInsightsResponse> {
    return apiClient.get<AIInsightsResponse>('/analytics/insights');
  }
}

export const analyticsService = new AnalyticsService();
