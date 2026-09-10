'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Input, Button } from '@/components/ui';
import { Logo, LandingBackground } from '@/components/common';
import {
  Lock,
  Mail,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

export default function LoginPage() {
  const { loginWithCredentials } = useAuth();
  const [officialId, setOfficialId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    const emailOrId = officialId.trim();
    const pwd = password;

    if (!emailOrId || !pwd) {
      setErrorMessage('Please enter your official ID / email and password.');
      setIsLoading(false);
      return;
    }

    try {
      await loginWithCredentials(emailOrId, pwd);
    } catch (err: any) {
      const msg = err.detail?.error?.message || err.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden flex flex-col justify-center items-center p-4 sm:p-6 md:p-10 selection:bg-teal selection:text-white">
      {/* =========================================================================
          BACKGROUND LAYER: Interactive AeroShards wind sculpture foil simulation
         ========================================================================= */}
      <LandingBackground />

      {/* =========================================================================
          FOREGROUND UI: Centered Glassmorphic Login Card
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-lg mx-auto pointer-events-auto my-auto">
        <div className="w-full bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl shadow-2xl p-6 sm:p-9 transition-all">
          {/* Top Logo / Identity */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="inline-block mb-3 hover:opacity-95 transition-opacity">
              <Logo size="lg" className="h-10 w-auto" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Welcome to COMPETIQ
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Sign in to access your personalized learning intelligence.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-critical-light border border-critical/30 rounded-btn text-xs text-critical font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}
            <Input
              label="Official ID / Email"
              placeholder="e.g. your.email@mospi.gov.in"
              value={officialId}
              onChange={(e) => setOfficialId(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-text-muted" />}
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your official password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-text-muted" />}
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                />
                Remember me
              </label>

              <button
                type="button"
                onClick={() => alert('Official password recovery: Contact your NSSTA/MoSPI IT administrator.')}
                className="text-primary hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit & SSO */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full font-semibold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </div>

            {/* Registration Entry Point */}
            <div className="pt-2 text-center text-xs text-text-secondary">
              <span>New to COMPETIQ? </span>
              <Link
                href="/register"
                className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors ml-1"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
