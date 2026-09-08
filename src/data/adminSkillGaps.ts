export type HeatmapCellSeverity = 'Strong' | 'Moderate' | 'High Gap' | 'Critical Gap';

export interface HeatmapCell {
  skill: string;
  gap: number; // percentage e.g. 38%
  severity: HeatmapCellSeverity;
  currentScore: number;
  targetScore: number;
  affectedOfficials: number;
}

export interface DepartmentHeatmapRow {
  department: string;
  shortName: string;
  skills: Record<string, HeatmapCell>;
}

export interface SkillGapRankingItem {
  rank: number;
  skill: string;
  category: string;
  currentProficiency: number;
  requiredProficiency: number;
  gap: number;
  affectedOfficials: number;
  priority: 'Critical' | 'High' | 'Moderate';
}

export interface DepartmentGapComparisonItem {
  department: string;
  gapPercentage: number;
  benchmark: number;
  officialsAtRisk: number;
  dominantGap: string;
}

export interface SkillGapTrendPoint {
  month: string;
  criticalGapRate: number; // e.g. 24
  targetRate: number; // e.g. 15
}

export interface SkillGapRecommendation {
  id: string;
  title: string;
  category: string;
  affectedOfficials: number;
  recommendation: string;
  expectedImprovement: string;
  ctaText: string;
  ctaHref: string;
  impactLevel: 'Critical' | 'High' | 'Medium';
}

export const mockSkillGapSummary = {
  criticalSkills: 4,
  highPrioritySkills: 6,
  affectedOfficials: 5130,
  averageGap: 22,
};

export const HEATMAP_SKILLS = [
  'Python',
  'SQL',
  'AI / ML',
  'GIS',
  'Data Visualization',
  'Cybersecurity',
];

