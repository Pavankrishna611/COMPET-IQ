'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Role, User } from '@/types';
import { authService } from '@/services/auth.service';
import { onboardingService } from '@/services/onboarding.service';
import { authStorage } from '@/lib/auth-storage';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const navigateForRole = useCallback(async (targetRole: Role) => {
    if (targetRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (targetRole === 'trainer') {
      router.push('/trainer/dashboard');
    } else if (targetRole === 'learner') {
      try {
        const status = await onboardingService.getStatus();
        if (status.profile_completed && status.onboarding_completed) {
          router.push('/learner/dashboard');
        } else {
          router.push('/onboarding');
        }
      } catch {
        router.push('/onboarding');
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
    } catch (err) {
      console.warn('Could not refresh user session from backend:', err);
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
          authStorage.setStoredUser(adapted);
          authStorage.setStoredRole(adapted.role);
        } catch {
          // Token expired or invalid
          authStorage.clearAuth();
          setCurrentUser(null);
          setRole(null);
        }
      } else {
        authStorage.clearAuth();
        setRole(null);
        setCurrentUser(null);
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
      await authService.login({
        email: officialIdOrEmail,
        password,
      });

      const apiUser = await authService.getMe();
      const adapted = authService.adaptUserResponse(apiUser);

      setCurrentUser(adapted);
      setRole(adapted.role);
      authStorage.setStoredUser(adapted);
      authStorage.setStoredRole(adapted.role);

      await navigateForRole(adapted.role);
      return true;
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Role login redirect helper
   */
  const loginAsRole = async (selectedRole: Role): Promise<void> => {
    router.push('/login');
  };

  const logout = () => {
    authService.logout();
    authStorage.clearAuth();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('competiq_onboarding_completed');
    }
    setRole(null);
    setCurrentUser(null);
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
        isDemoMode: false,
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
