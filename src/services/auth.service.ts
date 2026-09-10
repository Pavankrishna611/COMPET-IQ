/**
 * Authentication and User Profile API Service
 */

import { apiClient } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';
import { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '@/types/api';
import { User, Role } from '@/types';

class AuthService {
  /**
   * Register a new public user account with LEARNER role.
   */
  async register(data: RegisterRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/auth/register', data, { skipAuth: true });
  }

  /**
   * Authenticate user with official ID / email and password.
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', credentials, { skipAuth: true });
    if (response.access_token) {
      authStorage.setToken(response.access_token);
      if (response.user.role) {
        authStorage.setStoredRole(response.user.role.toLowerCase() as Role);
      }
    }
    return response;
  }

  /**
   * Fetch profile of currently authenticated user.
   */
  async getMe(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/auth/me');
  }

  /**
   * Request a 6-digit verification code sent to Gmail for password reset.
   */
  async requestPasswordReset(email: string): Promise<{ message: string; email?: string; code_preview?: string }> {
    return apiClient.post('/auth/forgot-password/request', { email }, { skipAuth: true });
  }

  /**
   * Verify the 6-digit verification code received via email.
   */
  async verifyResetCode(email: string, code: string): Promise<{ message: string; email?: string; reset_token?: string }> {
    return apiClient.post('/auth/forgot-password/verify', { email, code }, { skipAuth: true });
  }

  /**
   * Submit new password creation after verifying reset code.
   */
  async resetPassword(email: string, resetToken: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password/reset', {
      email,
      reset_token: resetToken,
      new_password: newPassword,
    }, { skipAuth: true });
  }

  /**
   * Check backend service health.
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    return apiClient.get('/health', { skipAuth: true, timeoutMs: 5000 });
  }

  /**
   * Adapter converting backend UserResponse to frontend User interface.
   */
  adaptUserResponse(apiUser: UserResponse): User {
    const roleName = (apiUser.role?.name || 'LEARNER').toLowerCase() as Role;
    return {
      id: apiUser.id,
      name: apiUser.full_name,
      email: apiUser.email,
      designation: apiUser.designation || 'Statistical Officer',
      department: apiUser.department?.name || 'Survey Design and Research Division (SDRD)',
      cadre: (apiUser.department?.code === 'SDRD' ? 'SSS' : 'ISS') as any,
      role: roleName,
      employeeId: apiUser.official_id,
      joinedDate: apiUser.created_at?.split('T')[0] || '2021-07-15',
    };
  }

  logout(): void {
    authStorage.clearAuth();
  }
}

export const authService = new AuthService();
