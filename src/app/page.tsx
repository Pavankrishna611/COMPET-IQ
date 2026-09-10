'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  GraduationCap,
  BarChart3,
  Lock,
  Compass,
} from 'lucide-react';
import { LandingBackground } from '@/components/common/LandingBackground';
import { Logo } from '@/components/common/Logo';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'trainer') router.push('/trainer/dashboard');
      else router.push('/learner/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <main className="relative w-full min-h-screen overflow-hidden flex flex-col justify-between selection:bg-teal selection:text-white">
      {/* =========================================================================
          BACKGROUND LAYER: Interactive AeroShards wind sculpture foil simulation
         ========================================================================= */}
      <LandingBackground />

      {/* =========================================================================
          FOREGROUND UI: Header, Hero, and Enterprise Value Metrics
         ========================================================================= */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between pointer-events-none">

        {/* Navigation Bar */}
        <header className="w-full px-6 py-4 sm:px-10 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center backdrop-blur-md bg-navy/90 px-3.5 py-1.5 rounded-2xl border border-white/15 shadow-sm text-white">
            <Logo size="md" theme="dark" />
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <button
                onClick={handleGetStarted}
                className="backdrop-blur-md bg-white/70 hover:bg-white text-navy font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/80 shadow-sm transition-all flex items-center gap-2 hover:shadow-md"
              >
                <span>Dashboard ({user.role})</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 backdrop-blur-md bg-white/60 hover:bg-white/80 text-navy font-semibold text-sm px-4 py-2.5 rounded-xl border border-white/70 shadow-sm transition-all"
                >
                  <Lock className="w-3.5 h-3.5 text-navy/70" />
                  <span>Sign In</span>
                </Link>
                <button
                  onClick={handleGetStarted}
                  className="bg-navy hover:bg-navy-light text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-teal-light" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero Central Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 my-auto text-center">
          <div className="max-w-3xl mx-auto backdrop-blur-xl bg-white/50 p-8 sm:p-12 md:p-14 rounded-3xl border border-white/70 shadow-[0_20px_60px_rgba(18,59,102,0.10)] pointer-events-auto transition-all">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-primary/20 text-xs font-semibold text-navy mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal" />
              <span>MoSPI • Official Statistical System</span>
              <span className="w-1 h-1 rounded-full bg-teal" />
              <span className="text-primary font-bold">AI Competency Architecture</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-navy mb-5 leading-[1.08]">
              Empowering Minds.{' '}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-navy via-primary to-teal bg-clip-text text-transparent">
                Mastering Competence.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
              Real-time skill gap analytics, personalized learning pathways, and verifiable workforce intelligence designed for India&apos;s Official Statistical System.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="hero-get-started-btn"
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 text-base sm:text-lg font-bold text-white rounded-xl bg-gradient-to-r from-navy via-primary to-navy hover:from-navy-dark hover:to-primary shadow-[0_8px_24px_rgba(18,59,102,0.25)] hover:shadow-[0_12px_32px_rgba(23,105,170,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center gap-3 group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 text-teal-light group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-4 text-base sm:text-lg font-semibold text-navy bg-white/70 hover:bg-white/90 border border-white/90 rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5 text-teal" />
                <span>Sign In to Platform</span>
              </Link>
            </div>

            {/* Interactive hint */}
            <div className="mt-8 pt-6 border-t border-navy/10 flex items-center justify-center gap-2 text-xs font-medium text-navy/60">
              <Compass className="w-3.5 h-3.5 text-teal animate-pulse" />
              <span>Hover cursor to repel shards • Click and hold canvas to gather foil</span>
            </div>
          </div>
        </section>

        {/* Value Metrics & Pillar Badges */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-6 pt-2 pointer-events-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Pillar 1 */}
            <div className="backdrop-blur-md bg-white/45 p-4 rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(18,59,102,0.04)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal/15 text-teal flex items-center justify-center shrink-0 mt-0.5">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy leading-tight">AI Skill Gap Diagnostics</h2>
                <p className="text-xs text-text-secondary mt-1 leading-snug">
                  Precision gap mapping across ISS &amp; SSS cadre proficiencies.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="backdrop-blur-md bg-white/45 p-4 rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(18,59,102,0.04)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy leading-tight">Adaptive Pathways</h2>
                <p className="text-xs text-text-secondary mt-1 leading-snug">
                  Role-aligned curricula, micro-assessments, and contextual learning.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="backdrop-blur-md bg-white/45 p-4 rounded-2xl border border-white/60 shadow-[0_4px_16px_rgba(18,59,102,0.04)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy/15 text-navy flex items-center justify-center shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-navy leading-tight">Cadre Intelligence</h2>
                <p className="text-xs text-text-secondary mt-1 leading-snug">
                  Institutional capability tracking and NSSTA governance metrics.
                </p>
              </div>
            </div>
          </div>

          {/* Minimal footer */}
          <footer className="text-center py-4 text-[11px] font-medium text-navy/50">
            © 2026 COMPETIQ • Ministry of Statistics and Programme Implementation (MoSPI) • NSSTA
          </footer>
        </section>

      </div>
    </main>
  );
}
