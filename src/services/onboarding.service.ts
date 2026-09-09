/**
 * Onboarding and User Profile API Service (Part 9)
 */

import { apiClient } from '@/lib/api-client';
import {
  AcceptCompetenciesRequest,
  AcceptCompetenciesResponse,
  AvailableCompetenciesResponse,
  BulkSkillDeclarationRequest,
  CompetencyEvaluationResponse,
  OnboardingStatusResponse,
  ProfileAnalysisRequest,
  ProfileCreate,
  ProfileResponse,
  ProfileUpdate,
  SkillDeclarationResponse,
  SuggestedCompetencyResponse,
} from '@/types/api';

class OnboardingService {
  /**
   * Fetch current onboarding progression step and actionable guidance.
   */
  async getStatus(): Promise<OnboardingStatusResponse> {
    return apiClient.get<OnboardingStatusResponse>('/onboarding/status');
  }

  /**
   * Fetch the current authenticated user's professional profile.
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>('/onboarding/profile/me');
  }

  /**
   * Create a new professional profile for the authenticated user.
   */
  async createProfile(data: ProfileCreate): Promise<ProfileResponse> {
    return apiClient.post<ProfileResponse>('/onboarding/profile', data);
  }

  /**
   * Update the authenticated user's professional profile.
   */
  async updateProfile(data: ProfileUpdate): Promise<ProfileResponse> {
    return apiClient.put<ProfileResponse>('/onboarding/profile/me', data);
  }

  /**
   * Save (create or update) the authenticated user's professional profile.
   */
  async saveProfile(data: ProfileCreate): Promise<ProfileResponse> {
    try {
      return await this.createProfile(data);
    } catch (err: any) {
      if (
        err.status === 400 ||
        (typeof err.detail === 'string' && err.detail.toLowerCase().includes('already exists'))
      ) {
        return await this.updateProfile(data as ProfileUpdate);
      }
      throw err;
    }
  }

  /**
   * Fetch all available competencies grouped by domain for skill selection.
   */
  async getAvailableCompetencies(): Promise<AvailableCompetenciesResponse> {
    return apiClient.get<AvailableCompetenciesResponse>('/onboarding/competencies');
  }

  /**
   * Submit self-assessed skill declarations in bulk during onboarding.
   */
  async declareSkills(data: BulkSkillDeclarationRequest): Promise<SkillDeclarationResponse[]> {
    return apiClient.post<SkillDeclarationResponse[]>('/onboarding/skills', data);
  }

  /**
   * Fetch caller's own declared skills.
   */
  async getMySkills(): Promise<SkillDeclarationResponse[]> {
    return apiClient.get<SkillDeclarationResponse[]>('/onboarding/skills/me');
  }

  /**
   * AI Analysis of professional profile to suggest relevant competencies from framework (Part 9C).
   */
  async analyzeProfile(data?: ProfileAnalysisRequest): Promise<SuggestedCompetencyResponse[]> {
    return apiClient.post<SuggestedCompetencyResponse[]>('/onboarding/analyze-profile', data || {});
  }

  /**
   * Persist learner-accepted competencies into database during onboarding review (Part 9C).
   */
  async acceptCompetencies(data: AcceptCompetenciesRequest): Promise<AcceptCompetenciesResponse> {
    return apiClient.post<AcceptCompetenciesResponse>('/onboarding/accept-competencies', data);
  }

  /**
   * Fetch latest competency evaluation and skill gaps for authenticated user (Part 9D).
   */
  async getCompetencyEvaluation(): Promise<CompetencyEvaluationResponse> {
    return apiClient.get<CompetencyEvaluationResponse>('/onboarding/competency-evaluation');
  }

  /**
   * Trigger competency evaluation and skill gap calculation (Part 9D).
   */
  async evaluateCompetencies(): Promise<CompetencyEvaluationResponse> {
    return apiClient.post<CompetencyEvaluationResponse>('/onboarding/evaluate-competencies', {});
  }

  /**
   * Complete the onboarding process and mark onboarding_completed in profile.
   */
  async completeOnboarding(): Promise<OnboardingStatusResponse> {
    const res = await apiClient.post<OnboardingStatusResponse>('/onboarding/complete', {});
    if (typeof window !== 'undefined') {
      localStorage.setItem('competiq_onboarding_completed', 'true');
    }
    return res;
  }
}

export const onboardingService = new OnboardingService();
