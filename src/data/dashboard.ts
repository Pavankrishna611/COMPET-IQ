/**
 * COMPETIQ Learner Intelligence Dashboard Mock Data
 * Structured domain data for Indian Official Statistical System (MoSPI/ISS/SSS)
 */

export interface DashboardMetric {
  id: string;
  title: string;
  value: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle?: string;
  iconName: 'TrendingUp' | 'AlertTriangle' | 'Clock' | 'GraduationCap';
  accent: 'blue' | 'critical' | 'teal' | 'ai';
}

export interface RadarDomainScore {
  domain: string;
  score: number;
  fullMark: number;
}

export interface CompetencyCategorySummary {
  overallScore: number;
  summaryText: string;
  strong: string[];
  good: string[];
  developing: string[];
}

export interface PrioritySkillGapItem {
  id: string;
  skillName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  description: string;
  domain: string;
}

export interface LearningJourneyStep {
  stepNumber: number;
  title: string;
  provider: string;
  status: 'completed' | 'in_progress' | 'recommended' | 'upcoming';
  progress?: number;
  duration: string;
  skill: string;
}

export interface CourseRecommendationItem {
  id: string;
  title: string;
  provider: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  matchScore: number;
  whyRecommended: string;
  skills: string[];
}

export interface ActivityItem {
  id: string;
  type: 'course_completed' | 'assessment_passed' | 'competency_improved' | 'recommendation_new';
  title: string;
  meta: string;
  timestamp: string;
  score?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  href: string;
  iconName: 'CheckSquare' | 'BookOpen' | 'Bot' | 'AlertTriangle';
  variant: 'primary' | 'secondary' | 'teal' | 'ai';
}

// 1. Welcome Hero Context
export const learnerProfileOverview = {
  officerName: 'Arjun Kumar',
  greetingName: 'Arjun',
  role: 'Statistical Investigator',
  subtitle: "Here's your personalized competency and learning overview.",
  cadre: 'Subordinate Statistical Service (SSS)',
  department: 'Economic Statistics',
  division: 'National Accounts Division (NAD)',
  lastAnalyzedStatus: 'Profile last analyzed: Today',
  aiStatus: {
    badge: 'COMPETIQ Intelligence',
    title: 'Adaptive Optimization Active',
    description: 'Your learning profile is actively optimized based on competency gaps and learning progress.',
    status: 'Analysis Complete',
  },
};

// 2. Key Metrics (4 StatCards)
export const learnerKeyMetrics: DashboardMetric[] = [
  {
    id: 'overall-competency',
    title: 'Overall Competency',
    value: '78%',
    trend: {
      value: '+6.4% this month',
      direction: 'up',
    },
    iconName: 'TrendingUp',
    accent: 'blue',
  },
  {
    id: 'critical-gaps',
    title: 'Critical Skill Gaps',
    value: '4',
    subtitle: '2 improved this month',
    iconName: 'AlertTriangle',
    accent: 'critical',
  },
  {
    id: 'learning-hours',
    title: 'Learning Hours',
    value: '32.5h',
    trend: {
      value: '+8.5h this month',
      direction: 'up',
    },
    iconName: 'Clock',
    accent: 'teal',
  },
  {
    id: 'courses-completed',
    title: 'Courses Completed',
    value: '12',
    subtitle: '3 this month',
    iconName: 'GraduationCap',
    accent: 'ai',
  },
];

// 3. Competency Overview (Radar Chart)
export const competencyRadarData: RadarDomainScore[] = [
  { domain: 'Statistical Methods', score: 82, fullMark: 100 },
  { domain: 'Python', score: 42, fullMark: 100 },
  { domain: 'SQL', score: 68, fullMark: 100 },
  { domain: 'Data Visualization', score: 48, fullMark: 100 },
  { domain: 'GIS', score: 40, fullMark: 100 },
  { domain: 'AI/ML', score: 52, fullMark: 100 },
  { domain: 'Digital Governance', score: 74, fullMark: 100 },
  { domain: 'Leadership', score: 70, fullMark: 100 },
];

export const competencyCategoriesSummary: CompetencyCategorySummary = {
  overallScore: 78,
  summaryText: 'Strong statistical foundation with opportunities to improve technical and emerging digital skills.',
  strong: ['Statistical Methods'],
  good: ['SQL', 'Digital Governance'],
  developing: ['Python', 'Data Visualization', 'GIS'],
};

// 4. AI-Identified Skill Gaps (3 Priority Cards)
export const prioritySkillGaps: PrioritySkillGapItem[] = [
  {
    id: 'gap-python',
    skillName: 'Python for Data Analysis',
    priority: 'CRITICAL',
    currentLevel: 2.1,
    requiredLevel: 4.0,
    gap: 1.9,
    description: 'Essential for statistical data processing and automation.',
    domain: 'Data Science & Programming',
  },
  {
    id: 'gap-dataviz',
    skillName: 'Data Visualization',
    priority: 'HIGH',
    currentLevel: 2.4,
    requiredLevel: 4.0,
    gap: 1.6,
    description: 'Important for communicating insights from official statistical data.',
    domain: 'Analytics & Reporting',
  },
  {
    id: 'gap-gis',
    skillName: 'GIS',
    priority: 'HIGH',
    currentLevel: 2.0,
    requiredLevel: 3.5,
    gap: 1.5,
    description: 'Required for spatial analysis and geographic statistical applications.',
    domain: 'Spatial & Survey Analytics',
  },
];

