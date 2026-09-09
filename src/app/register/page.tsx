'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button, Badge } from '@/components/ui';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Presentation,
  Shield,
  ShieldAlert,
  Building2,
  Briefcase,
} from 'lucide-react';

type RegistrationRole = 'learner' | 'trainer' | 'admin';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('learner');

  // Base user fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Trainer-specific fields
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [organization, setOrganization] = useState('');
  const [jobRole, setJobRole] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Field validation rules (aligned with backend UserRegister schema)
  const isFullNameValid = fullName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit;

  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password;

  // Trainer validation rules
  const isDesignationValid = designation.trim().length >= 2;
  const isDepartmentValid = department.trim().length >= 2;
  const isOrganizationValid = organization.trim().length >= 2;
  const isJobRoleValid = jobRole.trim().length >= 2;

  const getPasswordError = () => {
    if (!touched.password) return undefined;
    if (!hasMinLength) return 'Password must be at least 8 characters long.';
    if (!hasUpper) return 'Password must contain at least one uppercase letter.';
    if (!hasLower) return 'Password must contain at least one lowercase letter.';
    if (!hasDigit) return 'Password must contain at least one number.';
    return undefined;
  };

  const errors = {
    fullName: touched.fullName && !isFullNameValid ? 'Please enter your full name (minimum 2 characters).' : undefined,
    email: touched.email && !isEmailValid ? 'Please enter a valid official or personal email address.' : undefined,
    password: getPasswordError(),
    confirmPassword: touched.confirmPassword && !isConfirmPasswordValid ? 'Passwords do not match.' : undefined,
    designation: touched.designation && !isDesignationValid ? 'Please enter your designation.' : undefined,
    department: touched.department && !isDepartmentValid ? 'Please enter your department.' : undefined,
    organization: touched.organization && !isOrganizationValid ? 'Please enter your organization or institute.' : undefined,
    jobRole: touched.jobRole && !isJobRoleValid ? 'Please enter your job role or faculty title.' : undefined,
  };

  const isFormValid =
    selectedRole === 'learner'
      ? isFullNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid
      : selectedRole === 'trainer'
        ? isFullNameValid &&
        isEmailValid &&
        isPasswordValid &&
        isConfirmPasswordValid &&
        isDesignationValid &&
        isDepartmentValid &&
        isOrganizationValid &&
        isJobRoleValid
        : false;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleRoleChange = (role: RegistrationRole) => {
    setSelectedRole(role);
    setStatusMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || selectedRole === 'admin') return;

    const touchedFields: Record<string, boolean> = {
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    };

    if (selectedRole === 'trainer') {
      touchedFields.designation = true;
      touchedFields.department = true;
      touchedFields.organization = true;
      touchedFields.jobRole = true;
    }

    setTouched(touchedFields);

    if (!isFormValid) {
      setStatusMessage({
        type: 'error',
        text: 'Please ensure all required fields are filled correctly before proceeding.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (selectedRole === 'trainer') {
        // 1. Create trainer account with TRAINER role and trainer metadata
        await authService.register({
          full_name: fullName.trim(),
          email: normalizedEmail,
          password,
          confirm_password: confirmPassword,
          role: 'TRAINER',
          designation: designation.trim(),
          department: department.trim(),
          organization: organization.trim(),
          job_role: jobRole.trim(),
        });

        // 2. Authenticate the trainer
        await authService.login({
          email: normalizedEmail,
          password,
        });
        await refreshUser();

        // 3. Clear any existing local onboarding completion state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('competiq_onboarding_completed');
        }

        // 4. Redirect to trainer dashboard directly
        setStatusMessage({
          type: 'success',
          text: 'Trainer account created successfully! Redirecting to trainer dashboard...',
        });
        router.push('/trainer/dashboard');
      } else {
        // 1. Create learner account using existing backend (LEARNER role)
        await authService.register({
          full_name: fullName.trim(),
          email: normalizedEmail,
          password,
          confirm_password: confirmPassword,
          role: 'LEARNER',
        });

        // 2. Authenticate the learner using existing authentication system
        await authService.login({
          email: normalizedEmail,
          password,
        });
        await refreshUser();

        // 3. Clear any existing local onboarding completion state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('competiq_onboarding_completed');
        }

        // 4. Redirect to professional onboarding to fill in profile details
        setStatusMessage({
          type: 'success',
          text: 'Account created successfully! Redirecting to professional onboarding...',
        });
        router.push('/onboarding');
      }
    } catch (err: any) {
      let errorMsg = 'Registration could not be completed. Please try again.';

      if (err.detail?.error?.message) {
        errorMsg = err.detail.error.message;
      } else if (err.message && !err.message.startsWith('HTTP ')) {
        errorMsg = err.message;
      } else if (typeof err.detail === 'string') {
        errorMsg = err.detail;
      } else if (typeof err.detail?.detail === 'string') {
        errorMsg = err.detail.detail;
      } else if (Array.isArray(err.detail?.detail) && err.detail.detail.length > 0) {
        errorMsg = err.detail.detail[0].msg?.replace(/^Value error,\s*/i, '') || errorMsg;
      } else if (Array.isArray(err.detail) && err.detail.length > 0) {
        errorMsg = err.detail[0].msg?.replace(/^Value error,\s*/i, '') || errorMsg;
      } else if (err.message) {
        errorMsg = err.message;
      }

      if (errorMsg.toLowerCase().includes('already exists')) {
        errorMsg = 'A user with this email address already exists. Please click "Sign In" below.';
      }

      // Try parsing JSON if raw error string
      try {
        if (typeof errorMsg === 'string' && (errorMsg.startsWith('{') || errorMsg.startsWith('['))) {
          const parsed = JSON.parse(errorMsg);
          if (Array.isArray(parsed) && parsed[0]?.msg) {
            errorMsg = parsed[0].msg.replace(/^Value error,\s*/i, '');
          } else if (parsed?.detail) {
            errorMsg = typeof parsed.detail === 'string' ? parsed.detail : errorMsg;
          }
        }
      } catch { }

      if (err.isNetworkError || err.status === 502 || err.status === 503 || err.status === 504) {
        errorMsg = 'Backend service is currently unavailable. Please check your connection or verify that the server is running.';
      }

      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ====================================================
          LEFT SIDE — BRANDING SECTION (CONSISTENT WITH LOGIN)
         ==================================================== */}
      <div className="w-full lg:w-[48%] xl:w-[45%] bg-navy text-white flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r border-[#0E2E50]">
        {/* Subtle Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Wordmark & Identity */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-btn bg-teal flex items-center justify-center font-bold text-white text-base shadow-sm">
              CQ
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-white leading-none">
                COMPET<span className="text-teal">IQ</span>
              </span>
              <span className="text-[11px] text-[#A5C2DE] tracking-tight uppercase font-medium mt-1">
                India&apos;s Official Statistical System
              </span>
            </div>
          </div>

          <Badge variant="teal" size="sm" withDot className="mb-4">
            Skill Intelligence & Workforce Capability
          </Badge>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            Intelligent Competency. <br />
            <span className="text-[#A0DCD8]">Personalized Learning.</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#C7DCF0] mt-3 max-w-lg leading-relaxed">
            An AI-enabled skill intelligence platform that helps officials identify competency gaps,
            develop critical statistical skills, and follow personalized learning pathways.
          </p>
        </div>

        {/* Abstract Enterprise Visual: Competency Nodes, Analytics & Pathway */}
        <div className="relative z-10 my-8 py-6 px-6 rounded-panel bg-[#0F3256]/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 text-xs">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal" /> Competency Matrix Intelligence
            </span>
            <span className="text-[10px] text-teal font-mono bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
              Active Framework v2.6
            </span>
          </div>

          {/* SVG Vector Graphic (Nodes, Connections, Competency Levels) */}
          <svg className="w-full h-32" viewBox="0 0 380 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="30" x2="360" y2="30" stroke="#1B4E85" strokeDasharray="3 3" />
            <line x1="20" y1="65" x2="360" y2="65" stroke="#1B4E85" strokeDasharray="3 3" />
            <line x1="20" y1="100" x2="360" y2="100" stroke="#1B4E85" strokeDasharray="3 3" />

            <path d="M45 85 L120 40 L210 65 L290 25 L345 55" stroke="#0E9F9A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M45 85 L120 40 L210 65 L290 25 L345 55" stroke="#0E9F9A" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.15" />

            <path d="M45 55 L120 30 L210 45 L290 20 L345 25" stroke="#1769AA" strokeWidth="1.5" strokeDasharray="4 4" />

            <circle cx="45" cy="85" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="45" cy="85" r="3" fill="#FFFFFF" />
            <text x="30" y="112" fill="#8FB5D8" fontSize="9" fontWeight="600">Surveys</text>

            <circle cx="120" cy="40" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="120" cy="40" r="3" fill="#FFFFFF" />
            <text x="95" y="24" fill="#8FB5D8" fontSize="9" fontWeight="600">Nat. Accounts</text>

            <circle cx="210" cy="65" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="210" cy="65" r="3" fill="#FFFFFF" />
            <text x="185" y="90" fill="#8FB5D8" fontSize="9" fontWeight="600">R / Python</text>

            <circle cx="290" cy="25" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="290" cy="25" r="3" fill="#6B5DD3" />
            <text x="275" y="14" fill="#A0DCD8" fontSize="9" fontWeight="600">SAE Model</text>

            <circle cx="345" cy="55" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="345" cy="55" r="3" fill="#FFFFFF" />
            <text x="325" y="78" fill="#8FB5D8" fontSize="9" fontWeight="600">SDG Metrics</text>
          </svg>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
            <div>
              <span className="text-[10px] text-[#8FB5D8] block">Competency Profile</span>
              <strong className="text-xs text-white">84% Assessed</strong>
            </div>
            <div className="border-x border-white/10">
              <span className="text-[10px] text-[#8FB5D8] block">Skill Gap Resolution</span>
              <strong className="text-xs text-teal">2 Priority Gaps</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#8FB5D8] block">Personalized Path</span>
              <strong className="text-xs text-white">40% Complete</strong>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#8FB5D8]">
          <span>Ministry of Statistics & Programme Implementation</span>
          <span className="font-semibold text-white tracking-wider">Secure • Intelligent • Personalized</span>
        </div>
      </div>

      {/* ====================================================
          RIGHT SIDE — REGISTRATION CARD
         ==================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-lg bg-surface border border-border rounded-panel shadow-card p-6 sm:p-9">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Create your COMPETIQ account
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              {selectedRole === 'trainer'
                ? 'Register as an official instructor to create, assess, and manage courses.'
                : selectedRole === 'admin'
                  ? 'Institutional administration and security governance.'
                  : 'Begin your personalized competency and learning journey.'}
            </p>
          </div>

          {/* 1. Register As Role Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Register as
            </label>
            <div
              className="grid grid-cols-3 gap-2 p-1 bg-surface-muted/60 border border-border rounded-lg"
              role="group"
              aria-label="Register as role"
            >
              <button
                type="button"
                id="role-select-learner"
                onClick={() => handleRoleChange('learner')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 rounded-md text-xs font-semibold transition-all ${selectedRole === 'learner'
                  ? 'bg-white text-navy shadow-sm border border-border/80 font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                  }`}
                aria-pressed={selectedRole === 'learner'}
              >
                <GraduationCap className="w-4 h-4 text-teal shrink-0" />
                <span>Learner</span>
              </button>

              <button
                type="button"
                id="role-select-trainer"
                onClick={() => handleRoleChange('trainer')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 rounded-md text-xs font-semibold transition-all ${selectedRole === 'trainer'
                  ? 'bg-white text-navy shadow-sm border border-border/80 font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                  }`}
                aria-pressed={selectedRole === 'trainer'}
              >
                <Presentation className="w-4 h-4 text-primary shrink-0" />
                <span>Trainer</span>
              </button>

              <button
                type="button"
                id="role-select-admin"
                onClick={() => handleRoleChange('admin')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2.5 rounded-md text-xs font-semibold transition-all ${selectedRole === 'admin'
                  ? 'bg-white text-navy shadow-sm border border-border/80 font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                  }`}
                aria-pressed={selectedRole === 'admin'}
              >
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* 2. Admin Institutional Message (When Admin is selected) */}
          {selectedRole === 'admin' ? (
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-panel bg-amber-50/90 border border-amber-200 text-amber-900">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-amber-950">
                      Institutional Provisioning Required
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Admin accounts cannot be registered publicly. Please contact the system administrator or use existing admin credentials.
                    </p>
                    <p className="text-[11px] text-amber-800 leading-relaxed pt-1">
                      For institutional administration credentials, contact MoSPI IT Administration or your nodal security officer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/login" className="block w-full">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full font-semibold"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In as Admin
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* 3. Form for Learner and Trainer */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {statusMessage && (
                <div
                  className={`p-3 rounded-btn text-xs font-medium flex items-center gap-2 border ${statusMessage.type === 'error'
                    ? 'bg-critical-light border-critical/30 text-critical'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                >
                  {statusMessage.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <Input
                  label="Full Name *"
                  placeholder="e.g. Arjun Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  error={errors.fullName}
                  leftIcon={<User className="w-4 h-4 text-text-muted" />}
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email Address */}
              <div>
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="e.g. arjun.kumar@mospi.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4 text-text-muted" />}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <Input
                  label="Password *"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters (1 uppercase, 1 lowercase, 1 number)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                  leftIcon={<Lock className="w-4 h-4 text-text-muted" />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="pointer-events-auto p-1 text-text-muted hover:text-text-primary focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Input
                  label="Confirm Password *"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={errors.confirmPassword}
                  leftIcon={<Lock className="w-4 h-4 text-text-muted" />}
                  rightIcon={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="pointer-events-auto p-1 text-text-muted hover:text-text-primary focus:outline-none transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Trainer-Specific Fields */}
              {selectedRole === 'trainer' && (
                <div className="pt-3 border-t border-border-light space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-primary uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    <span>Trainer Professional Profile</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Designation *"
                      placeholder="e.g. Senior Statistical Officer"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      onBlur={() => handleBlur('designation')}
                      error={errors.designation}
                      leftIcon={<Briefcase className="w-4 h-4 text-text-muted" />}
                      required
                    />

                    <Input
                      label="Job Role / Cadre *"
                      placeholder="e.g. Lead Instructor / Faculty"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      onBlur={() => handleBlur('jobRole')}
                      error={errors.jobRole}
                      leftIcon={<User className="w-4 h-4 text-text-muted" />}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Department *"
                      placeholder="e.g. National Accounts Division"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      onBlur={() => handleBlur('department')}
                      error={errors.department}
                      leftIcon={<Building2 className="w-4 h-4 text-text-muted" />}
                      required
                    />

                    <Input
                      label="Organization *"
                      placeholder="e.g. MoSPI / Central Training Institute"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      onBlur={() => handleBlur('organization')}
                      error={errors.organization}
                      leftIcon={<Building2 className="w-4 h-4 text-text-muted" />}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={!isFormValid || isLoading}
                  className="w-full font-semibold"
                  rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
                >
                  {isLoading
                    ? 'Creating Account...'
                    : selectedRole === 'trainer'
                      ? 'Create Trainer Account'
                      : 'Create Account'}
                </Button>
              </div>
            </form>
          )}

          {/* Already have an account navigation */}
          <div className="mt-6 pt-4 border-t border-border-light text-center text-xs text-text-secondary">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors ml-1"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
