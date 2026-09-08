/**
 * Centralized Application Configuration
 * Handles environment-driven API URLs with local development fallbacks.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  apiV1Url: API_V1_URL,
  requestTimeoutMs: 15000,
  tokenStorageKey: 'competiq_access_token',
  roleStorageKey: 'competiq_role',
  userStorageKey: 'competiq_user',
};
