'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';
import { Input, Button, Badge } from '@/components/ui';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';

export default function LoginPage() {
  const { loginAsRole, loginWithCredentials } = useAuth();
  const [officialId, setOfficialId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      loginWithCredentials(officialId || 'arjun.kumar@mospi.gov.in', password || 'demo123');
    }, 400);
  };

  const handleRoleSelect = (role: Role) => {
    loginAsRole(role);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* ====================================================
          LEFT SIDE — BRANDING SECTION (ENTERPRISE / GOV TECH)
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
            {/* Grid coordinate guidelines */}
            <line x1="20" y1="30" x2="360" y2="30" stroke="#1B4E85" strokeDasharray="3 3" />
            <line x1="20" y1="65" x2="360" y2="65" stroke="#1B4E85" strokeDasharray="3 3" />
            <line x1="20" y1="100" x2="360" y2="100" stroke="#1B4E85" strokeDasharray="3 3" />

            {/* Pathway lines */}
            <path d="M45 85 L120 40 L210 65 L290 25 L345 55" stroke="#0E9F9A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M45 85 L120 40 L210 65 L290 25 L345 55" stroke="#0E9F9A" strokeWidth="6" strokeLinecap="round" strokeOpacity="0.15" />

            {/* Benchmark target line */}
            <path d="M45 55 L120 30 L210 45 L290 20 L345 25" stroke="#1769AA" strokeWidth="1.5" strokeDasharray="4 4" />

            {/* Node 1: Surveys */}
            <circle cx="45" cy="85" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="45" cy="85" r="3" fill="#FFFFFF" />
            <text x="30" y="112" fill="#8FB5D8" fontSize="9" fontWeight="600">Surveys</text>

            {/* Node 2: Nat Accounts */}
            <circle cx="120" cy="40" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="120" cy="40" r="3" fill="#FFFFFF" />
            <text x="95" y="24" fill="#8FB5D8" fontSize="9" fontWeight="600">Nat. Accounts</text>

            {/* Node 3: Computing */}
            <circle cx="210" cy="65" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="210" cy="65" r="3" fill="#FFFFFF" />
            <text x="185" y="90" fill="#8FB5D8" fontSize="9" fontWeight="600">R / Python</text>

            {/* Node 4: SAE Modeling */}
            <circle cx="290" cy="25" r="7" fill="#123B66" stroke="#0E9F9A" strokeWidth="2.5" />
            <circle cx="290" cy="25" r="3" fill="#6B5DD3" />
            <text x="275" y="14" fill="#A0DCD8" fontSize="9" fontWeight="600">SAE Model</text>

            {/* Node 5: SDG Policy */}
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
          RIGHT SIDE — LOGIN CARD & DEMO ACCESS
         ==================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-lg bg-surface border border-border rounded-panel shadow-card p-6 sm:p-9">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Welcome to COMPETIQ
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Sign in to access your personalized learning intelligence.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-surface px-3 text-xs uppercase font-bold text-text-muted">
              OR
            </span>
          </div>

          {/* ====================================================
              DEMO ACCESS SECTION (FRONTEND ONLY MULTI-ROLE ENTRY)
             ==================================================== */}
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
    </div>
  );
}
