'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  CompetencyCard,
  CompetencyDetailModal,
  CompetencyDistribution,
} from '@/components/competencies';
import {
  mockDetailedCompetencies,
  competencySummaryMetrics,
  DetailedCompetency,
  CompetencyDomain,
} from '@/data/competencies';
import { Award, CheckCircle2, TrendingUp, AlertTriangle, Target, Filter } from 'lucide-react';

export default function MyCompetenciesPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [activeCompetency, setActiveCompetency] = useState<DetailedCompetency | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const domainOptions = [
    'All',
    'Statistical',
    'Technical',
    'Digital Governance',
    'Behavioural & Managerial',
  ];

  const filteredCompetencies = useMemo(() => {
    if (selectedDomain === 'All') return mockDetailedCompetencies;
    return mockDetailedCompetencies.filter((comp) => comp.domain === selectedDomain);
  }, [selectedDomain]);

  const handleOpenDetails = (comp: DetailedCompetency) => {
    setActiveCompetency(comp);
    setIsModalOpen(true);
  };

  const getMetricIcon = (accent: string) => {
    switch (accent) {
      case 'teal':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'warning':
        return <TrendingUp className="w-5 h-5" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'blue':
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  return (
    <AppShell
      title="My Competencies"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'My Competencies' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-6 lg:space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="teal" size="sm" withDot>
                Official Competency Profile
              </Badge>
              <span className="text-[11px] text-text-muted">
                NSSTA Assessment Framework
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              My Competencies
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Your competency profile across statistical, technical, governance and professional domains.
            </p>
          </div>
        </div>

        {/* 1. TOP SUMMARY METRICS (4 StatCards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {competencySummaryMetrics.map((metric) => (
            <StatCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              subtitle={metric.supportingText}
              accent={metric.accent}
              icon={getMetricIcon(metric.accent)}
              className="transition-all duration-200 hover:shadow-card-hover"
            />
          ))}
        </div>

        {/* 2. COMPETENCY DISTRIBUTION CHART */}
        <CompetencyDistribution />

        {/* 3. COMPETENCY DOMAIN FILTERS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-light">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="text-base font-bold text-text-primary">
                Competency Matrix
              </h2>
              <Badge variant="neutral" size="sm">
                {filteredCompetencies.length} of {mockDetailedCompetencies.length}
              </Badge>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {domainOptions.map((domain) => {
                const isActive = selectedDomain === domain;
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => setSelectedDomain(domain)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-btn border transition-all duration-150 ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface text-text-secondary border-border hover:bg-[#F8FAFC] hover:text-text-primary'
                    }`}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. COMPETENCY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetencies.map((comp) => (
              <CompetencyCard
                key={comp.id}
                competency={comp}
                onViewDetails={handleOpenDetails}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. COMPETENCY DETAIL MODAL */}
      <CompetencyDetailModal
        competency={activeCompetency}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveCompetency(null);
        }}
      />
    </AppShell>
  );
}
