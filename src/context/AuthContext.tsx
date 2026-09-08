'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Role, User } from '@/types';
import { authService } from '@/services/auth.service';
import { onboardingService } from '@/services/onboarding.service';
import { authStorage } from '@/lib/auth-storage';
import { mockUsers } from '@/data/users';

export interface AuthContextType {
  role: Role | null;
  currentUser: User | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  loginAsRole: (role: Role) => Promise<void>;
  loginWithCredentials: (officialIdOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Seeded credentials for instant 1-click role logins
const DEMO_CREDENTIALS: Record<Role, { email: string; pass: string }> = {
  learner: { email: 'arjun.kumar@mospi.gov.in', pass: 'demo123' },
  admin: { email: 'priya.sharma@mospi.gov.in', pass: 'demo123' },
  trainer: { email: 'rahul.verma@nssta.gov.in', pass: 'demo123' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const router = useRouter();

  const navigateForRole = useCallback(async (targetRole: Role, isDemoAccount = false) => {
    if (targetRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (targetRole === 'trainer') {
      router.push('/trainer/assessment-generator');
    } else if (targetRole === 'learner') {
      if (isDemoAccount) {
        router.push('/learner/dashboard');
      } else {
        try {
          const status = await onboardingService.getStatus();
          if (status.onboarding_completed) {
            router.push('/learner/dashboard');
          } else {
            router.push('/onboarding/profile');
          }
        } catch {
          // If onboarding status check fails or profile doesn't exist yet, redirect to onboarding profile
          router.push('/onboarding/profile');
        }
      }
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await authService.getMe();
      const adapted = authService.adaptUserResponse(apiUser);
      setCurrentUser(adapted);
      setRole(adapted.role);
      authStorage.setStoredUser(adapted);
      authStorage.setStoredRole(adapted.role);
      setIsDemoMode(false);
    } catch (err) {
      console.warn('Could not refresh user session from backend:', err);
      // If token expired, clear auth
      authStorage.clearAuth();
      setCurrentUser(null);
      setRole(null);
    }
  }, []);

  // Restore authenticated session on application mount
  useEffect(() => {
    async function restoreSession() {
      const token = authStorage.getToken();
      if (token) {
        try {
          const apiUser = await authService.getMe();
          const adapted = authService.adaptUserResponse(apiUser);
          setCurrentUser(adapted);
          setRole(adapted.role);
          setIsDemoMode(false);
        } catch {
          // Token expired or invalid
          authStorage.clearAuth();
          setCurrentUser(null);
          setRole(null);
        }
      } else {
        // Check if there was a stored fallback role
        const storedRole = authStorage.getStoredRole();
        const storedUser = authStorage.getStoredUser();
        if (storedRole && storedUser) {
          setRole(storedRole);
          setCurrentUser(storedUser);
          setIsDemoMode(true);
        }
      }
      setIsLoading(false);
    }

    restoreSession();
  }, []);

  /**
   * Log in using real credentials against POST /api/v1/auth/login.
   */
  const loginWithCredentials = async (
    officialIdOrEmail: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const tokenRes = await authService.login({
        email: officialIdOrEmail,
        password,
      });

      const apiUser = await authService.getMe();
      const adapted = authService.adaptUserResponse(apiUser);

      setCurrentUser(adapted);
      setRole(adapted.role);
      setIsDemoMode(false);
      authStorage.setStoredUser(adapted);

      const isDemo =
        officialIdOrEmail.toLowerCase() === 'arjun.kumar@mospi.gov.in' ||
        officialIdOrEmail.trim() === 'SSS-2021-0892';

      await navigateForRole(adapted.role, isDemo);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 1-Click Role Login:
   * Attempts real backend authentication with seeded credentials.
   * If backend is offline, falls back to demo mode safely.
   */
  const loginAsRole = async (selectedRole: Role): Promise<void> => {
    setIsLoading(true);
    const creds = DEMO_CREDENTIALS[selectedRole];

    try {
      await authService.login({
        email: creds.email,
        password: creds.pass,
      });

      const apiUser = await authService.getMe();
      const adapted = authService.adaptUserResponse(apiUser);

      setCurrentUser(adapted);
      setRole(adapted.role);
      setIsDemoMode(false);
      authStorage.setStoredUser(adapted);

      await navigateForRole(adapted.role, true);
    } catch (err) {
      console.warn('Backend authentication unavailable for 1-click role. Falling back to demo mode:', err);
      // Fallback for offline development
      const mockUser = mockUsers[selectedRole];
      setRole(selectedRole);
      setCurrentUser(mockUser);
      setIsDemoMode(true);
      authStorage.setStoredRole(selectedRole);
      authStorage.setStoredUser(mockUser);

      await navigateForRole(selectedRole, true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setRole(null);
    setCurrentUser(null);
    setIsDemoMode(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentUser,
        user: currentUser,
        isAuthenticated: Boolean(role && currentUser),
        isLoading,
        isDemoMode,
        loginAsRole,
        loginWithCredentials,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
