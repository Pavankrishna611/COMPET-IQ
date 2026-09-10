'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/domain/StatCard';
import { mockUsers } from '@/data/users';
import {
  User,
  ShieldCheck,
  Mail,
  Building2,
  Calendar,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  FileSpreadsheet,
  Download,
  Bell,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { watchTimeService } from '@/services';

export default function LearnerProfilePage() {
  const { user: authUser, currentUser, isDemoMode } = useAuth();
  const activeUser = currentUser || authUser;
  const isDemo = isDemoMode;
  const userId = activeUser?.id || '';

  const user = {
    name: activeUser?.name || (isDemo ? mockUsers.learner.name : 'Learner Officer'),
    email: activeUser?.email || (isDemo ? mockUsers.learner.email : ''),
    employeeId: activeUser?.employeeId || (isDemo ? mockUsers.learner.employeeId : 'ID-PENDING'),
    designation: activeUser?.designation || (isDemo ? mockUsers.learner.designation : 'Statistical Officer'),
    department: activeUser?.department || (isDemo ? mockUsers.learner.department : 'Ministry of Statistics & Programme Implementation'),
  };

  const [watchHours, setWatchHours] = useState<number>(isDemo ? 42.5 : 0.0);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [assessmentReminders, setAssessmentReminders] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [isDossierDownloaded, setIsDossierDownloaded] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const stats = await watchTimeService.getUserWatchTime(userId, isDemo);
        if (isMounted) {
          setWatchHours(stats.totalWatchHours);
        }
      } catch (err) {
        console.warn('Could not load profile stats:', err);
      }
    }
    loadStats();
    const unsub = watchTimeService.subscribeToUpdates(() => {
      loadStats();
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [userId, isDemo]);

  const handleDownloadDossier = () => {
    setIsDossierDownloaded(true);
    setTimeout(() => {
      setIsDossierDownloaded(false);
    }, 4000);
  };


  return (
    <AppShell
      title="Officer Profile & Cadre Credentials"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Officer Profile' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Top Header Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-start gap-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              AK
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                  {user.name}
                </h1>
                <Badge variant="teal" size="sm" withDot className="font-semibold">
                  Subordinate Statistical Service (SSS)
                </Badge>
                <span className="text-[11px] font-mono text-text-muted bg-surface-raised px-2 py-0.5 rounded-md border border-border">
                  {user.employeeId}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary">
                {user.designation} • {user.department}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Service Joined: July 2021
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 z-10 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadDossier}
              className="text-xs font-semibold gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isDossierDownloaded ? 'Dossier Exported' : 'Export Officer Dossier'}
            </Button>

            <Link href="/learner/learning-path">
              <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                Active Learning Track
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Overall Competency"
            value="78%"
            subtitle="Benchmark: 70% threshold"
            accent="teal"
            icon={<Award className="w-5 h-5" />}
            trend={{ value: '+4.2% this quarter', direction: 'up' }}
          />

          <StatCard
            title="Completed Assessments"
            value="6"
            subtitle="Diagnostic & summative tests"
            accent="blue"
            icon={<CheckCircle2 className="w-5 h-5" />}
            trend={{ value: '100% verified by NSSTA', direction: 'up' }}
          />

          <StatCard
            title="Learning Hours"
            value={`${watchHours.toFixed(1)} hrs`}
            subtitle={watchHours === 0 ? 'No courses completed yet' : 'Logged on iGOT Karmayogi'}
            accent="blue"
            icon={<Clock className="w-5 h-5" />}
            trend={
              watchHours === 0
                ? { value: 'Ready to learn', direction: 'neutral' }
                : { value: `+${watchHours.toFixed(1)} hrs this month`, direction: 'up' }
            }
          />

          <StatCard
            title="Learning Streak"
            value="12 Days"
            subtitle="Continuous engagement"
            accent="teal"
            icon={<Flame className="w-5 h-5" />}
            trend={{ value: 'Top 10% in cadre', direction: 'up' }}
          />
        </div>

        {/* 2-Column Main Section: Cadre Credentials + Verified Skills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cadre Credentials & Ministry Metadata */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">
                    Official Cadre Details
                  </h3>
                </div>
                <Badge variant="teal" size="sm">
                  Active Service
                </Badge>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-border">
                  <span className="text-text-muted">Cadre Service:</span>
                  <strong className="text-text-primary">Subordinate Statistical Service (SSS)</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-border">
                  <span className="text-text-muted">Ministry / Department:</span>
                  <strong className="text-text-primary">Ministry of Statistics &amp; PI (MoSPI)</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-border">
                  <span className="text-text-muted">Current Posting Wing:</span>
                  <strong className="text-text-primary">Survey Design &amp; Research Division</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-border">
                  <span className="text-text-muted">Pay Level &amp; Grade:</span>
                  <strong className="text-text-primary">Level-7 (Statistical Investigator Gr. I)</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-border">
                  <span className="text-text-muted">Jan Parichay SSO:</span>
                  <span className="text-teal font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal" /> Verified &amp; Linked
                  </span>
                </div>
              </div>
            </div>

            {/* Notification & Platform Preferences */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-border-light pb-3">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-text-primary">
                  Learning &amp; Assessment Preferences
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-surface-raised rounded-xl border border-border">
                  <div>
                    <span className="font-bold text-text-primary block">iGOT Weekly Progress Digest</span>
                    <span className="text-[11px] text-text-muted">Receive weekly summary of logged learning hours</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-raised rounded-xl border border-border">
                  <div>
                    <span className="font-bold text-text-primary block">Competency Assessment Reminders</span>
                    <span className="text-[11px] text-text-muted">Alerts when quarterly evaluation window opens</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assessmentReminders}
                    onChange={(e) => setAssessmentReminders(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-raised rounded-xl border border-border">
                  <div>
                    <span className="font-bold text-text-primary block">AI Skill Gap Recommendations</span>
                    <span className="text-[11px] text-text-muted">Proactive suggestions when new MoSPI courses release</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={aiSuggestions}
                    onChange={(e) => setAiSuggestions(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Verified Competencies & Earned Credentials */}
          <div className="lg:col-span-6 space-y-6">
            {/* Core Competency Breakdown */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-text-primary">
                    Verified Competency Levels
                  </h3>
                </div>
                <Link href="/learner/competencies" className="text-xs text-primary font-semibold hover:underline">
                  Full Analysis &rarr;
                </Link>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Skill 1: Statistical Methods */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">Statistical Methods &amp; Sampling</span>
                    <span className="font-mono text-teal font-bold">82% (Target: 75%)</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-teal" style={{ width: '82%' }} />
                  </div>
                </div>

                {/* Skill 2: SQL */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">SQL Database Querying</span>
                    <span className="font-mono text-primary font-bold">70% (Target: 75%)</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: '70%' }} />
                  </div>
                </div>

                {/* Skill 3: Data Visualization */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">Data Visualization &amp; BI</span>
                    <span className="font-mono text-primary font-bold">64% (Target: 70%)</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: '64%' }} />
                  </div>
                </div>

                {/* Skill 4: Python */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">Python for Statistical Computing</span>
                    <span className="font-mono text-amber-600 font-bold">52% (Target: 75% • Critical Gap)</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: '52%' }} />
                  </div>
                </div>

                {/* Skill 5: GIS */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text-primary">GIS &amp; Geospatial Tagging</span>
                    <span className="font-mono text-rose-600 font-bold">42% (Target: 65% • High Gap)</span>
                  </div>
                  <div className="w-full bg-border-light rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Certifications */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal" />
                  <h3 className="text-base font-bold text-text-primary">
                    Accredited Certifications
                  </h3>
                </div>
                <span className="text-xs font-mono text-text-muted">4 Earned</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary block">National Accounts Statistics (NAS) Fundamentals</span>
                    <span className="text-[11px] text-text-muted font-mono">Issued by NSSTA • Aug 2026</span>
                  </div>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>

                <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary block">Advanced Survey Sampling &amp; Estimation</span>
                    <span className="text-[11px] text-text-muted font-mono">Issued by MoSPI Academy • Jul 2026</span>
                  </div>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>

                <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary block">SQL for Public Administrative Databases</span>
                    <span className="text-[11px] text-text-muted font-mono">Issued by iGOT Karmayogi • Jun 2026</span>
                  </div>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>

                <div className="p-3 bg-surface-raised rounded-xl border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-text-primary block">Digital Personal Data Protection in Statistical Audits</span>
                    <span className="text-[11px] text-text-muted font-mono">Issued by NeGD / MeitY • May 2026</span>
                  </div>
                  <Badge variant="success" size="sm">Verified</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
