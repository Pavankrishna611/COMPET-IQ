'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { authService } from '@/services/auth.service';
import { Input, Button, Modal } from '@/components/ui';
import { Logo, LandingBackground } from '@/components/common';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function LoginPage() {
  const { loginAsRole, loginWithCredentials } = useAuth();
  const [officialId, setOfficialId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot Password State Flow
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [codePreview, setCodePreview] = useState<string | null>(null);

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

  const handleRoleSelect = async (role: Role) => {
    setErrorMessage(null);
    try {
      await loginAsRole(role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not sign in with role.');
    }
  };

  // Open Forgot Password Modal
  const openForgotPasswordModal = () => {
    setForgotEmail(officialId.trim());
    setVerificationCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError(null);
    setCodePreview(null);
    setForgotStep('request');
    setIsForgotModalOpen(true);
  };

  // Step 1: Request Verification Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered Gmail or Official ID.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.requestPasswordReset(forgotEmail.trim());
      setCodePreview(res.code_preview || null);
      setForgotStep('verify');
    } catch (err: any) {
      setForgotError(err?.message || 'Could not send verification code. Please verify your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setForgotError('Please enter the full 6-digit verification code.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.verifyResetCode(forgotEmail.trim(), verificationCode.trim());
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotStep('reset');
      } else {
        setForgotError('Verification failed. Invalid token received.');
      }
    } catch (err: any) {
      setForgotError(err?.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!newPassword || newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setForgotError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setForgotLoading(true);
    try {
      await authService.resetPassword(forgotEmail.trim(), resetToken, newPassword);
      setForgotStep('success');
      setOfficialId(forgotEmail.trim());
      setPassword(newPassword);
    } catch (err: any) {
      setForgotError(err?.message || 'Could not update password. Session may have expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden flex flex-col justify-center items-center p-4 sm:p-6 md:p-10 selection:bg-teal selection:text-white">
      {/* BACKGROUND LAYER */}
      <LandingBackground />

      {/* FOREGROUND UI: Centered Glassmorphic Login Card */}
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
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <Input
              label="Official ID / Email"
              placeholder="e.g. arjun.kumar@mospi.gov.in"
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
                onClick={openForgotPasswordModal}
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
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

              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full font-semibold"
                leftIcon={<Fingerprint className="w-4 h-4 text-primary" />}
                onClick={() => loginAsRole('learner')}
              >
                Continue with SSO (Jan Parichay)
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

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-white/95 px-3 text-xs uppercase font-bold text-text-muted">
              OR
            </span>
          </div>

          {/* DEMO ACCESS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Demo Access
              </h3>
              <span className="text-[11px] text-teal font-semibold">
                Click a role to enter directly
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Role 1: Learner */}
              <button
                type="button"
                onClick={() => handleRoleSelect('learner')}
                className="p-3.5 rounded-btn border border-border bg-[#FBFDFE] hover:border-primary hover:bg-primary-light/40 transition-all text-left flex items-start gap-3.5 group"
              >
                <div className="w-9 h-9 rounded-btn bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      Learner • Arjun Kumar
                    </span>
                    <span className="text-[10px] text-text-muted font-medium uppercase">
                      Investigator
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                    View your competencies, skill gaps and personalized learning path.
                  </p>
                </div>
              </button>

              {/* Role 2: Administrator */}
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className="p-3.5 rounded-btn border border-border bg-[#FBFDFE] hover:border-primary hover:bg-primary-light/40 transition-all text-left flex items-start gap-3.5 group"
              >
                <div className="w-9 h-9 rounded-btn bg-teal-light text-teal flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal group-hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary group-hover:text-teal transition-colors">
                      Administrator • Dr. Priya Sharma
                    </span>
                    <span className="text-[10px] text-text-muted font-medium uppercase">
                      Director
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                    Monitor workforce competency, skill gaps and training analytics.
                  </p>
                </div>
              </button>

              {/* Role 3: Trainer */}
              <button
                type="button"
                onClick={() => handleRoleSelect('trainer')}
                className="p-3.5 rounded-btn border border-border bg-[#FBFDFE] hover:border-primary hover:bg-primary-light/40 transition-all text-left flex items-start gap-3.5 group"
              >
                <div className="w-9 h-9 rounded-btn bg-warning-light text-warning flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-warning group-hover:text-white transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary group-hover:text-warning transition-colors">
                      Trainer • Rahul Verma
                    </span>
                    <span className="text-[10px] text-text-muted font-medium uppercase">
                      Faculty
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                    Create competency-based assessments and quizzes.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FORGOT PASSWORD VERIFICATION & RESET MODAL
         ========================================================================= */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title={
          forgotStep === 'request'
            ? 'Reset Password'
            : forgotStep === 'verify'
            ? 'Enter Verification Code'
            : forgotStep === 'reset'
            ? 'Create New Password'
            : 'Password Reset Successful'
        }
        description={
          forgotStep === 'request'
            ? 'Enter your registered Gmail or Official ID to receive a 6-digit verification code.'
            : forgotStep === 'verify'
            ? `A 6-digit verification code was sent to ${forgotEmail}.`
            : forgotStep === 'reset'
            ? 'Verification code confirmed. Set a new password for your COMPETIQ account.'
            : 'Your account credentials have been updated.'
        }
      >
        {forgotError && (
          <div className="mb-4 p-3 bg-critical-light border border-critical/30 rounded-btn text-xs text-critical font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{forgotError}</span>
          </div>
        )}

        {/* STEP 1: REQUEST CODE */}
        {forgotStep === 'request' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <Input
              label="Official ID / Registered Gmail"
              placeholder="e.g. pavankrishna611@gmail.com or arjun.kumar@mospi.gov.in"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-text-muted" />}
              autoFocus
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={forgotLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Verification Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY CODE */}
        {forgotStep === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 bg-primary-light/40 border border-primary/20 rounded-btn text-xs text-text-primary space-y-1">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Verification Code Sent
              </div>
              <p className="text-text-secondary">
                Check your inbox at <strong className="text-text-primary">{forgotEmail}</strong> for the 6-digit code.
              </p>
              {codePreview && (
                <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Dev Verification Code:</span>
                  <span className="font-mono font-bold text-teal bg-teal-light px-2 py-0.5 rounded text-sm tracking-widest">
                    {codePreview}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 849201"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] text-lg font-mono font-bold py-2.5 px-3 rounded-btn border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setForgotStep('request')}
                className="text-xs text-primary hover:underline font-medium"
              >
                Change Email / Resend
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={forgotLoading}
                  rightIcon={<ShieldCheck className="w-4 h-4" />}
                >
                  Verify Code
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {forgotStep === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-teal-light/40 border border-teal/20 rounded-btn text-xs text-text-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal shrink-0" />
              <span>Verification confirmed. Please enter your new password below.</span>
            </div>

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters (1 uppercase, 1 lowercase, 1 number)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Key className="w-4 h-4 text-text-muted" />}
              autoFocus
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-text-muted" />}
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={forgotLoading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save New Password & Sign In
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {forgotStep === 'success' && (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-light text-teal flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-text-primary">
              Password Reset Complete!
            </h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Your new password has been updated and pre-filled in the login form. You can now sign in to your COMPETIQ account.
            </p>
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-full font-semibold"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
