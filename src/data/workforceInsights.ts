export interface InsightSummaryStats {
  criticalInsights: number;
  highPriority: number;
  emergingTrends: number;
  recommendedActions: number;
}

export interface FeaturedHeroInsight {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Critical' | 'Medium';
  affectedOfficials: number;
  affectedDepartments: string[];
  currentCompetency: number; // 42%
  targetCompetency: number; // 70%
  gap: number; // 28%
  recommendedAction: string;
  ctaText: string;
}

export interface DetailedInsightItem {
  id: string;
  title: string;
  category: 'Skill Gap' | 'Emerging Trend' | 'Learning Analytics' | 'Workforce Risk';
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  department: string; // 'All Departments' or specific
  trendOrRisk: string;
  confidenceScore: number; // e.g. 94%
  impactMetric: string;
  actionText: string;
  status: 'New' | 'Reviewed' | 'Action Planned';
  evidence: string[];
  affectedWorkforceSummary: string;
}

export interface EmergingSkillItem {
  skill: string;
  domain: string;
  readiness: number; // percentage e.g. 34%
  futureImportance: number; // percentage e.g. 92%
  trend: 'Emerging' | 'Growing' | 'High Demand';
  strategicNeed: string;
}

export interface FutureDemandProjectionItem {
  skill: string;
  currentDemand: number; // percentage e.g. 70
  projectedDemand: number; // percentage e.g. 88
  growthDelta: number;
}

export interface StrategicRecommendationItem {
  id: string;
  priorityOrder: number;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  affectedOfficials: number;
  expectedImprovement: string;
  summary: string;
  targetCadres: string[];
  status: 'New' | 'Reviewed' | 'Action Planned';
}

export const mockInsightSummary: InsightSummaryStats = {
  criticalInsights: 3,
  highPriority: 5,
  emergingTrends: 4,
  recommendedActions: 8,
};

export const mockFeaturedHeroInsight: FeaturedHeroInsight = {
  id: 'HERO-AI-01',
  title: 'AI/ML Readiness Gap Detected',
  description:
    'AI and Machine Learning competency is significantly below the recommended threshold across analytical roles, potentially limiting adoption of emerging data-driven workflows and automated anomaly detection.',
  impact: 'High',
  affectedOfficials: 5130,
  affectedDepartments: ['Economic Statistics', 'Industry Statistics', 'Social Statistics'],
  currentCompetency: 42,
  targetCompetency: 70,
  gap: 28,
  recommendedAction:
    'Launch a foundational AI literacy and applied machine learning learning pathway with practical MoSPI survey use cases.',
  ctaText: 'Create Training Recommendation',
};

export const mockDetailedInsights: DetailedInsightItem[] = [
  {
    id: 'INS-01',
    title: 'Python Demand Increasing',
    category: 'Emerging Trend',
    description:
      'Python competency requirements are accelerating across statistical data processing, survey tabulation, and analytical automation roles.',
    priority: 'Critical',
    department: 'All Departments',
    trendOrRisk: 'Trend: Accelerating (+34% YoY)',
    confidenceScore: 94,
    impactMetric: 'Affects 4,820 Officials',
    actionText: 'Prioritize Python learning pathways.',
    status: 'New',
    evidence: [
      '68% of new survey processing tools require Python runtime scripts.',
      'Manual SPSS/Excel workflows exhibit 3.4x longer tabulation turnaround.',
      'Cadre assessment logs show only 48% baseline Python proficiency.',
    ],
    affectedWorkforceSummary: '4,820 Statistical Investigators and Analysts across 6 wings.',
  },
  {
    id: 'INS-02',
    title: 'GIS Skill Concentration Risk',
    category: 'Workforce Risk',
    description:
      'GIS competency is dangerously concentrated among a narrow 14% cohort in Geographic Statistics, creating severe key-person dependency for digital mapping.',
    priority: 'High',
    department: 'Geographic Statistics',
    trendOrRisk: 'Risk: Single Point of Failure',
    confidenceScore: 89,
    impactMetric: '14% Concentration Ratio',
    actionText: 'Expand GIS training to field cadres.',
    status: 'New',
    evidence: [
      'Only 42 officers handle 90% of Urban Frame Survey boundary updates.',
      'Field survey validation queues experience 18-day average backlog.',
      'Retirement projections indicate 30% cadre turnover within 24 months.',
    ],
    affectedWorkforceSummary: '3,740 Officers across Geographic and Agriculture directorates.',
  },
  {
    id: 'INS-03',
    title: 'Data Visualization Opportunity',
    category: 'Skill Gap',
    description:
      'Improving data visualization and BI storytelling could dramatically elevate inter-ministerial reporting speed and executive dashboarding confidence.',
    priority: 'High',
    department: 'Economic Statistics',
    trendOrRisk: 'Opportunity: High ROI',
    confidenceScore: 91,
    impactMetric: '+12% Reporting Velocity',
    actionText: 'Assign visualization learning modules.',
    status: 'Reviewed',
    evidence: [
      'Senior leadership survey cited need for automated visual briefing decks.',
      'Average report review cycle reduced from 14 days to 4 days in pilot wings.',
      'Current cadre visualization competency stands at 54% vs 75% target.',
    ],
    affectedWorkforceSummary: '3,420 Officers across Economic and Social wings.',
  },
  {
    id: 'INS-04',
    title: 'Personalized Path Engagement Pattern',
    category: 'Learning Analytics',
    description:
      'Officers assigned personalized AI-directed learning paths demonstrate 18% higher course completion rates compared to standard mandatory assignments.',
    priority: 'Medium',
    department: 'All Departments',
    trendOrRisk: 'Pattern: +18% Completion',
    confidenceScore: 96,
    impactMetric: '+18% Completion Difference',
    actionText: 'Expand personalized path deployment.',
    status: 'Action Planned',
    evidence: [
      'Personalized paths logged 84% module retention over 60 days.',
      'Officers reported 40% higher relevance rating for diagnostic quizzes.',
      'Drop-off rate dropped from 32% to 14% on complex programming courses.',
    ],
    affectedWorkforceSummary: 'Entire active learner cohort (8,231 officials).',
  },
];

