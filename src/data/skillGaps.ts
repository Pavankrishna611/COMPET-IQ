/**
 * COMPETIQ AI Skill Gap Analysis Mock Data
 * Realistic intelligence datasets for official statistical cadre evaluations
 */

import { SkillGap } from '@/types';

export interface RoleContextInfo {
  role: string;
  department: string;
  division: string;
  roleLevel: string;
  framework: string;
  explanation: string;
  aiStatus: string;
  confidenceScore: number;
}

export interface SkillGapSummaryStat {
  id: string;
  title: string;
  count: number;
  description: string;
  accent: 'critical' | 'warning' | 'teal' | 'success';
}

export interface SkillGapMatrixItem {
  id: string;
  competency: string;
  domain: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE';
  recommendedAction: string;
  actionHref: string;
}

export interface ComparisonChartItem {
  skill: string;
  current: number;
  required: number;
  gap: number;
  category: string;
}

export interface DetailedPriorityGap {
  id: string;
  competency: string;
  priority: 'CRITICAL' | 'HIGH';
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  whyMatters: string;
  impact: 'High' | 'Critical';
  affectedWork: string[];
  recommendedLearning: string[];
  ctaText: string;
  ctaHref: string;
}

export interface WhyGapMattersDetail {
  id: string;
  name: string;
  roleRequirement: string;
  currentImpact: string;
  futureImpact: string;
  expectedBenefit: string;
  scoreImprovement: string;
}

export interface AIInsightContent {
  title: string;
  observation: string;
  recommendations: string[];
  confidenceScore: number;
  modelTimestamp: string;
}

export interface LearningImpactForecast {
  currentCompetency: number;
  projectedCompetency: number;
  estimatedImprovement: number;
  timeEstimate: string;
  disclaimer: string;
}

// 1. Role Context
export const roleContextData: RoleContextInfo = {
  role: 'Statistical Investigator',
  department: 'Economic Statistics',
  division: 'National Accounts Division (NAD)',
  roleLevel: 'Intermediate (Level 4 Officer)',
  framework: 'Official Statistical System (MoSPI / NSSTA)',
  explanation: 'COMPETIQ compares your assessed competencies against role-specific requirements to identify priority learning gaps.',
  aiStatus: 'AI Analysis Complete',
  confidenceScore: 92,
};

// 2. Skill Gap Summary Metrics
export const skillGapSummaryStats: SkillGapSummaryStat[] = [
  {
    id: 'crit',
    title: 'CRITICAL GAPS',
    count: 4,
    description: 'Gap > 1.0 • Immediate Intervention',
    accent: 'critical',
  },
  {
    id: 'high',
    title: 'HIGH PRIORITY',
    count: 5,
    description: 'Gap 0.6 - 1.0 • Target Quarter',
    accent: 'warning',
  },
  {
    id: 'mod',
    title: 'MODERATE GAPS',
    count: 6,
    description: 'Gap 0.1 - 0.5 • Developing Skills',
    accent: 'teal',
  },
  {
    id: 'str',
    title: 'STRONG COMPETENCIES',
    count: 8,
    description: 'Gap ≤ 0.0 • Benchmark Satisfied',
    accent: 'success',
  },
];

