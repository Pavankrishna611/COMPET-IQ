/**
 * Onboarding and User Profile API Service (Part 9)
 */

import { apiClient } from '@/lib/api-client';
import {
  AvailableCompetenciesResponse,
  BulkSkillDeclarationRequest,
  OnboardingStatusResponse,
  ProfileCreate,
  ProfileResponse,
  ProfileUpdate,
  SkillDeclarationResponse,
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
}

export const onboardingService = new OnboardingService();
