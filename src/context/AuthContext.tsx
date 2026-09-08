'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Role, User } from '@/types';
import { mockUsers } from '@/data/users';

export interface AuthContextType {
  role: Role | null;
  currentUser: User | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  loginAsRole: (role: Role) => void;
  loginWithCredentials: (officialId: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'competiq_role';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Load persisted demo session on mount
  useEffect(() => {
    try {
      const storedRole = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (storedRole && mockUsers[storedRole]) {
        setRole(storedRole);
        setCurrentUser(mockUsers[storedRole]);
      }
    } catch {
      // localStorage may fail in restricted/private modes
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const loginAsRole = (selectedRole: Role) => {
    const user = mockUsers[selectedRole];
    setRole(selectedRole);
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY, selectedRole);
    } catch {}

    // Navigate to role-specific entry point
    if (selectedRole === 'learner') {
      router.push('/learner/dashboard');
    } else if (selectedRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (selectedRole === 'trainer') {
      router.push('/trainer/assessment-generator');
    }
  };

  const loginWithCredentials = (officialId: string, _password: string): boolean => {
    // Default mock credential sign in logs in as Learner (Arjun Kumar)
    loginAsRole('learner');
    return true;
  };

  const logout = () => {
    setRole(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        currentUser,
        user: currentUser,
        isAuthenticated: Boolean(role && currentUser),
        isLoading: !isLoaded,
        isDemoMode: true,
        loginAsRole,
        loginWithCredentials,
        logout,
      }}
    >
      {isLoaded ? children : null}
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