// 3. Skill Gap Matrix Table
export const skillGapMatrixData: SkillGapMatrixItem[] = [
  {
    id: 'sg-py',
    competency: 'Python for Data Analysis',
    domain: 'Technical',
    currentLevel: 2.1,
    requiredLevel: 4.0,
    gap: 1.9,
    priority: 'CRITICAL',
    recommendedAction: 'Start Python for Statistical Analysis',
    actionHref: '/learner/learning-path',
  },
  {
    id: 'sg-vis',
    competency: 'Data Visualization',
    domain: 'Technical',
    currentLevel: 2.4,
    requiredLevel: 4.0,
    gap: 1.6,
    priority: 'HIGH',
    recommendedAction: 'Complete visualization learning module',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-gis',
    competency: 'GIS for Spatial Analytics',
    domain: 'Technical',
    currentLevel: 2.0,
    requiredLevel: 3.5,
    gap: 1.5,
    priority: 'HIGH',
    recommendedAction: 'Start GIS Fundamentals',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-aiml',
    competency: 'AI / Machine Learning',
    domain: 'Technical',
    currentLevel: 2.6,
    requiredLevel: 3.5,
    gap: 0.9,
    priority: 'MODERATE',
    recommendedAction: 'Learn Machine Learning Basics',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-sql',
    competency: 'SQL & Database Analysis',
    domain: 'Technical',
    currentLevel: 3.4,
    requiredLevel: 4.0,
    gap: 0.6,
    priority: 'MODERATE',
    recommendedAction: 'Practice Advanced SQL',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-gcld',
    competency: 'Government Cloud (MeghRaj)',
    domain: 'Digital Governance',
    currentLevel: 2.9,
    requiredLevel: 3.5,
    gap: 0.6,
    priority: 'MODERATE',
    recommendedAction: 'Complete Sovereign Cloud Guidelines',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-cld',
    competency: 'Cloud Computing & Sandboxes',
    domain: 'Technical',
    currentLevel: 2.5,
    requiredLevel: 3.0,
    gap: 0.5,
    priority: 'MODERATE',
    recommendedAction: 'Review Virtualized Sandbox Setup',
    actionHref: '/learner/courses',
  },
  {
    id: 'sg-api',
    competency: 'APIs & Ingestion Pipelines',
    domain: 'Technical',
    currentLevel: 2.8,
    requiredLevel: 3.5,
    gap: 0.7,
    priority: 'MODERATE',
    recommendedAction: 'Study Open Government Data (OGD) APIs',
    actionHref: '/learner/courses',
  },
];

// 4. Current vs Required Chart Data (Grouped Horizontal Bars)
export const currentVsRequiredChartData: ComparisonChartItem[] = [
  { skill: 'Python', current: 2.1, required: 4.0, gap: 1.9, category: 'Technical' },
  { skill: 'Data Visualization', current: 2.4, required: 4.0, gap: 1.6, category: 'Technical' },
  { skill: 'GIS', current: 2.0, required: 3.5, gap: 1.5, category: 'Technical' },
  { skill: 'AI/ML', current: 2.6, required: 3.5, gap: 0.9, category: 'Technical' },
  { skill: 'SQL', current: 3.4, required: 4.0, gap: 0.6, category: 'Technical' },
  { skill: 'Cloud Computing', current: 2.5, required: 3.0, gap: 0.5, category: 'Technical' },
  { skill: 'Government Cloud', current: 2.9, required: 3.5, gap: 0.6, category: 'Governance' },
];

// 5. Priority Skill Gap Cards
export const detailedPriorityGaps: DetailedPriorityGap[] = [
  {
    id: 'd-gap-py',
    competency: 'Python for Data Analysis',
    priority: 'CRITICAL',
    currentLevel: 2.1,
    requiredLevel: 4.0,
    gap: 1.9,
    whyMatters: 'Your current role involves statistical data processing, automation and analysis. Python proficiency is required to efficiently process and analyze large datasets.',
    impact: 'High',
    affectedWork: ['Data Processing', 'Automation', 'Statistical Analysis'],
    recommendedLearning: ['Python Fundamentals', 'Python for Statistical Analysis', 'Applied Data Project'],
    ctaText: 'Start Learning Path',
    ctaHref: '/learner/learning-path',
  },
  {
    id: 'd-gap-vis',
    competency: 'Data Visualization',
    priority: 'HIGH',
    currentLevel: 2.4,
    requiredLevel: 4.0,
    gap: 1.6,
    whyMatters: 'Effective visualization is essential for communicating official statistical insights to decision-makers.',
    impact: 'High',
    affectedWork: ['Executive Reporting', 'Dashboard Publishing', 'Statistical Bulletins'],
    recommendedLearning: ['Data Visualization with Python', 'Interactive Plotting in Seaborn', 'Executive Graphics'],
    ctaText: 'Start Learning Path',
    ctaHref: '/learner/learning-path',
  },
  {
    id: 'd-gap-gis',
    competency: 'GIS for Spatial Analytics',
    priority: 'HIGH',
    currentLevel: 2.0,
    requiredLevel: 3.5,
    gap: 1.5,
    whyMatters: 'Geographic analysis is increasingly important for spatial statistics and regional development analysis.',
    impact: 'High',
    affectedWork: ['Spatial Sampling', 'Regional Indicators', 'District Mapping'],
    recommendedLearning: ['GIS for Government Statistics', 'Spatial Coordinates in QGIS', 'Census Boundary Integration'],
    ctaText: 'Start Learning Path',
    ctaHref: '/learner/learning-path',
  },
];

