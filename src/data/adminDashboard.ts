export interface DepartmentSkillHealthItem {
  id: string;
  department: string;
  officials: number;
  averageCompetency: number; // percentage, e.g. 78
  criticalGaps: number; // percentage, e.g. 12
  trainingCompletion: number; // percentage, e.g. 84
  status: 'Strong' | 'Good' | 'Needs Attention' | 'Critical';
}

export interface TopSkillGapItem {
  id: string;
  name: string;
  category: string;
  currentProficiency: number; // e.g. 48%
  requiredProficiency: number; // e.g. 75%
  gap: number; // e.g. 27%
  affectedOfficials: number; // e.g. 4,820
  priority: 'Critical' | 'High' | 'Moderate';
}

export interface WorkforceInsightItem {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  badgeVariant: 'critical' | 'warning' | 'info' | 'teal';
  impactOrTrend: string;
  affectedDepartments: string[];
  recommendedAction: string;
  actionButtonText: string;
  actionUrl: string;
}

export interface PriorityAlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  departmentScope?: string;
  timestamp: string;
}

export interface CompetencyTrendPoint {
  month: string;
  score: number; // e.g. 66
  benchmark: number;
}

export interface CompetencyDistributionSlice {
  name: string;
  value: number; // e.g. 18
  color: string;
}

