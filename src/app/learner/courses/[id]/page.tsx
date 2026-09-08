'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  mockDetailedCourses, 
  DetailedCourse 
} from '@/data/courses';
import { 
  CourseModulesAccordion, 
  CourseRecommendationPanel, 
  RelatedCoursesSection 
} from '@/components/courses';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AppShell } from '@/components/layout/AppShell';
import { courseService, watchTimeService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { CourseResponse } from '@/types/api';

import { 
  ChevronRight, 
  Clock, 
  Layers, 
  Star, 
  Users, 
  Bookmark, 
  PlayCircle, 
  CheckCircle2, 
  ArrowLeft, 
  FileText, 
  Sparkles,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function CourseDetailPage({ params }: PageProps) {
  const { id } = params;

  const initialMatch =
    mockDetailedCourses.find((c) => c.id === id) ||
    mockDetailedCourses.find((c) => c.id.toLowerCase() === id.toLowerCase()) ||
    null;

  const { user: authUser, currentUser } = useAuth();
  const activeUser = currentUser || authUser;
  const userId = activeUser?.id || '';

  const [course, setCourse] = useState<DetailedCourse | null>(initialMatch);
  const [isLoading, setIsLoading] = useState<boolean>(!initialMatch);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  useEffect(() => {
    let isMounted = true;

    const fetchCourse = async () => {
      try {
        if (!initialMatch) {
          setIsLoading(true);
        }
        const res = await courseService.getCourseDetails(id);
        if (res && isMounted) {
          const providerVal: DetailedCourse['provider'] = res.provider?.includes('iGOT')
            ? 'iGOT Karmayogi'
            : res.provider?.includes('NSSTA')
            ? 'NSSTA / TPAC'
            : 'COMPETIQ Learning';

          const domainVal: DetailedCourse['domain'] = res.domain?.includes('Tech')
            ? 'Technical'
            : res.domain?.includes('Gov')
            ? 'Digital Governance'
            : res.domain?.includes('Beh')
            ? 'Behavioural'
            : 'Statistical Methods';

          const diffMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
            BEGINNER: 'Beginner',
            INTERMEDIATE: 'Intermediate',
            ADVANCED: 'Advanced',
            Beginner: 'Beginner',
            Intermediate: 'Intermediate',
            Advanced: 'Advanced',
          };

          const dynamicCourse: DetailedCourse = {
            id: res.id,
            title: res.title,
            provider: providerVal,
            domain: domainVal,
            difficulty: diffMap[res.difficulty] || 'Intermediate',
            duration: `${res.duration_hours || 12} Hours`,
            durationHours: res.duration_hours || 12,
            rating: 4.8,
            enrolledCount: 142,
            isRecommended: true,
            recommendationScore: 94,
            whyRecommended: 'Aligned with MoSPI official capacity building guidelines.',
            skills: res.competencies && res.competencies.length > 0
              ? res.competencies.map((comp: any) => comp.competency_name)
              : ['Statistical Analysis', 'MoSPI Protocols'],
            description: res.description || 'Comprehensive training module aligned with cadre competency standards.',
            learningObjectives: [
              'Understand core theoretical principles and administrative workflows',
              'Apply practical tools to official survey pipelines',
              'Comply with National Statistical System standards',
            ],
            prerequisites: res.prerequisites?.map((p: any) => p.prerequisite_title) || ['Basic Office Computing'],
            modules: [
              {
                id: `m-${res.id}-1`,
                moduleNumber: 1,
                title: 'Foundations & Concepts',
                duration: '4 Hours',
                description: 'Core theoretical concepts and administrative workflows.',
              },
              {
                id: `m-${res.id}-2`,
                moduleNumber: 2,
                title: 'Practical Application & Tools',
                duration: '4 Hours',
                description: 'Hands-on practical sessions with official tools and methodologies.',
              },
              {
                id: `m-${res.id}-3`,
                moduleNumber: 3,
                title: 'Case Studies & Evaluation',
                duration: `${Math.max(2, (res.duration_hours || 12) - 8)} Hours`,
                description: 'Real-world case studies, MoSPI guidelines, and comprehensive assessment.',
              },
            ],
            expectedImprovement: {
              competency: res.competencies?.[0]?.competency_name || 'Statistical Domain',
              from: 'Level 2.0',
              to: 'Level 4.0',
            },
            relatedCourseIds: [],
          };

          setCourse(dynamicCourse);
        }
      } catch (err) {
        console.warn('Could not fetch backend course, keeping fallback if available:', err);
        if (!initialMatch && isMounted) {
          const fallback =
            mockDetailedCourses.find((c) => c.id === id) ||
            mockDetailedCourses.find((c) => c.id.toLowerCase() === id.toLowerCase()) ||
            (id.startsWith('crs') ? mockDetailedCourses[0] : null);
          setCourse(fallback);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCourse();

    return () => {
      isMounted = false;
    };
  }, [id, initialMatch]);

  if (isLoading) {
    return (
      <AppShell
        title="Loading Course..."
        breadcrumbs={[
          { label: 'COMPETIQ', href: '/' },
          { label: 'Learner' },
          { label: 'Courses', href: '/learner/courses' },
          { label: 'Loading...' },
        ]}
        defaultRole="learner"
      >
        <div className="p-12 max-w-3xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto animate-spin">
            <Loader2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading course details from MoSPI/iGOT catalog...
          </p>
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell
        title="Course Not Found"
        breadcrumbs={[
          { label: 'COMPETIQ', href: '/' },
          { label: 'Learner' },
          { label: 'Courses', href: '/learner/courses' },
          { label: 'Not Found' },
        ]}
        defaultRole="learner"
      >
        <div className="p-8 max-w-3xl mx-auto text-center space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Course Not Found
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              The course identifier <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{id}</code> could not be located in the MoSPI/iGOT catalog.
            </p>
            <Link href="/learner/courses">
              <Button variant="primary" size="md">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course Explorer
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleStartLearning = () => {
    if (userId) {
      watchTimeService.recordWatchHours(userId, 1.5);
      setToastMessage(`Course launched! Logged +1.5h watch time into your learning profile.`);
    } else {
      setToastMessage(`Course launched! Connecting to ${course.provider} learning environment...`);
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleToggleBookmark = () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    setToastMessage(nextState ? `Saved "${course.title}" to your list` : `Removed "${course.title}" from saved`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const providerBadgeStyles: Record<string, string> = {
    'iGOT Karmayogi': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    'NSSTA / TPAC': 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    'COMPETIQ Learning': 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
  };

  return (
    <AppShell
      title={course.title}
      breadcrumbs={[
        { label: 'COMPETIQ', href: '/' },
        { label: 'Learner' },
        { label: 'Courses', href: '/learner/courses' },
        { label: course.title },
      ]}
      defaultRole="learner"
    >
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/learner/courses" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Course Explorer
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 dark:text-slate-200 font-semibold truncate max-w-md">
          {course.title}
        </span>
      </nav>

      {/* Course Hero Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  providerBadgeStyles[course.provider] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {course.provider}
              </span>
              <Badge variant="neutral" size="sm">
                {course.domain}
              </Badge>
              <Badge
                variant={
                  course.difficulty === 'Beginner'
                    ? 'success'
                    : course.difficulty === 'Intermediate'
                    ? 'info'
                    : 'warning'
                }
                size="sm"
              >
                {course.difficulty} Level
              </Badge>

              {course.isRecommended && (
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {course.recommendationScore}% AI Match
                </span>
              )}
            </div>

            {/* Course Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              {course.title}
            </h1>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{course.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">{course.modules.length} Modules</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-900 dark:text-slate-100">{course.rating.toFixed(1)}</span>
                <span className="text-slate-400">({course.enrolledCount} enrolled)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>MoSPI Cadre Aligned</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-60">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartLearning}
              className="w-full justify-center text-sm font-semibold shadow-md shadow-indigo-600/20 gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Start Learning
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleToggleBookmark}
              className={`w-full justify-center text-xs font-semibold gap-2 ${
                isSaved
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
              {isSaved ? 'Saved to Profile' : 'Save Course'}
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              Synchronized with MoSPI Training Management Portal
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Content, Objectives, Modules) & Right Column (AI Panel, Path Context) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Overview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Course Overview
            </h2>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>

            {/* Target Skills */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Key Skills You&apos;ll Develop
              </h3>
              <div className="flex flex-wrap gap-2">
                {course.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              What You Will Learn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {course.learningObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-snug">
                    {obj}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Modules Accordion */}
          <CourseModulesAccordion
            modules={course.modules}
            completedModuleCount={course.id === 'crs-py-fund' ? course.modules.length : course.id === 'crs-py-stats' ? 3 : 0}
          />

          {/* Prerequisites */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Prerequisites &amp; Prior Knowledge
            </h2>
            <ul className="space-y-2">
              {course.prerequisites.map((req, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column (1 Col) - AI Recommendation & Pathway Context */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <CourseRecommendationPanel course={course} />
          </div>
        </div>
      </div>

      {/* Related Courses Section */}
      <RelatedCoursesSection
        currentCourseId={course.id}
        relatedCourseIds={course.relatedCourseIds}
      />
      </div>
    </AppShell>
  );
}
