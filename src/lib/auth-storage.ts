/**
 * Authentication Storage Utility
 * Manages JWT access tokens and authenticated session state.
 *
 * NOTE FOR PRODUCTION:
 * For initial development and pairing, tokens are stored in browser localStorage.
 * For production deployment, session tokens should be transitioned to HttpOnly,
 * SameSite=Strict cookies with secure HTTPS transmission.
 */

import { APP_CONFIG } from './config';
import { User, Role } from '@/types';

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(APP_CONFIG.tokenStorageKey);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(APP_CONFIG.tokenStorageKey, token);
    } catch (e) {
      console.warn('Unable to persist authentication token:', e);
    }
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(APP_CONFIG.tokenStorageKey);
    } catch {}
  },

  getStoredRole(): Role | null {
    if (typeof window === 'undefined') return null;
    try {
      const role = localStorage.getItem(APP_CONFIG.roleStorageKey);
      if (role === 'learner' || role === 'admin' || role === 'trainer') {
        return role;
      }
      return null;
    } catch {
      return null;
    }
  },

  setStoredRole(role: Role): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(APP_CONFIG.roleStorageKey, role);
    } catch {}
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(APP_CONFIG.userStorageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user: User): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(APP_CONFIG.userStorageKey, JSON.stringify(user));
    } catch {}
  },

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(APP_CONFIG.tokenStorageKey);
      localStorage.removeItem(APP_CONFIG.roleStorageKey);
      localStorage.removeItem(APP_CONFIG.userStorageKey);
    } catch {}
  },
};