export const mockHeatmapRows: DepartmentHeatmapRow[] = [
  {
    department: 'Economic Statistics',
    shortName: 'Economic',
    skills: {
      Python: { skill: 'Python', gap: 19, severity: 'Moderate', currentScore: 56, targetScore: 75, affectedOfficials: 640 },
      SQL: { skill: 'SQL', gap: 8, severity: 'Strong', currentScore: 72, targetScore: 80, affectedOfficials: 210 },
      'AI / ML': { skill: 'AI / ML', gap: 24, severity: 'High Gap', currentScore: 46, targetScore: 70, affectedOfficials: 820 },
      GIS: { skill: 'GIS', gap: 14, severity: 'Moderate', currentScore: 51, targetScore: 65, affectedOfficials: 380 },
      'Data Visualization': { skill: 'Data Visualization', gap: 11, severity: 'Strong', currentScore: 64, targetScore: 75, affectedOfficials: 310 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 12, severity: 'Strong', currentScore: 58, targetScore: 70, affectedOfficials: 290 },
    },
  },
  {
    department: 'Social Statistics',
    shortName: 'Social',
    skills: {
      Python: { skill: 'Python', gap: 21, severity: 'High Gap', currentScore: 54, targetScore: 75, affectedOfficials: 710 },
      SQL: { skill: 'SQL', gap: 11, severity: 'Strong', currentScore: 69, targetScore: 80, affectedOfficials: 290 },
      'AI / ML': { skill: 'AI / ML', gap: 26, severity: 'High Gap', currentScore: 44, targetScore: 70, affectedOfficials: 870 },
      GIS: { skill: 'GIS', gap: 18, severity: 'Moderate', currentScore: 47, targetScore: 65, affectedOfficials: 540 },
      'Data Visualization': { skill: 'Data Visualization', gap: 14, severity: 'Moderate', currentScore: 61, targetScore: 75, affectedOfficials: 420 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 15, severity: 'Moderate', currentScore: 55, targetScore: 70, affectedOfficials: 380 },
    },
  },
  {
    department: 'Agriculture Statistics',
    shortName: 'Agriculture',
    skills: {
      Python: { skill: 'Python', gap: 26, severity: 'High Gap', currentScore: 49, targetScore: 75, affectedOfficials: 920 },
      SQL: { skill: 'SQL', gap: 16, severity: 'Moderate', currentScore: 64, targetScore: 80, affectedOfficials: 480 },
      'AI / ML': { skill: 'AI / ML', gap: 29, severity: 'Critical Gap', currentScore: 41, targetScore: 70, affectedOfficials: 1040 },
      GIS: { skill: 'GIS', gap: 28, severity: 'Critical Gap', currentScore: 37, targetScore: 65, affectedOfficials: 1120 },
      'Data Visualization': { skill: 'Data Visualization', gap: 22, severity: 'High Gap', currentScore: 53, targetScore: 75, affectedOfficials: 680 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 19, severity: 'Moderate', currentScore: 51, targetScore: 70, affectedOfficials: 490 },
    },
  },
  {
    department: 'Labour Statistics',
    shortName: 'Labour',
    skills: {
      Python: { skill: 'Python', gap: 28, severity: 'Critical Gap', currentScore: 47, targetScore: 75, affectedOfficials: 840 },
      SQL: { skill: 'SQL', gap: 19, severity: 'Moderate', currentScore: 61, targetScore: 80, affectedOfficials: 410 },
      'AI / ML': { skill: 'AI / ML', gap: 31, severity: 'Critical Gap', currentScore: 39, targetScore: 70, affectedOfficials: 890 },
      GIS: { skill: 'GIS', gap: 24, severity: 'High Gap', currentScore: 41, targetScore: 65, affectedOfficials: 620 },
      'Data Visualization': { skill: 'Data Visualization', gap: 24, severity: 'High Gap', currentScore: 51, targetScore: 75, affectedOfficials: 710 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 21, severity: 'High Gap', currentScore: 49, targetScore: 70, affectedOfficials: 530 },
    },
  },
  {
    department: 'Industry Statistics',
    shortName: 'Industry',
    skills: {
      Python: { skill: 'Python', gap: 22, severity: 'High Gap', currentScore: 53, targetScore: 75, affectedOfficials: 780 },
      SQL: { skill: 'SQL', gap: 13, severity: 'Strong', currentScore: 67, targetScore: 80, affectedOfficials: 360 },
      'AI / ML': { skill: 'AI / ML', gap: 25, severity: 'High Gap', currentScore: 45, targetScore: 70, affectedOfficials: 850 },
      GIS: { skill: 'GIS', gap: 17, severity: 'Moderate', currentScore: 48, targetScore: 65, affectedOfficials: 490 },
      'Data Visualization': { skill: 'Data Visualization', gap: 16, severity: 'Moderate', currentScore: 59, targetScore: 75, affectedOfficials: 510 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 16, severity: 'Moderate', currentScore: 54, targetScore: 70, affectedOfficials: 430 },
    },
  },
  {
    department: 'Geographic Statistics',
    shortName: 'Geographic',
    skills: {
      Python: { skill: 'Python', gap: 32, severity: 'Critical Gap', currentScore: 43, targetScore: 75, affectedOfficials: 930 },
      SQL: { skill: 'SQL', gap: 22, severity: 'High Gap', currentScore: 58, targetScore: 80, affectedOfficials: 700 },
      'AI / ML': { skill: 'AI / ML', gap: 34, severity: 'Critical Gap', currentScore: 36, targetScore: 70, affectedOfficials: 960 },
      GIS: { skill: 'GIS', gap: 38, severity: 'Critical Gap', currentScore: 30, targetScore: 68, affectedOfficials: 1280 },
      'Data Visualization': { skill: 'Data Visualization', gap: 27, severity: 'Critical Gap', currentScore: 48, targetScore: 75, affectedOfficials: 790 },
      Cybersecurity: { skill: 'Cybersecurity', gap: 25, severity: 'High Gap', currentScore: 45, targetScore: 70, affectedOfficials: 770 },
    },
  },
];

export const mockSkillGapRankings: SkillGapRankingItem[] = [
  {
    rank: 1,
    skill: 'AI / Machine Learning',
    category: 'Emerging Analytics',
    currentProficiency: 42,
    requiredProficiency: 70,
    gap: 28,
    affectedOfficials: 5130,
    priority: 'Critical',
  },
  {
    rank: 2,
    skill: 'Python',
    category: 'Statistical Programming',
    currentProficiency: 48,
    requiredProficiency: 75,
    gap: 27,
    affectedOfficials: 4820,
    priority: 'Critical',
  },
  {
    rank: 3,
    skill: 'GIS & Geospatial Analysis',
    category: 'Spatial Analytics',
    currentProficiency: 46,
    requiredProficiency: 68,
    gap: 22,
    affectedOfficials: 3740,
    priority: 'High',
  },
  {
    rank: 4,
    skill: 'Data Visualization',
    category: 'Reporting & Dissemination',
    currentProficiency: 54,
    requiredProficiency: 75,
    gap: 21,
    affectedOfficials: 3420,
    priority: 'High',
  },
  {
    rank: 5,
    skill: 'Cybersecurity & Data Privacy',
    category: 'Digital Governance',
    currentProficiency: 52,
    requiredProficiency: 70,
    gap: 18,
    affectedOfficials: 2890,
    priority: 'Moderate',
  },
  {
    rank: 6,
    skill: 'Advanced SQL Querying',
    category: 'Database Management',
    currentProficiency: 64,
    requiredProficiency: 80,
    gap: 16,
    affectedOfficials: 2450,
    priority: 'Moderate',
  },
];

