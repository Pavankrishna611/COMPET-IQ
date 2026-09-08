'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/domain/StatCard';
import { mockTrainerAssessments, TrainerAssessmentItem } from '@/data/assessments';
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Archive,
  CheckCircle2,
  Sparkles,
  Users,
  Award,
  BookOpen,
  FilterX,
  FileCheck,
} from 'lucide-react';

export default function TrainerAssessmentsPage() {
  const [assessments, setAssessments] = useState<TrainerAssessmentItem[]>(mockTrainerAssessments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Actions
  const handleDuplicate = (item: TrainerAssessmentItem) => {
    const duplicated: TrainerAssessmentItem = {
      ...item,
      id: `tr-asmt-${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'Draft',
      learnersCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setAssessments((prev) => [duplicated, ...prev]);
    showToast(`Assessment "${item.title}" duplicated as Draft.`);
  };

  const handleArchive = (id: string) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: a.status === 'Archived' ? 'Published' : 'Archived' } : a))
    );
    showToast('Assessment status updated.');
  };

  const handleToggleStatus = (id: string, newStatus: 'Published' | 'Draft' | 'Archived') => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`Assessment marked as ${newStatus}.`);
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesComp = item.competency.toLowerCase().includes(q);
        if (!matchesTitle && !matchesComp) return false;
      }
      return true;
    });
  }, [assessments, searchQuery, statusFilter]);

  const totalLearners = assessments.reduce((acc, a) => acc + a.learnersCount, 0);
  const avgOverallScore = Math.round(
    assessments.reduce((acc, a) => acc + a.averageScore, 0) / (assessments.length || 1)
  );

  return (
    <AppShell
      title="Manage Assessments"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Trainer' },
        { label: 'Manage Assessments' },
      ]}
      defaultRole="trainer"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-5 h-5 text-teal shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-light pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="teal" size="sm" withDot className="font-semibold">
                Faculty Governance Portal
              </Badge>
              <span className="text-xs text-text-muted">MoSPI Cadre Capacity Building</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Manage Assessments
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-3xl">
              Calibrate competency tests, review cohort performance analytics, and manage official assessment blueprints.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/trainer/assessment-generator">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />} className="text-xs font-semibold shadow-sm">
                AI Assessment Generator
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Assessments"
            value={assessments.length}
            accent="blue"
            icon={<ClipboardCheck className="w-5 h-5" />}
            subtitle="Across 4 MoSPI domains"
          />
          <StatCard
            title="Active Learners"
            value={`${totalLearners} Officers`}
            accent="teal"
            icon={<Users className="w-5 h-5" />}
            subtitle="ISS / SSS Cadre cohorts"
          />
          <StatCard
            title="Cohort Pass Rate"
            value={`${avgOverallScore}% Avg`}
            accent="warning"
            icon={<Award className="w-5 h-5" />}
            subtitle="Baseline benchmark: 75%"
          />
          <StatCard
            title="Published Blueprints"
            value={assessments.filter((a) => a.status === 'Published').length}
            accent="ai"
            icon={<BookOpen className="w-5 h-5" />}
            subtitle="Live in Learner Hub"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment name, competency..."
              className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Assessments Management Table */}
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Assessment Name</th>
                  <th className="py-3.5 px-4">Competency</th>
                  <th className="py-3.5 px-4 text-center">Questions</th>
                  <th className="py-3.5 px-4 text-center">Learners</th>
                  <th className="py-3.5 px-4 text-center">Avg Score</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-text-primary">
                {filteredAssessments.length > 0 ? (
                  filteredAssessments.map((asmt) => (
                    <tr
                      key={asmt.id}
                      className="hover:bg-surface-elevated/50 transition-colors group"
                    >
                      {/* Title & Author */}
                      <td className="py-4 px-4 min-w-[220px]">
                        <div className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                          {asmt.title}
                        </div>
                        <div className="text-[11px] text-text-muted mt-0.5">
                          {asmt.author} • Updated {asmt.lastUpdated}
                        </div>
                      </td>

                      {/* Competency */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant="teal" size="sm" className="font-semibold">
                          {asmt.competency}
                        </Badge>
                      </td>

                      {/* Questions Count */}
                      <td className="py-4 px-4 text-center font-mono font-bold whitespace-nowrap">
                        {asmt.questionsCount}
                      </td>

                      {/* Learners Count */}
                      <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                        {asmt.learnersCount}
                      </td>

                      {/* Average Score */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                            asmt.averageScore >= 80
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {asmt.averageScore}%
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={
                            asmt.status === 'Published'
                              ? 'success'
                              : asmt.status === 'Draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                          withDot
                        >
                          {asmt.status}
                        </Badge>
                      </td>

                      {/* Actions: View, Edit, Duplicate, Archive */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link href="/learner/quiz">
                            <button
                              type="button"
                              title="Preview Assessment in Learner View"
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          <Link href="/trainer/assessment-generator">
                            <button
                              type="button"
                              title="Edit Assessment Blueprint"
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-elevated transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDuplicate(asmt)}
                            title="Duplicate Assessment"
                            className="p-1.5 rounded-lg text-text-muted hover:text-teal hover:bg-surface-elevated transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleArchive(asmt.id)}
                            title={asmt.status === 'Archived' ? 'Unarchive' : 'Archive'}
                            className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-surface-elevated transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No assessments match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