// 5. Personalized Learning Path (5 Steps)
export const learnerLearningPathSteps: LearningJourneyStep[] = [
  {
    stepNumber: 1,
    title: 'Python Fundamentals',
    provider: 'iGOT Karmayogi',
    status: 'completed',
    duration: '6 hours',
    skill: 'Python Basics',
  },
  {
    stepNumber: 2,
    title: 'Python for Statistical Analysis',
    provider: 'iGOT Karmayogi',
    status: 'in_progress',
    progress: 65,
    duration: '8 hours',
    skill: 'Statistical Programming',
  },
  {
    stepNumber: 3,
    title: 'SQL for Data Analysis',
    provider: 'iGOT Karmayogi',
    status: 'recommended',
    duration: '7 hours',
    skill: 'Database Analysis',
  },
  {
    stepNumber: 4,
    title: 'GIS for Statistical Applications',
    provider: 'NSSTA / TPAC',
    status: 'recommended',
    duration: '10 hours',
    skill: 'Spatial Analysis',
  },
  {
    stepNumber: 5,
    title: 'Applied Statistical Data Project',
    provider: 'NSSTA / TPAC',
    status: 'upcoming',
    duration: '12 hours',
    skill: 'Applied Analytics',
  },
];

// 6. Top AI Recommendations (3 Courses)
export const topAiCourseRecommendations: CourseRecommendationItem[] = [
  {
    id: 'rec-python-stats',
    title: 'Python for Statistical Analysis',
    provider: 'iGOT Karmayogi',
    difficulty: 'Intermediate',
    duration: '8 hours',
    matchScore: 94,
    whyRecommended: 'Your current assignment requires data analysis and your Python competency is below the required level.',
    skills: ['Python', 'Pandas & NumPy', 'Statistical Computing'],
  },
  {
    id: 'rec-data-viz',
    title: 'Data Visualization with Python',
    provider: 'iGOT Karmayogi',
    difficulty: 'Intermediate',
    duration: '6 hours',
    matchScore: 91,
    whyRecommended: 'Improves your ability to communicate insights through statistical visualizations.',
    skills: ['Matplotlib', 'Seaborn', 'Statistical Plots'],
  },
  {
    id: 'rec-gis-stats',
    title: 'GIS for Government Statistics',
    provider: 'NSSTA / TPAC',
    difficulty: 'Beginner',
    duration: '10 hours',
    matchScore: 88,
    whyRecommended: 'Addresses a critical spatial analysis competency gap.',
    skills: ['Spatial Analysis', 'QGIS', 'Official Mapping'],
  },
];

// 7. Recent Activity (4 Activities)
export const recentActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'course_completed',
    title: 'Python Basics',
    meta: 'Course Completed',
    timestamp: 'Completed 2 days ago',
  },
  {
    id: 'act-2',
    type: 'assessment_passed',
    title: 'Sampling Techniques Assessment',
    meta: 'Diagnostic Evaluation',
    score: '88%',
    timestamp: 'Completed 4 days ago',
  },
  {
    id: 'act-3',
    type: 'competency_improved',
    title: 'SQL competency improved',
    meta: 'Benchmark Progression',
    score: '+0.4 level',
    timestamp: '5 days ago',
  },
  {
    id: 'act-4',
    type: 'recommendation_new',
    title: 'GIS for Statistical Applications',
    meta: 'AI Curriculum Match',
    timestamp: 'Recommended today',
  },
];

// 8. Quick Actions (4 Actions)
export const dashboardQuickActions: QuickActionItem[] = [
  {
    id: 'qa-assessments',
    label: 'Take Assessment',
    description: 'Verify domain competencies',
    href: '/learner/assessments',
    iconName: 'CheckSquare',
    variant: 'primary',
  },
  {
    id: 'qa-courses',
    label: 'Explore Courses',
    description: 'Access NSSTA & iGOT catalog',
    href: '/learner/courses',
    iconName: 'BookOpen',
    variant: 'secondary',
  },
  {
    id: 'qa-assistant',
    label: 'Ask AI Assistant',
    description: 'Statistical methodology mentor',
    href: '/learner/assistant',
    iconName: 'Bot',
    variant: 'ai',
  },
  {
    id: 'qa-skill-gaps',
    label: 'View Skill Gaps',
    description: 'Inspect cadre level differentials',
    href: '/learner/skill-gaps',
    iconName: 'AlertTriangle',
    variant: 'teal',
  },
];