// 6. Why This Gap Matters Interactive Data
export const whyGapMattersData: Record<string, WhyGapMattersDetail> = {
  Python: {
    id: 'Python',
    name: 'Python for Data Analysis',
    roleRequirement: 'Python is increasingly required for automated data processing and statistical analysis in MoSPI.',
    currentImpact: 'Current competency may limit the ability to automate repetitive data workflows and handle large microdata files.',
    futureImpact: 'Improving Python competency will unlock advanced analytics and AI/ML capabilities across survey datasets.',
    expectedBenefit: 'Closing this gap could improve your overall competency score by approximately 4%.',
    scoreImprovement: '+4.0% Competency Lift',
  },
  'Data Visualization': {
    id: 'Data Visualization',
    name: 'Data Visualization & Reporting',
    roleRequirement: 'Communicating high-level statistical summaries cleanly to policy makers and civil leadership.',
    currentImpact: 'Relying on legacy static spreadsheets causes delays in stakeholder reporting and insight delivery.',
    futureImpact: 'Enables creation of interactive dashboards, automated SVG chart generation, and public releases.',
    expectedBenefit: 'Closing this gap will streamline report preparation and elevate official bulletin standards.',
    scoreImprovement: '+2.8% Competency Lift',
  },
  GIS: {
    id: 'GIS',
    name: 'GIS & Spatial Aggregations',
    roleRequirement: 'Regional statistical disaggregation and district-level Small Area Estimation (SAE) mapping.',
    currentImpact: 'Difficulty layering administrative boundary shapefiles with survey sample strata.',
    futureImpact: 'Directly supports NITI Aayog Aspirational Districts monitoring and geospatial statistics.',
    expectedBenefit: 'Allows spatial validation of field survey units and eliminates geographic sample bias.',
    scoreImprovement: '+2.5% Competency Lift',
  },
  'AI/ML': {
    id: 'AI/ML',
    name: 'Artificial Intelligence & Machine Learning',
    roleRequirement: 'Modern automated record linkage, fuzzy matching, and intelligent survey error imputation.',
    currentImpact: 'Manual deduplication and imputation requires excessive supervisory investigator time.',
    futureImpact: 'Positions the officer for national data architecture and advanced predictive modeling projects.',
    expectedBenefit: 'Prepares the cadre for automated machine learning governance pipelines.',
    scoreImprovement: '+2.0% Competency Lift',
  },
};

// 7. AI Insight Content
export const aiInsightContent: AIInsightContent = {
  title: 'COMPETIQ AI Insight',
  observation: 'Your strongest foundation is in Statistical Methods, but technical competencies are currently limiting your progression toward advanced data analysis roles.',
  recommendations: [
    'Prioritize Python competency development.',
    'Complete Data Visualization training.',
    'Begin GIS fundamentals.',
    'Strengthen SQL before advanced analytics training.',
  ],
  confidenceScore: 92,
  modelTimestamp: 'Compiled Today',
};

// 8. Learning Impact Forecast
export const learningImpactForecast: LearningImpactForecast = {
  currentCompetency: 78,
  projectedCompetency: 86,
  estimatedImprovement: 8,
  timeEstimate: '6 Weeks',
  disclaimer: 'Estimated based on successful completion of your recommended learning pathway.',
};

export const mockSkillGaps: SkillGap[] = skillGapMatrixData.map((sg) => ({
  id: sg.id,
  competencyId: sg.id,
  competencyName: sg.competency,
  domain: sg.domain,
  currentLevel: Math.round(sg.currentLevel),
  requiredLevel: Math.round(sg.requiredLevel),
  gap: Math.round(sg.gap),
  priority: sg.priority === 'CRITICAL' ? 'critical' : sg.priority === 'HIGH' ? 'moderate' : 'low',
  impactScore: sg.priority === 'CRITICAL' ? 92 : sg.priority === 'HIGH' ? 84 : 65,
}));
