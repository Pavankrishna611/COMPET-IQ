export interface TrainingMetricSummary {
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  totalLearningHours: number;
}

export interface TrainingTrendPoint {
  month: string;
  activeLearners: number;
  completedCourses: number;
}

export interface CourseCompletionStatusSlice {
  name: string;
  count: number;
  color: string;
  percentage: number;
}

export interface PopularCourseItem {
  rank: number;
  courseName: string;
  provider: string;
  enrollments: number;
  completionRate: number; // percentage
  averageScore: number; // percentage
  duration: string;
  domain: string;
}

export interface TrainingEffectivenessItem {
  skill: string;
  beforeTraining: number; // percentage
  afterTraining: number; // percentage
  improvement: number; // +19%
  category: string;
}

export interface DepartmentLearningHoursItem {
  department: string;
  shortName: string;
  totalHours: number;
  averageHoursPerOfficial: number;
  benchmark: number;
}

export interface LowEngagementAlertItem {
  id: string;
  department: string;
  metricLabel: string;
  metricValue: string;
  severity: 'Critical' | 'Warning' | 'Attention';
  recommendation: string;
  actionText: string;
}

export const mockTrainingSummary: TrainingMetricSummary = {
  totalEnrollments: 18420,
  completionRate: 76,
  averageScore: 82,
  totalLearningHours: 64820,
};

export const mockTrainingTrends: TrainingTrendPoint[] = [
  { month: 'April', activeLearners: 5420, completedCourses: 3100 },
  { month: 'May', activeLearners: 5980, completedCourses: 3950 },
  { month: 'June', activeLearners: 6640, completedCourses: 4820 },
  { month: 'July', activeLearners: 7190, completedCourses: 5740 },
  { month: 'August', activeLearners: 7850, completedCourses: 7120 },
  { month: 'September', activeLearners: 8231, completedCourses: 8231 },
];

export const mockCourseCompletionSlices: CourseCompletionStatusSlice[] = [
  { name: 'Completed', count: 8231, color: '#0D9488', percentage: 65.6 },
  { name: 'In Progress', count: 3109, color: '#F59E0B', percentage: 24.8 },
  { name: 'Not Started', count: 1200, color: '#94A3B8', percentage: 9.6 },
];

export const mockPopularCourses: PopularCourseItem[] = [
  {
    rank: 1,
    courseName: 'Python for Statistical Analysis',
    provider: 'iGOT Karmayogi',
    enrollments: 2840,
    completionRate: 78,
    averageScore: 84,
    duration: '24 Hours',
    domain: 'Technical',
  },
  {
    rank: 2,
    courseName: 'SQL for Data Analysis & Query Optimization',
    provider: 'NSSTA Official',
    enrollments: 2420,
    completionRate: 81,
    averageScore: 82,
    duration: '18 Hours',
    domain: 'Technical',
  },
  {
    rank: 3,
    courseName: 'Data Visualization Basics & Dashboard Design',
    provider: 'MoSPI Academy',
    enrollments: 2180,
    completionRate: 74,
    averageScore: 79,
    duration: '16 Hours',
    domain: 'Technical',
  },
  {
    rank: 4,
    courseName: 'GIS Fundamentals & Spatial Cadastral Mapping',
    provider: 'National Remote Sensing Centre',
    enrollments: 1920,
    completionRate: 68,
    averageScore: 76,
    duration: '32 Hours',
    domain: 'Technical',
  },
  {
    rank: 5,
    courseName: 'AI / ML Fundamentals for Statistical Workflows',
    provider: 'Digital India / NeGD',
    enrollments: 1780,
    completionRate: 71,
    averageScore: 81,
    duration: '28 Hours',
    domain: 'Emerging AI',
  },
  {
    rank: 6,
    courseName: 'National Accounts Statistics & GDP Compilation',
    provider: 'NSSTA Official',
    enrollments: 1640,
    completionRate: 86,
    averageScore: 88,
    duration: '36 Hours',
    domain: 'Statistical Methods',
  },
];

export const mockTrainingEffectiveness: TrainingEffectivenessItem[] = [
  {
    skill: 'Python',
    beforeTraining: 48,
    afterTraining: 67,
    improvement: 19,
    category: 'Statistical Programming',
  },
  {
    skill: 'SQL',
    beforeTraining: 54,
    afterTraining: 71,
    improvement: 17,
    category: 'Database Management',
  },
  {
    skill: 'Data Visualization',
    beforeTraining: 52,
    afterTraining: 69,
    improvement: 17,
    category: 'Reporting & Dissemination',
  },
  {
    skill: 'GIS',
    beforeTraining: 46,
    afterTraining: 61,
    improvement: 15,
    category: 'Spatial Analytics',
  },
];

export const mockDepartmentLearningHours: DepartmentLearningHoursItem[] = [
  {
    department: 'Economic Statistics',
    shortName: 'Economic',
    totalHours: 14850,
    averageHoursPerOfficial: 6.9,
    benchmark: 5.2,
  },
  {
    department: 'Social Statistics',
    shortName: 'Social',
    totalHours: 12940,
    averageHoursPerOfficial: 6.5,
    benchmark: 5.2,
  },
  {
    department: 'Industry Statistics',
    shortName: 'Industry',
    totalHours: 11200,
    averageHoursPerOfficial: 5.5,
    benchmark: 5.2,
  },
  {
    department: 'Agriculture Statistics',
    shortName: 'Agriculture',
    totalHours: 10450,
    averageHoursPerOfficial: 4.7,
    benchmark: 5.2,
  },
  {
    department: 'Labour Statistics',
    shortName: 'Labour',
    totalHours: 8140,
    averageHoursPerOfficial: 4.6,
    benchmark: 5.2,
  },
  {
    department: 'Geographic Statistics',
    shortName: 'Geographic',
    totalHours: 7240,
    averageHoursPerOfficial: 3.0,
    benchmark: 5.2,
  },
];

export const mockLowEngagementAlerts: LowEngagementAlertItem[] = [
  {
    id: 'ALERT-01',
    department: 'Labour Statistics',
    metricLabel: 'Learning Completion Rate',
    metricValue: '68%',
    severity: 'Warning',
    recommendation: 'Increase targeted learning engagement via mandatory micro-learning modules.',
    actionText: 'Notify Wing Leadership',
  },
  {
    id: 'ALERT-02',
    department: 'Geographic Statistics',
    metricLabel: 'Average Learning Hours',
    metricValue: '3.0 hrs / official (42% below org average)',
    severity: 'Critical',
    recommendation: 'Prioritize competency development programs and allocate protected weekly study hours.',
    actionText: 'Assign Mandatory Track',
  },
];
