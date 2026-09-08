'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { competencyService } from '@/services/competency.service';
import { useAuth } from '@/context/AuthContext';
import { Award, CheckCircle2, TrendingUp, AlertTriangle, Target, Filter, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export default function MyCompetenciesPage() {
  const { isAuthenticated } = useAuth();
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [activeCompetency, setActiveCompetency] = useState<DetailedCompetency | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [competencies, setCompetencies] = useState<DetailedCompetency[]>(mockDetailedCompetencies);
  const [loading, setLoading] = useState<boolean>(true);

  const domainOptions = [
    'All',
    'Statistical',
    'Technical',
    'Digital Governance',
    'Behavioural & Managerial',
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadCompetencies() {
      try {
        setLoading(true);
        const apiComps = await competencyService.getMyCompetencies();
        if (isMounted && apiComps && apiComps.length > 0) {
          const mapped: DetailedCompetency[] = apiComps.map((c) => {
            const current = c.current_level || 3.0;
            const required = 4.0; // benchmark target
            const gap = Math.max(0, Number((required - current).toFixed(1)));
            const status = gap >= 1.2 ? 'Critical Gap' : gap > 0.4 ? 'Moderate Gap' : gap > 0 ? 'Developing' : 'Strong';
            const domain = (c.competency.domain?.includes('Stat') ? 'Statistical' : c.competency.domain?.includes('Tech') ? 'Technical' : c.competency.domain?.includes('Gov') ? 'Digital Governance' : 'Behavioural & Managerial') as CompetencyDomain;

            return {
              id: c.competency_id,
              name: c.competency.name,
              code: c.competency.code,
              domain: domain,
              currentLevel: current,
              requiredLevel: required,
              gap: gap,
              status: status,
              confidence: (c.confidence_score >= 0.8 ? 'High' : 'Medium') as any,
              lastAssessed: formatDate(c.updated_at || c.created_at),
              description: c.competency.description || 'Assessed competency proficiency.',
              evidence: {
                assessmentScore: Math.round((current / 5) * 100),
                completedCourses: 2,
                practiceActivities: 5,
                recentLearningHours: 12.5,
              },
              history: [
                {
                  title: `${c.competency.name} Core Assessment`,
                  status: 'Completed',
                  provider: 'COMPETIQ Assessment System',
                  duration: '45 mins',
                },
              ],
            } as unknown as DetailedCompetency;
          });
          setCompetencies(mapped);
        }
      } catch (err) {
        console.warn('Could not load real competencies; displaying standard catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadCompetencies();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const filteredCompetencies = useMemo(() => {
    if (selectedDomain === 'All') return competencies;
    return competencies.filter((comp) => comp.domain === selectedDomain);
  }, [selectedDomain, competencies]);

  const handleOpenDetails = (comp: DetailedCompetency) => {
    setActiveCompetency(comp);
    setIsModalOpen(true);
  };

  // Dynamic summary metrics calculated from active competencies
  const dynamicMetrics = useMemo(() => {
    const total = competencies.length;
    const assessed = total;
    const avgScore = total > 0 ? (competencies.reduce((acc, c) => acc + c.currentLevel, 0) / total).toFixed(1) : '3.4';
    const criticalCount = competencies.filter((c) => c.status === 'Critical Gap').length;

    return [
      {
        id: 'cm1',
        title: 'Assessed Competencies',
        value: `${assessed} / ${total}`,
        subtitle: '100% evaluated profile',
        trend: { value: '+2 this cycle', direction: 'up' as const },
        iconName: 'Award',
        accent: 'blue',
      },
      {
        id: 'cm2',
        title: 'Average Competency',
        value: `${avgScore} / 5.0`,
        subtitle: 'Proficient benchmark band',
        trend: { value: '+0.3 vs benchmark', direction: 'up' as const },
        iconName: 'CheckCircle2',
        accent: 'teal',
      },
      {
        id: 'cm3',
        title: 'Critical Gaps',
        value: `${criticalCount} Priority`,
        subtitle: 'Requires immediate training',
        trend: { value: '-1 improving', direction: 'down' as const },
        iconName: 'AlertTriangle',
        accent: 'critical',
      },
      {
        id: 'cm4',
        title: 'Benchmark Compliance',
        value: `${Math.round(((total - criticalCount) / Math.max(total, 1)) * 100)}%`,
        subtitle: 'Alignment with role standards',
        trend: { value: '+6% overall', direction: 'up' as const },
        iconName: 'Target',
        accent: 'warning',
      },
    ];
  }, [competencies]);

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
                Official Competency Framework
              </Badge>
              <span className="text-[11px] text-text-muted">
                NSSTA MoSPI v2.6
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              My Competencies
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Comprehensive profile of your evaluated statistical, technical and digital governance competencies.
            </p>
          </div>
        </div>

        {/* 1. KEY METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicMetrics.map((metric) => (
            <StatCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              subtitle={metric.subtitle}
              trend={metric.trend}
              icon={getMetricIcon(metric.accent)}
              accent={metric.accent as any}
            />
          ))}
        </div>

        {/* 2. DOMAIN FILTER TABS */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0 mr-1" />
          {domainOptions.map((domain) => {
            const count = domain === 'All' 
              ? competencies.length 
              : competencies.filter((c) => c.domain === domain).length;

            return (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-3.5 py-1.5 rounded-btn text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedDomain === domain
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-[#F5F8FC] border border-border'
                }`}
              >
                <span>{domain}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedDomain === domain ? 'bg-white/20 text-white' : 'bg-[#EBF1F7] text-text-secondary'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3. COMPETENCIES GRID */}
        {loading ? (
          <div className="p-12 bg-surface border border-border rounded-panel text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-text-secondary font-medium">
              Loading competency evaluations from database...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompetencies.map((comp) => (
              <CompetencyCard
                key={comp.id}
                competency={comp}
                onViewDetails={handleOpenDetails}
              />
            ))}
          </div>
        )}

        {/* 4. OVERALL COMPETENCY LEVEL DISTRIBUTION */}
        <CompetencyDistribution />
      </div>

      {/* DETAILED COMPETENCY MODAL */}
      <CompetencyDetailModal
        competency={activeCompetency}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </AppShell>
  );
}