export interface LearningEngagementMetrics {
  enrolled: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

// 1. Department Skill Health Table Data
export const mockDepartmentHealth: DepartmentSkillHealthItem[] = [
  {
    id: 'dept-econ',
    department: 'Economic Statistics',
    officials: 2140,
    averageCompetency: 78,
    criticalGaps: 12,
    trainingCompletion: 84,
    status: 'Strong',
  },
  {
    id: 'dept-soc',
    department: 'Social Statistics',
    officials: 1980,
    averageCompetency: 74,
    criticalGaps: 16,
    trainingCompletion: 79,
    status: 'Good',
  },
  {
    id: 'dept-ind',
    department: 'Industry Statistics',
    officials: 2050,
    averageCompetency: 73,
    criticalGaps: 17,
    trainingCompletion: 76,
    status: 'Good',
  },
  {
    id: 'dept-agr',
    department: 'Agriculture Statistics',
    officials: 2220,
    averageCompetency: 71,
    criticalGaps: 21,
    trainingCompletion: 72,
    status: 'Needs Attention',
  },
  {
    id: 'dept-lab',
    department: 'Labour Statistics',
    officials: 1760,
    averageCompetency: 69,
    criticalGaps: 24,
    trainingCompletion: 68,
    status: 'Needs Attention',
  },
  {
    id: 'dept-geo',
    department: 'Geographic Statistics',
    officials: 2390,
    averageCompetency: 66,
    criticalGaps: 28,
    trainingCompletion: 63,
    status: 'Critical',
  },
];

// 2. Top Organizational Skill Gaps
export const mockTopSkillGaps: TopSkillGapItem[] = [
  {
    id: 'gap-py',
    name: 'Python for Data Processing',
    category: 'Technical Computing',
    currentProficiency: 48,
    requiredProficiency: 75,
    gap: 27,
    affectedOfficials: 4820,
    priority: 'Critical',
  },
  {
    id: 'gap-aiml',
    name: 'AI / Machine Learning Imputation',
    category: 'Advanced Analytics',
    currentProficiency: 42,
    requiredProficiency: 70,
    gap: 28,
    affectedOfficials: 5130,
    priority: 'Critical',
  },
  {
    id: 'gap-gis',
    name: 'GIS Spatial Aggregation',
    category: 'Geospatial Analytics',
    currentProficiency: 46,
    requiredProficiency: 68,
    gap: 22,
    affectedOfficials: 3740,
    priority: 'High',
  },
  {
    id: 'gap-vis',
    name: 'Data Visualization & Reporting',
    category: 'Official Dissemination',
    currentProficiency: 54,
    requiredProficiency: 75,
    gap: 21,
    affectedOfficials: 3420,
    priority: 'High',
  },
  {
    id: 'gap-sec',
    name: 'Cybersecurity & Microdata Hygiene',
    category: 'Digital Governance',
    currentProficiency: 58,
    requiredProficiency: 80,
    gap: 22,
    affectedOfficials: 2950,
    priority: 'High',
  },
  {
    id: 'gap-sql',
    name: 'Advanced SQL Query Windowing',
    category: 'Relational Database',
    currentProficiency: 60,
    requiredProficiency: 78,
    gap: 18,
    affectedOfficials: 2610,
    priority: 'Moderate',
  },
];

// 3. AI Workforce Insights (3 Cards)
export const mockWorkforceInsights: WorkforceInsightItem[] = [
  {
    id: 'ins-1',
    title: 'AI/ML Skill Gap Detected',
    description: '68% of officials in analytical roles are currently below the recommended AI/ML competency threshold.',
    badgeText: 'High Impact',
    badgeVariant: 'critical',
    impactOrTrend: 'Impact: High',
    affectedDepartments: ['Economic Statistics', 'Industry Statistics', 'Social Statistics'],
    recommendedAction: 'Launch targeted AI/ML learning pathways.',
    actionButtonText: 'View Affected Workforce',
    actionUrl: '/admin/workforce',
  },
  {
    id: 'ins-2',
    title: 'Python Demand Increasing',
    description: 'Python competency requirements are increasing across statistical data processing and analytical roles.',
    badgeText: 'Increasing Trend',
    badgeVariant: 'warning',
    impactOrTrend: 'Trend: Increasing',
    affectedDepartments: ['Agriculture Statistics', 'Labour Statistics', 'Geographic Statistics'],
    recommendedAction: 'Prioritize Python training for data-intensive roles.',
    actionButtonText: 'Create Training Plan',
    actionUrl: '/admin/training',
  },
  {
    id: 'ins-3',
    title: 'Training Opportunity Identified',
    description: 'Officials with low Data Visualization competency demonstrate lower analytical reporting confidence.',
    badgeText: '+12% Potential Gain',
    badgeVariant: 'teal',
    impactOrTrend: 'Potential Improvement: +12%',
    affectedDepartments: ['Labour Statistics', 'Geographic Statistics'],
    recommendedAction: 'Assign visualization-focused learning modules.',
    actionButtonText: 'Explore Recommendation',
    actionUrl: '/admin/insights',
  },
];

// 4. Critical Alerts Panel
export const mockPriorityAlerts: PriorityAlertItem[] = [
  {
    id: 'alt-1',
    severity: 'CRITICAL',
    message: 'Geographic Statistics department has the highest skill gap percentage (28%).',
    departmentScope: 'Geographic Statistics',
    timestamp: '2 hours ago',
  },
  {
    id: 'alt-2',
    severity: 'HIGH',
    message: 'AI/ML competency below target across 5 departments.',
    departmentScope: 'Pan-Departmental',
    timestamp: 'Yesterday',
  },
  {
    id: 'alt-3',
    severity: 'MEDIUM',
    message: 'Learning completion rate below 70% in Labour Statistics.',
    departmentScope: 'Labour Statistics',
    timestamp: '2 days ago',
  },
];

// 5. Competency Distribution Slices (Donut Chart)
export const mockCompetencyDistribution: CompetencyDistributionSlice[] = [
  { name: 'Advanced', value: 18, color: '#0D9488' }, // teal
  { name: 'Proficient', value: 34, color: '#123B66' }, // navy primary
  { name: 'Developing', value: 30, color: '#F59E0B' }, // warning amber
  { name: 'Critical Gap', value: 18, color: '#E11D48' }, // critical rose
];

// 6. 6-Month Competency Growth Trend (Line Chart)
export const mockCompetencyTrend: CompetencyTrendPoint[] = [
  { month: 'April', score: 66, benchmark: 70 },
  { month: 'May', score: 67, benchmark: 70 },
  { month: 'June', score: 68, benchmark: 70 },
  { month: 'July', score: 69, benchmark: 70 },
  { month: 'August', score: 71, benchmark: 70 },
  { month: 'September', score: 72, benchmark: 70 },
];

// 7. Learning Engagement Analytics
export const mockLearningEngagement: LearningEngagementMetrics = {
  enrolled: 12540,
  inProgress: 4309,
  completed: 8231,
  completionRate: 76,
};