export const mockEmergingSkills: EmergingSkillItem[] = [
  {
    skill: 'Generative AI & LLMs',
    domain: 'AI & Automation',
    readiness: 28,
    futureImportance: 94,
    trend: 'Emerging',
    strategicNeed: 'Automated survey summarization and bilingual citizen queries.',
  },
  {
    skill: 'Machine Learning Models',
    domain: 'Data Science',
    readiness: 42,
    futureImportance: 90,
    trend: 'High Demand',
    strategicNeed: 'High-frequency economic forecasting and automated anomaly flagging.',
  },
  {
    skill: 'Advanced Data Visualization',
    domain: 'Business Intelligence',
    readiness: 54,
    futureImportance: 86,
    trend: 'Growing',
    strategicNeed: 'Interactive public dissemination dashboards and parliamentary briefs.',
  },
  {
    skill: 'Cloud Computing & Data Lakes',
    domain: 'Infrastructure',
    readiness: 46,
    futureImportance: 82,
    trend: 'Growing',
    strategicNeed: 'Secure national data lake hosting and scalable microdata access.',
  },
  {
    skill: 'Data Engineering Pipelines',
    domain: 'Data Engineering',
    readiness: 50,
    futureImportance: 88,
    trend: 'High Demand',
    strategicNeed: 'Real-time ETL ingest of administrative GSTN, MCA21, and EPFO feeds.',
  },
  {
    skill: 'Cybersecurity & Governance',
    domain: 'Information Security',
    readiness: 52,
    futureImportance: 84,
    trend: 'High Demand',
    strategicNeed: 'Compliance with Digital Personal Data Protection (DPDP) Act 2023.',
  },
];

export const mockFutureDemandProjections: FutureDemandProjectionItem[] = [
  { skill: 'AI / ML Analytics', currentDemand: 70, projectedDemand: 88, growthDelta: 18 },
  { skill: 'Data Engineering', currentDemand: 52, projectedDemand: 78, growthDelta: 26 },
  { skill: 'Cloud Computing', currentDemand: 48, projectedDemand: 72, growthDelta: 24 },
  { skill: 'Cybersecurity', currentDemand: 65, projectedDemand: 80, growthDelta: 15 },
];

export const mockStrategicRecommendations: StrategicRecommendationItem[] = [
  {
    id: 'STRAT-01',
    priorityOrder: 1,
    title: 'Launch AI Literacy Program',
    impact: 'High',
    affectedOfficials: 5130,
    expectedImprovement: '+18%',
    summary:
      'Deploy foundational AI literacy across analytical cadres to support emerging national accounts machine learning pipelines.',
    targetCadres: ['Indian Statistical Service (ISS)', 'Data Analyst Cadre'],
    status: 'New',
  },
  {
    id: 'STRAT-02',
    priorityOrder: 2,
    title: 'Expand Python Learning Pathways',
    impact: 'High',
    affectedOfficials: 4820,
    expectedImprovement: '+14%',
    summary:
      'Scale practical Python scripting courses on iGOT Karmayogi for Subordinate Statistical Service field staff.',
    targetCadres: ['Subordinate Statistical Service (SSS)', 'Statistical Investigators'],
    status: 'Reviewed',
  },
  {
    id: 'STRAT-03',
    priorityOrder: 3,
    title: 'Strengthen GIS Training',
    impact: 'Medium',
    affectedOfficials: 3740,
    expectedImprovement: '+12%',
    summary:
      'Establish certified geospatial bootcamp modules with National Remote Sensing Centre for crop and urban boundary mapping.',
    targetCadres: ['Field Operations Division (FOD)', 'Geographic Cadre'],
    status: 'New',
  },
  {
    id: 'STRAT-04',
    priorityOrder: 4,
    title: 'Improve Data Visualization Skills',
    impact: 'Medium',
    affectedOfficials: 3420,
    expectedImprovement: '+10%',
    summary:
      'Train officers on interactive dashboard design and modern visual statistical storytelling standards.',
    targetCadres: ['Economic Statistics Wing', 'Social Statistics Wing'],
    status: 'Action Planned',
  },
];