export const mockDepartmentGapComparisons: DepartmentGapComparisonItem[] = [
  {
    department: 'Geographic Statistics',
    gapPercentage: 28,
    benchmark: 15,
    officialsAtRisk: 1280,
    dominantGap: 'GIS (38%)',
  },
  {
    department: 'Labour Statistics',
    gapPercentage: 24,
    benchmark: 15,
    officialsAtRisk: 890,
    dominantGap: 'AI/ML (31%)',
  },
  {
    department: 'Agriculture Statistics',
    gapPercentage: 21,
    benchmark: 15,
    officialsAtRisk: 1120,
    dominantGap: 'GIS (28%)',
  },
  {
    department: 'Industry Statistics',
    gapPercentage: 17,
    benchmark: 15,
    officialsAtRisk: 850,
    dominantGap: 'AI/ML (25%)',
  },
  {
    department: 'Social Statistics',
    gapPercentage: 16,
    benchmark: 15,
    officialsAtRisk: 870,
    dominantGap: 'AI/ML (26%)',
  },
  {
    department: 'Economic Statistics',
    gapPercentage: 12,
    benchmark: 15,
    officialsAtRisk: 820,
    dominantGap: 'AI/ML (24%)',
  },
];

export const mockSkillGapTrend: SkillGapTrendPoint[] = [
  { month: 'April', criticalGapRate: 24, targetRate: 15 },
  { month: 'May', criticalGapRate: 23, targetRate: 15 },
  { month: 'June', criticalGapRate: 22, targetRate: 15 },
  { month: 'July', criticalGapRate: 21, targetRate: 15 },
  { month: 'August', criticalGapRate: 19, targetRate: 15 },
  { month: 'September', criticalGapRate: 18, targetRate: 15 },
];

export const mockSkillGapRecommendations: SkillGapRecommendation[] = [
  {
    id: 'REC-01',
    title: 'Python Development Program',
    category: 'Statistical Programming',
    affectedOfficials: 4820,
    recommendation: 'Launch role-specific Python learning pathways tailored for statistical investigators and data analysts.',
    expectedImprovement: '+14%',
    ctaText: 'Create Training Plan',
    ctaHref: '/admin/training',
    impactLevel: 'Critical',
  },
  {
    id: 'REC-02',
    title: 'AI / ML Readiness Initiative',
    category: 'Machine Learning',
    affectedOfficials: 5130,
    recommendation: 'Introduce foundational AI literacy programs and automated statistical anomaly detection modules.',
    expectedImprovement: '+18%',
    ctaText: 'View Recommended Courses',
    ctaHref: '/learner/courses',
    impactLevel: 'Critical',
  },
  {
    id: 'REC-03',
    title: 'GIS Competency Elevation',
    category: 'Geospatial Analytics',
    affectedOfficials: 3740,
    recommendation: 'Prioritize GIS training for Geographic and Agriculture Statistics wings with hands-on cadastral mapping.',
    expectedImprovement: '+12%',
    ctaText: 'Deploy Cadre Pathway',
    ctaHref: '/admin/training',
    impactLevel: 'High',
  },
  {
    id: 'REC-04',
    title: 'Data Visualization & BI Modernization',
    category: 'Reporting & Dissemination',
    affectedOfficials: 3420,
    recommendation: 'Deploy standardized dashboarding and visual storytelling modules to eliminate manual report formatting overhead.',
    expectedImprovement: '+10%',
    ctaText: 'Review Visualization Track',
    ctaHref: '/learner/courses',
    impactLevel: 'High',
  },
];
