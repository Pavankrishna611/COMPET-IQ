'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Select,
  Tabs,
  Modal,
  ProgressBar,
  Avatar,
  Tooltip,
  Toast,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import {
  StatCard,
  ChartCard,
  CourseCard,
  LearningPathItem,
  RecommendationCard,
  CompetencyCard,
  SkillGapCard,
} from '@/components/domain';
import {
  mockCompetencies,
  mockSkillGaps,
  mockCourses,
  mockLearningPath,
  mockRecommendations,
} from '@/data';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  Sparkles,
  Target,
  AlertTriangle,
  Award,
  Layers,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function PartZeroShowcasePage() {
  const [activeTab, setActiveTab] = useState('design-tokens');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(true);

  // Sample data for Recharts testing adhering strictly to locked color palette
  const sampleChartData = [
    { domain: 'Surveys', score: 84 },
    { domain: 'Nat. Accounts', score: 68 },
    { domain: 'Computing (R)', score: 52 },
    { domain: 'Time Series', score: 91 },
    { domain: 'SAE Modeling', score: 45 },
    { domain: 'SDG Metrics', score: 76 },
  ];

  return (
    <AppShell
      title="Part 0: Frontend Foundation & Design System"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Architecture & System Shell' },
      ]}
      defaultRole="learner"
    >
      <div className="flex flex-col gap-8 pb-12">
        {/* Foundation Notice Banner */}
        <div className="bg-surface border-l-4 border-l-primary border-border p-4 rounded-btn shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-btn bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                COMPETIQ Application Shell & UI Architecture Active
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Indian Official Statistical System • Part 0 Foundation (Design Tokens, Shell, Types, Mock Data & Components)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="teal" size="md" withDot>
              Part 0 Verified
            </Badge>
            <Badge variant="info" size="md">
              Next.js 14 App Router
            </Badge>
          </div>
        </div>

        {/* Tab Switcher for Foundation Categories */}
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'design-tokens', label: 'Color & Design Tokens' },
            { id: 'ui-primitives', label: 'Atomic UI Primitives' },
            { id: 'domain-skeletons', label: 'Domain Components' },
            { id: 'system-states', label: 'Loading & States' },
          ]}
        />

        {/* TAB 1: DESIGN TOKENS & SYSTEM PALETTE */}
        {activeTab === 'design-tokens' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Palette Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Locked Design Tokens</CardTitle>
                <CardDescription>
                  Enterprise blue color system designed specifically for India&apos;s Official Statistical System dashboards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-navy" />
                    <span className="text-xs font-bold text-text-primary">Deep Navy</span>
                    <span className="text-[11px] font-mono text-text-muted">#123B66</span>
                    <span className="text-[10px] text-text-secondary">Sidebar, Branding</span>
                  </div>

                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-primary" />
                    <span className="text-xs font-bold text-text-primary">Primary Blue</span>
                    <span className="text-[11px] font-mono text-text-muted">#1769AA</span>
                    <span className="text-[10px] text-text-secondary">Buttons, Active</span>
                  </div>

                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-teal" />
                    <span className="text-xs font-bold text-text-primary">Analytics Teal</span>
                    <span className="text-[11px] font-mono text-text-muted">#0E9F9A</span>
                    <span className="text-[10px] text-text-secondary">Progress, Charts</span>
                  </div>

                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-teal-light border border-teal/20" />
                    <span className="text-xs font-bold text-text-primary">Light Teal</span>
                    <span className="text-[11px] font-mono text-text-muted">#DDF5F3</span>
                    <span className="text-[10px] text-text-secondary">Soft Accents</span>
                  </div>

                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-ai-purple" />
                    <span className="text-xs font-bold text-text-primary">AI Purple</span>
                    <span className="text-[11px] font-mono text-text-muted">#6B5DD3</span>
                    <span className="text-[10px] text-text-secondary">AI Accent Only</span>
                  </div>

                  <div className="p-3 rounded-btn border border-border bg-surface flex flex-col gap-2">
                    <div className="w-full h-12 rounded bg-background border border-border" />
                    <span className="text-xs font-bold text-text-primary">Background</span>
                    <span className="text-[11px] font-mono text-text-muted">#F5F8FC</span>
                    <span className="text-[10px] text-text-secondary">Main Workspace</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border-light grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-btn bg-success-light border border-success/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-success">Success</span>
                    <span className="text-[11px] font-mono text-success">#16855B</span>
                  </div>
                  <div className="p-2.5 rounded-btn bg-warning-light border border-warning/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-warning">Warning</span>
                    <span className="text-[11px] font-mono text-warning">#D99000</span>
                  </div>
                  <div className="p-2.5 rounded-btn bg-critical-light border border-critical/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-critical">Critical</span>
                    <span className="text-[11px] font-mono text-critical">#C93636</span>
                  </div>
                  <div className="p-2.5 rounded-btn bg-primary-light border border-primary/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">Info</span>
                    <span className="text-[11px] font-mono text-primary">#1769AA</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography Hierarchy Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Typography System (Inter)</CardTitle>
                <CardDescription>
                  Clean hierarchical weights without excessive bolding or decorative fonts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pb-3 border-b border-border-light">
                  <span className="text-xs text-text-muted uppercase font-semibold">Page Title</span>
                  <h1 className="text-xl font-bold text-text-primary mt-1">
                    National Accounts & GDP Compilation Competency Matrix
                  </h1>
                </div>
                <div className="pb-3 border-b border-border-light">
                  <span className="text-xs text-text-muted uppercase font-semibold">Section Title</span>
                  <h2 className="text-base font-semibold text-text-primary mt-1">
                    Cadre Skill Gap Distribution & Progression Benchmarks
                  </h2>
                </div>
                <div className="pb-3 border-b border-border-light">
                  <span className="text-xs text-text-muted uppercase font-semibold">Card Title</span>
                  <h3 className="text-sm font-semibold text-text-primary mt-1">
                    Stratified Sampling Calibration Techniques (NSSTA-2026)
                  </h3>
                </div>
                <div>
                  <span className="text-xs text-text-muted uppercase font-semibold">Body & Metadata</span>
                  <p className="text-xs text-text-secondary leading-relaxed mt-1">
                    This training module covers Horvitz-Thompson estimation and auxiliary variable calibration under the Ministry of Statistics and Programme Implementation guidelines.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: ATOMIC UI PRIMITIVES */}
        {activeTab === 'ui-primitives' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* Buttons & Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Button System & Badges</CardTitle>
                <CardDescription>
                  Strict button variants and semantic status badges with accessible focus rings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">
                    Button Variants
                  </h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="teal">Analytics Teal</Button>
                    <Button variant="ai" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                      AI Action
                    </Button>
                    <Button variant="danger">Critical Action</Button>
                    <Button variant="primary" isLoading>
                      Processing
                    </Button>
                    <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                      Test Accessible Modal
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light">
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">
                    Badges
                  </h4>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant="neutral">Default Neutral</Badge>
                    <Badge variant="info" withDot>
                      Information
                    </Badge>
                    <Badge variant="teal" withDot>
                      Analytics Verified
                    </Badge>
                    <Badge variant="success" withDot>
                      Target Met
                    </Badge>
                    <Badge variant="warning" withDot>
                      Moderate Gap
                    </Badge>
                    <Badge variant="critical" withDot>
                      Critical Priority
                    </Badge>
                    <Badge variant="ai" withDot>
                      <Sparkles className="w-3 h-3 text-ai-purple mr-1 inline" />
                      AI Recommendation
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form Controls & Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Form Inputs & Progress Indicators</CardTitle>
                <CardDescription>
                  Enterprise form controls with explicit labels, helper texts, and validation states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Officer Employee ID"
                    placeholder="e.g. ISS-2018-0442"
                    helperText="Official cadre identification code"
                  />
                  <Select
                    label="Cadre / Division"
                    options={[
                      { value: 'iss', label: 'Indian Statistical Service (ISS)' },
                      { value: 'sss', label: 'Subordinate Statistical Service (SSS)' },
                      { value: 'field', label: 'Field Operations Division (FOD)' },
                      { value: 'sdrd', label: 'Survey Design & Research (SDRD)' },
                    ]}
                  />
                  <Input
                    label="Competency Score Benchmark"
                    defaultValue="84.5%"
                    rightIcon={<CheckCircle2 className="w-4 h-4 text-success" />}
                  />
                </div>

                <div className="pt-4 border-t border-border-light space-y-3">
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">
                    Progress Bar Indicators
                  </h4>
                  <div className="space-y-3 max-w-xl">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                        <span>Pathway Progress (Economic Statistics Track)</span>
                        <span className="font-bold text-text-primary">40%</span>
                      </div>
                      <ProgressBar value={40} variant="teal" size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                        <span>National Accounts Competency Attainment</span>
                        <span className="font-bold text-text-primary">75%</span>
                      </div>
                      <ProgressBar value={75} variant="blue" size="sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light flex items-center gap-6">
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">
                      Avatar Components
                    </h4>
                    <div className="flex items-center gap-3">
                      <Avatar name="Rajeshwar Rao" cadreBadge="ISS" size="sm" />
                      <Avatar name="Pooja Sharma" cadreBadge="ISS" size="md" />
                      <Avatar name="Amitabh Sen" cadreBadge="FOD" size="lg" />
                    </div>
                  </div>

                  <div className="border-l border-border-light pl-6">
                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">
                      Tooltip Utility
                    </h4>
                    <Tooltip content="Fay-Herriot EBLUP Microdata Estimator" position="top">
                      <Button size="sm" variant="secondary" leftIcon={<Info className="w-3.5 h-3.5" />}>
                        Hover for Tooltip
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Toast Demonstration */}
            {showToast && (
              <Toast
                type="info"
                title="System Intelligence Synchronized"
                message="Competency framework loaded from MoSPI & NSSTA guidelines (Part 0 static layer)."
                onClose={() => setShowToast(false)}
              />
            )}
          </div>
        )}

        {/* TAB 3: DOMAIN CARD SKELETONS */}
        {activeTab === 'domain-skeletons' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            {/* KPI Metric StatCards */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
                Metric KPI Cards (StatCard)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Assessed Competencies"
                  value="6 Domains"
                  accent="blue"
                  icon={<Target className="w-5 h-5" />}
                  trend={{ value: '+2 verified', direction: 'up' }}
                  subtitle="Latest round: July 2026"
                />
                <StatCard
                  title="Skill Gaps Flagged"
                  value="3 Critical"
                  accent="critical"
                  icon={<AlertTriangle className="w-5 h-5" />}
                  trend={{ value: '-1 from last year', direction: 'down' }}
                  subtitle="Requires prioritized training"
                />
                <StatCard
                  title="Learning Path"
                  value="40% Completed"
                  accent="teal"
                  icon={<Award className="w-5 h-5" />}
                  trend={{ value: '2 of 5 modules done', direction: 'neutral' }}
                />
                <StatCard
                  title="AI Recommendations"
                  value="3 Curated"
                  accent="ai"
                  icon={<Sparkles className="w-5 h-5" />}
                  subtitle="Targeted for cadre elevation"
                />
              </div>
            </div>

            {/* ChartCard & Recharts Validation */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
                Analytics Chart Card (Recharts Palette Validation)
              </h3>
              <ChartCard
                title="Cadre Competency Scores by Domain"
                description="Evaluating baseline scores against the 2026 National Statistical Standard (Scale 0-100)"
                height={260}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                    <XAxis
                      dataKey="domain"
                      tick={{ fill: '#526579', fontSize: 11 }}
                      axisLine={{ stroke: '#D9E2EC' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: '#7A8A9A', fontSize: 11 }}
                      axisLine={{ stroke: '#D9E2EC' }}
                      tickLine={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #D9E2EC',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(18, 59, 102, 0.08)',
                        fontSize: '12px',
                        color: '#172B4D',
                      }}
                    />
                    <Bar dataKey="score" fill="#1769AA" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* CompetencyCard & SkillGapCard Skeletons */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
                Competency & Skill Gap Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CompetencyCard competency={mockCompetencies[1]} />
                <SkillGapCard skillGap={mockSkillGaps[0]} />
              </div>
            </div>

            {/* CourseCard & RecommendationCard */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
                Course & AI Recommendation Cards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CourseCard course={mockCourses[0]} />
                <RecommendationCard recommendation={mockRecommendations[0]} />
              </div>
            </div>

            {/* LearningPathItem Milestone */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3">
                Learning Path Milestone Tracker
              </h3>
              <Card className="p-5">
                <div className="flex flex-col">
                  {mockLearningPath.items.slice(0, 3).map((item, idx) => (
                    <LearningPathItem
                      key={item.id}
                      item={item}
                      isLast={idx === 2}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM STATES (LOADING, EMPTY, ERROR) */}
        {activeTab === 'system-states' && (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <Card>
              <CardHeader>
                <CardTitle>System Feedback & Data States</CardTitle>
                <CardDescription>
                  Non-intrusive enterprise states adhering to government-grade design (no gimmicky loaders or flashing colors).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">
                    Subtle Skeleton Loading State
                  </h4>
                  <LoadingState message="Connecting to local mock intelligence registry..." rows={3} />
                </div>

                <div className="pt-4 border-t border-border-light grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">
                      Structured Empty State
                    </h4>
                    <EmptyState
                      title="No Assessments Pending"
                      description="You have completed all scheduled competency diagnostics for the current statistical quarter."
                      actionLabel="Explore Available Quizzes"
                      onAction={() => { }}
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase mb-3">
                      Recoverable Error State
                    </h4>
                    <ErrorState
                      title="Unable to Calculate Skill Gap Vector"
                      message="Temporary timeout while compiling benchmark differential for National Accounts."
                      onRetry={() => { }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Accessible Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Official Statistics Verification Dialog"
        description="Reviewing competency standard parameters under SNA 2008 guidelines."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Acknowledge Standard
            </Button>
          </>
        }
      >
        <p className="text-xs text-text-secondary leading-relaxed">
          This accessible modal container traps keyboard focus, listens for the Escape key, provides clean dimming of the background workspace, and adheres to the locked 14px panel curvature.
        </p>
      </Modal>
    </AppShell>
  );
}
