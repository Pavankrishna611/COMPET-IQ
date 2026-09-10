/**
 * Centralized Application Configuration
 * Dynamically resolves API Base URL for Localhost, Railway, and Vercel.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : ''
    : 'http://127.0.0.1:8000');

export const API_V1_URL = API_BASE_URL ? `${API_BASE_URL}/api/v1` : '/api/v1';

export const APP_CONFIG = {
  apiBaseUrl: API_BASE_URL,
  apiV1Url: API_V1_URL,
  requestTimeoutMs: 15000,
  tokenStorageKey: 'competiq_access_token',
  roleStorageKey: 'competiq_role',
  userStorageKey: 'competiq_user',
  demoModeStorageKey: 'competiq_is_demo_mode',
};
