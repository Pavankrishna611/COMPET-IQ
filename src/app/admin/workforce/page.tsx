'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/domain/StatCard';
import {
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Building2,
  Layers,
} from 'lucide-react';
import {
  WorkforceFilters,
  WorkforceFilterState,
  WorkforceDirectoryTable,
  OfficialDetailDrawer,
  DomainAnalysisChart,
  CompetencyDistributionChart,
  DepartmentComparisonChart,
} from '@/components/admin';
import {
  mockWorkforceSummary,
  mockDomainMetrics,
  mockOfficials,
  Official,
} from '@/data/workforce';
import {
  mockCompetencyDistribution,
  mockDepartmentHealth,
} from '@/data/adminDashboard';

const DEFAULT_FILTERS: WorkforceFilterState = {
  department: 'All Departments',
  role: 'All Roles',
  domain: 'All Domains',
  level: 'All Levels',
  search: '',
};

export default function AdminWorkforcePage() {
  const [filters, setFilters] = useState<WorkforceFilterState>(DEFAULT_FILTERS);
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);

  // Filter officials based on local state
  const filteredOfficials = useMemo(() => {
    return mockOfficials.filter((officer) => {
      // Department
      if (
        filters.department !== 'All Departments' &&
        officer.department.toLowerCase() !== filters.department.toLowerCase()
      ) {
        return false;
      }

      // Role
      if (
        filters.role !== 'All Roles' &&
        officer.designation.toLowerCase() !== filters.role.toLowerCase()
      ) {
        return false;
      }

      // Domain
      if (
        filters.domain !== 'All Domains' &&
        officer.domain.toLowerCase() !== filters.domain.toLowerCase()
      ) {
        return false;
      }

      // Level
      if (filters.level !== 'All Levels') {
        if (filters.level === 'Advanced' && officer.overallCompetency < 80) return false;
        if (
          filters.level === 'Proficient' &&
          (officer.overallCompetency < 70 || officer.overallCompetency >= 80)
        )
          return false;
        if (
          filters.level === 'Developing' &&
          (officer.overallCompetency < 65 || officer.overallCompetency >= 70)
        )
          return false;
        if (filters.level === 'Critical Gap' && officer.overallCompetency >= 65)
          return false;
      }

      // Search
      if (filters.search.trim() !== '') {
        const query = filters.search.toLowerCase();
        const matchName = officer.name.toLowerCase().includes(query);
        const matchDesig = officer.designation.toLowerCase().includes(query);
        const matchEmail = officer.email.toLowerCase().includes(query);
        const matchCadre = officer.cadre.toLowerCase().includes(query);
        if (!matchName && !matchDesig && !matchEmail && !matchCadre) {
          return false;
        }
      }

      return true;
    });
  }, [filters]);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <AppShell
      title="Workforce Competency"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Administration' },
        { label: 'Workforce Competency' },
      ]}
      defaultRole="admin"
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cadre Intelligence
              </span>
              <span className="text-[11px] font-medium text-text-secondary bg-surface-raised px-2.5 py-0.5 rounded-full border border-border">
                National Statistical System
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Workforce Competency Analytics
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Analyze workforce competency distribution across departments, roles, and professional domains.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-teal bg-teal-light px-3 py-1.5 rounded-btn border border-teal/20">
              12,540 Assessed Officials
            </span>
          </div>
        </div>

        {/* 2. Workforce Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Officials"
            value="12,540"
            subtitle="Across 6 statistical wings"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
            trend={{ value: '+4.2% YoY growth', direction: 'up' }}
          />

          <StatCard
            title="Average Competency"
            value="72%"
            subtitle="Across 4 MoSPI domains"
            accent="teal"
            icon={<Award className="w-5 h-5" />}
            trend={{ value: '+3.8% assessed gain', direction: 'up' }}
          />

          <StatCard
            title="High Performers"
            value="2,257"
            subtitle="Advanced tier (>= 80%)"
            accent="teal"
            icon={<TrendingUp className="w-5 h-5" />}
            trend={{ value: '18% of workforce', direction: 'up' }}
          />

          <StatCard
            title="Officials Needing Support"
            value="2,258"
            subtitle="Critical gap (< 65%)"
            accent="critical"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: 'Priority intervention', direction: 'down' }}
          />
        </div>

        {/* 1. Filter Bar */}
        <WorkforceFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalFiltered={filteredOfficials.length}
        />

        {/* 3 & 4. Competency Distribution & Department Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex flex-col">
            <CompetencyDistributionChart data={mockCompetencyDistribution} />
          </div>
          <div className="lg:col-span-7 flex flex-col">
            <DepartmentComparisonChart
              departments={mockDepartmentHealth}
              benchmark={72}
            />
          </div>
        </div>

        {/* 5. Competency Strength by Domain */}
        <DomainAnalysisChart metrics={mockDomainMetrics} />

        {/* 6, 7 & 8. Workforce Directory Table & Pagination */}
        <WorkforceDirectoryTable
          officials={filteredOfficials}
          onSelectOfficial={(officer) => setSelectedOfficial(officer)}
          pageSize={8}
        />

        {/* Official Detail Slide-Over Drawer */}
        <OfficialDetailDrawer
          official={selectedOfficial}
          onClose={() => setSelectedOfficial(null)}
        />
      </div>
    </AppShell>
  );
}
