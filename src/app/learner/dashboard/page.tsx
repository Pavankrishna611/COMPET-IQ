'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  WelcomeHero,
  MetricsGrid,
  CompetencyRadarChart,
  SkillGapsSection,
  LearningPathJourney,
  RecommendationsSection,
  ActivityTimeline,
  QuickActions,
} from '@/components/dashboard';
import {
  competencyService,
  skillGapService,
  learningPathService,
  recommendationService,
  watchTimeService,
} from '@/services';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { learnerKeyMetrics, competencyRadarData, prioritySkillGaps, topAiCourseRecommendations } from '@/data/dashboard';

export default function LearnerDashboardPage() {
  const { isAuthenticated, isLoading: authLoading, user, currentUser, isDemoMode } = useAuth();
  const activeUser = currentUser || user;
  const isDemo = isDemoMode || activeUser?.email === 'arjun.kumar@mospi.gov.in';
  const userId = activeUser?.id || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<typeof learnerKeyMetrics | undefined>(undefined);
  const [radarData, setRadarData] = useState<typeof competencyRadarData | undefined>(undefined);
  const [skillGapsList, setSkillGapsList] = useState<any[] | undefined>(undefined);
  const [pathSteps, setPathSteps] = useState<any[] | undefined>(undefined);
  const [recommendationsList, setRecommendationsList] = useState<any[] | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);

        // Concurrent real API & watch time fetches
        const [compsRes, gapRes, pathRes, recsRes, watchTimeData] = await Promise.all([
          competencyService.getMyCompetencies().catch(() => []),
          skillGapService.getMySkillGaps().catch(() => null),
          learningPathService.getMyActiveLearningPath().catch(() => null),
          recommendationService.getMyRecommendations(3).catch(() => []),
          watchTimeService.getUserWatchTime(userId, isDemo),
        ]);

        if (!isMounted) return;

        // 1. Overall Competency Card
        let avgCompetency = 0.0;
        let competencySubtitle = 'No assessed competencies yet';
        let competencyTrend: { value: string; direction: 'up' | 'down' | 'neutral' } = {
          value: 'Take assessment to calibrate',
          direction: 'neutral',
        };

        if (gapRes && gapRes.summary) {
          avgCompetency = gapRes.summary.average_competency;
          competencySubtitle = compsRes.length > 0
            ? `Based on ${compsRes.length} assessed competencies`
            : 'Based on role baseline requirements';
          competencyTrend = avgCompetency > 0
            ? { value: '+0.4 vs last quarter', direction: 'up' }
            : { value: 'Complete initial assessment', direction: 'neutral' };
        } else if (compsRes.length > 0) {
          avgCompetency = compsRes.reduce((sum, c) => sum + c.current_level, 0) / compsRes.length;
          competencySubtitle = `Based on ${compsRes.length} assessed competencies`;
          competencyTrend = { value: 'Calibrated baseline', direction: 'up' };
        }

        // 2. Critical Skill Gaps Card
        const criticalGapsCount = gapRes?.summary ? gapRes.summary.critical_gaps : 0;
        const gapsSubtitle = criticalGapsCount > 0
          ? 'Requires training intervention'
          : compsRes.length === 0
          ? 'Calibrate profile to identify gaps'
          : 'All critical requirements met';
        const gapsTrend: { value: string; direction: 'up' | 'down' | 'neutral' } = criticalGapsCount > 0
          ? { value: 'Targeted in learning plan', direction: 'neutral' }
          : { value: 'No critical gaps', direction: 'up' };

        // 3. Dynamic Learning Hours (Watch Time) Card
        const totalWatchHours = watchTimeData.totalWatchHours;
        const watchSubtitle = totalWatchHours === 0
          ? 'No courses completed yet'
          : watchTimeData.completedCoursesCount > 0
          ? `${watchTimeData.completedCoursesCount} module${watchTimeData.completedCoursesCount > 1 ? 's' : ''} completed`
          : 'iGOT & NSSTA synced watch time';
        const watchTrend: { value: string; direction: 'up' | 'down' | 'neutral' } = totalWatchHours === 0
          ? { value: 'Ready to start learning', direction: 'neutral' }
          : { value: `+${watchTimeData.recentHoursThisMonth.toFixed(1)}h this month`, direction: 'up' };

        // 4. Learning Path Progress Card
        const totalModules = watchTimeData.totalCoursesCount;
        const completedModules = watchTimeData.completedCoursesCount;
        const pathProgressValue = totalModules > 0
          ? `${completedModules} / ${totalModules} Modules`
          : '0 / 0 Modules';
        const pathProgressSubtitle = totalModules > 0
          ? 'Active personalized path'
          : 'No active path generated yet';
        const pathProgressTrend: { value: string; direction: 'up' | 'down' | 'neutral' } = totalModules > 0
          ? {
              value: `${watchTimeData.completionRatePercent}% completion rate`,
              direction: watchTimeData.completionRatePercent > 0 ? 'up' : 'neutral',
            }
          : { value: 'Generate path to begin', direction: 'neutral' };

        // Set dynamic cards
        setDashboardMetrics([
          {
            id: 'm1',
            title: 'Overall Competency',
            value: `${avgCompetency.toFixed(1)} / 5.0`,
            subtitle: competencySubtitle,
            trend: competencyTrend,
            iconName: 'TrendingUp',
            accent: 'blue',
          },
          {
            id: 'm2',
            title: 'Critical Skill Gaps',
            value: `${criticalGapsCount} Priority Gap${criticalGapsCount === 1 ? '' : 's'}`,
            subtitle: gapsSubtitle,
            trend: gapsTrend,
            iconName: 'AlertTriangle',
            accent: 'critical',
          },
          {
            id: 'm3',
            title: 'Learning Hours',
            value: `${totalWatchHours.toFixed(1)} Hours`,
            subtitle: watchSubtitle,
            trend: watchTrend,
            iconName: 'Clock',
            accent: 'teal',
          },
          {
            id: 'm4',
            title: 'Learning Path Progress',
            value: pathProgressValue,
            subtitle: pathProgressSubtitle,
            trend: pathProgressTrend,
            iconName: 'GraduationCap',
            accent: 'teal',
          },
        ]);

        // Map skill gaps
        if (gapRes?.skill_gaps && gapRes.skill_gaps.length > 0) {
          const mappedGaps = gapRes.skill_gaps.slice(0, 3).map((g) => ({
            id: g.competency_id,
            skillName: g.competency_name,
            domain: g.domain,
            priority: g.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            currentLevel: g.current_level,
            requiredLevel: g.required_level,
            gap: g.gap,
            description: g.recommended_action || 'Complete foundational and intermediate training modules.',
          }));
          setSkillGapsList(mappedGaps);
        } else {
          setSkillGapsList([]);
        }

        // Map Competencies & Radar Data
        if (compsRes && compsRes.length > 0) {
          const mappedRadar = compsRes.slice(0, 8).map((uc) => ({
            domain: uc.competency.name,
            score: Math.round((uc.current_level / 5) * 100),
            fullMark: 100,
          }));
          setRadarData(mappedRadar);
        } else {
          setRadarData(isDemo ? competencyRadarData : []);
        }

        // Map Learning Path steps
        if (pathRes && pathRes.items && pathRes.items.length > 0) {
          const mappedSteps = pathRes.items.map((item) => ({
            stepNumber: item.sequence_order,
            title: item.course.title,
            provider: item.course.provider,
            duration: `${item.estimated_duration_hours}h`,
            skill: item.reason || 'Core Skill',
            status: item.status.toLowerCase() as any,
            progress: item.status === 'COMPLETED' ? 100 : item.status === 'IN_PROGRESS' ? 45 : 0,
          }));
          setPathSteps(mappedSteps);
        } else if (isDemo) {
          // Keep demo sequence for pre-seeded demo user
          setPathSteps(undefined);
        } else {
          // Empty array to render "Generate Learning Path" card for newly registered accounts
          setPathSteps([]);
        }

        // Map Course Recommendations
        if (recsRes && recsRes.length > 0) {
          const mappedRecs = recsRes.slice(0, 3).map((r) => ({
            id: r.course_id,
            title: r.course_title,
            provider: r.provider,
            matchScore: Math.round(r.score * 100) || 88,
            duration: `${r.duration_hours} Hours`,
            difficulty: r.difficulty || 'Intermediate',
            whyRecommended: r.recommendation_reasons?.join('. ') || 'Targeted to address active competency requirements.',
            skills: r.targeted_competencies && r.targeted_competencies.length > 0 ? r.targeted_competencies : ['Statistical Computing'],
          }));
          setRecommendationsList(mappedRecs);
        } else {
          setRecommendationsList(isDemo ? topAiCourseRecommendations : []);
        }
      } catch (err) {
        console.warn('Dashboard live fetch encountered an issue:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    // Subscribe to watch time updates across tabs and interactive sessions
    const unsubscribe = watchTimeService.subscribeToUpdates(() => {
      loadDashboardData();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isAuthenticated, authLoading, userId, isDemo]);

  return (
    <AppShell
      title="Learner Intelligence Dashboard"
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Dashboard' },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-6 lg:space-y-8 pb-12">
        {/* 1. WELCOME HERO SECTION */}
        <WelcomeHero />

        {/* 2. KEY METRICS */}
        {loading && !dashboardMetrics ? (
          <div className="p-8 bg-surface border border-border rounded-panel text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-text-secondary font-medium">
              Loading competency and skill gap metrics...
            </span>
          </div>
        ) : (
          <MetricsGrid metrics={dashboardMetrics} />
        )}

        {/* 3. COMPETENCY OVERVIEW */}
        <CompetencyRadarChart data={radarData} />

        {/* 4. AI SKILL GAP ANALYSIS */}
        <SkillGapsSection gaps={skillGapsList} />

        {/* 5. PERSONALIZED LEARNING PATH */}
        <LearningPathJourney steps={pathSteps} />

        {/* 6. TOP AI RECOMMENDATIONS */}
        <RecommendationsSection recommendations={recommendationsList} />

        {/* 7 & 8. RECENT ACTIVITY + QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6">
            <ActivityTimeline />
          </div>
          <div className="lg:col-span-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
