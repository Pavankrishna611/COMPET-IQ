/**
 * COMPETIQ Competencies Mock Data
 * Comprehensive Competency Profile for Indian Official Statistical System (MoSPI/ISS/SSS)
 */

import { Competency } from '@/types';

export type CompetencyDomain = 'Statistical' | 'Technical' | 'Digital Governance' | 'Behavioural & Managerial';

export type CompetencyStatus = 'Strong' | 'Developing' | 'Moderate Gap' | 'Critical Gap';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface CompetencyEvidence {
  assessmentScore: number;
  completedCourses: number;
  practiceActivities: number;
  recentLearningHours: number;
}

export interface RecentAssessment {
  title: string;
  score: number;
  date: string;
}

export interface LearningHistoryItem {
  title: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  provider: string;
  duration: string;
}

export interface DetailedCompetency {
  id: string;
  name: string;
  code: string;
  domain: CompetencyDomain;
  currentLevel: number; // Out of 5.0
  requiredLevel: number; // Out of 5.0
  gap: number; // requiredLevel - currentLevel (or 0 if meeting/exceeding)
  status: CompetencyStatus;
  confidence: ConfidenceLevel;
  lastAssessed: string;
  description: string;
  evidence: CompetencyEvidence;
  recentAssessment: RecentAssessment;
  learningHistory: LearningHistoryItem[];
  recommendedAction: string;
}

export const competencySummaryMetrics = [
  {
    id: 'overall',
    title: 'Overall Competency',
    value: '78%',
    supportingText: 'Across all professional domains',
    accent: 'blue' as const,
  },
  {
    id: 'strong',
    title: 'Strong Competencies',
    value: '8',
    supportingText: 'Meeting or exceeding role expectations',
    accent: 'teal' as const,
  },
  {
    id: 'developing',
    title: 'Developing Areas',
    value: '6',
    supportingText: 'Require continued learning',
    accent: 'warning' as const,
  },
  {
    id: 'critical',
    title: 'Critical Gaps',
    value: '4',
    supportingText: 'Require immediate attention',
    accent: 'critical' as const,
  },
];

export const competencyDistributionData = [
  { name: 'Strong', count: 8, color: '#16855B' },
  { name: 'Developing', count: 6, color: '#0E9F9A' },
  { name: 'Moderate Gap', count: 5, color: '#D99000' },
  { name: 'Critical Gap', count: 4, color: '#C93636' },
];

export const mockDetailedCompetencies: DetailedCompetency[] = [
  // ==================== STATISTICAL DOMAIN (6) ====================
  {
    id: 'comp-stat-1',
    name: 'Survey Design',
    code: 'STAT-DES-101',
    domain: 'Statistical',
    currentLevel: 4.2,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '3 days ago',
    description: 'Methodology for household and enterprise sample surveys under MoSPI / NSS standards.',
    evidence: {
      assessmentScore: 92,
      completedCourses: 4,
      practiceActivities: 16,
      recentLearningHours: 24,
    },
    recentAssessment: {
      title: 'Survey Framework Certification',
      score: 92,
      date: '3 days ago',
    },
    learningHistory: [
      { title: 'NSS Survey Guidelines', status: 'Completed', provider: 'NSSTA', duration: '8h' },
      { title: 'Multistage Stratification', status: 'Completed', provider: 'ISI Kolkata', duration: '12h' },
    ],
    recommendedAction: 'Competency benchmark met. Consider mentoring junior investigators in survey calibration.',
  },
  {
    id: 'comp-stat-2',
    name: 'Sampling Techniques',
    code: 'STAT-SMP-102',
    domain: 'Statistical',
    currentLevel: 4.4,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '4 days ago',
    description: 'Stratified sampling, PPS sampling, Horvitz-Thompson estimation, and sampling variance.',
    evidence: {
      assessmentScore: 88,
      completedCourses: 5,
      practiceActivities: 20,
      recentLearningHours: 32,
    },
    recentAssessment: {
      title: 'Sampling Techniques Assessment',
      score: 88,
      date: '4 days ago',
    },
    learningHistory: [
      { title: 'Sampling Theory Foundations', status: 'Completed', provider: 'NSSTA', duration: '10h' },
      { title: 'Variance Estimation in Complex Surveys', status: 'Completed', provider: 'MoSPI', duration: '14h' },
    ],
    recommendedAction: 'Excellent proficiency. Review modern calibration using auxiliary administrative data.',
  },
  {
    id: 'comp-stat-3',
    name: 'National Accounts',
    code: 'STAT-NAC-103',
    domain: 'Statistical',
    currentLevel: 3.8,
    requiredLevel: 4.0,
    gap: 0.2,
    status: 'Developing',
    confidence: 'High',
    lastAssessed: '1 week ago',
    description: 'System of National Accounts (SNA 2008), GVA compilation, supply-use tables, and deflators.',
    evidence: {
      assessmentScore: 76,
      completedCourses: 3,
      practiceActivities: 9,
      recentLearningHours: 14,
    },
    recentAssessment: {
      title: 'Macroeconomic Aggregation Diagnostic',
      score: 76,
      date: '1 week ago',
    },
    learningHistory: [
      { title: 'SNA 2008 Core Concepts', status: 'Completed', provider: 'NSSTA', duration: '10h' },
      { title: 'Supply & Use Tables Compilation', status: 'In Progress', provider: 'MoSPI', duration: '8h' },
    ],
    recommendedAction: 'Complete Supply & Use Tables Compilation to close the 0.2 level gap to target.',
  },
  {
    id: 'comp-stat-4',
    name: 'Price Statistics',
    code: 'STAT-PRC-104',
    domain: 'Statistical',
    currentLevel: 4.1,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '2 weeks ago',
    description: 'Consumer Price Index (CPI), Wholesale Price Index (WPI), chained index calculations, and basket updating.',
    evidence: {
      assessmentScore: 86,
      completedCourses: 3,
      practiceActivities: 12,
      recentLearningHours: 18,
    },
    recentAssessment: {
      title: 'CPI Compilation Protocol Exam',
      score: 86,
      date: '2 weeks ago',
    },
    learningHistory: [
      { title: 'Index Number Theory & Laspeyres Formula', status: 'Completed', provider: 'NSSTA', duration: '6h' },
      { title: 'Field Price Quotation Verification', status: 'Completed', provider: 'MoSPI', duration: '8h' },
    ],
    recommendedAction: 'Exceeds cadre standard. Maintain familiarity with new e-commerce price collection standards.',
  },
  {
    id: 'comp-stat-5',
    name: 'Labour Statistics',
    code: 'STAT-LBR-105',
    domain: 'Statistical',
    currentLevel: 3.7,
    requiredLevel: 4.0,
    gap: 0.3,
    status: 'Developing',
    confidence: 'Medium',
    lastAssessed: '3 weeks ago',
    description: 'Periodic Labour Force Survey (PLFS) metrics, Activity Status classification, and worker population ratios.',
    evidence: {
      assessmentScore: 74,
      completedCourses: 2,
      practiceActivities: 7,
      recentLearningHours: 11,
    },
    recentAssessment: {
      title: 'PLFS Estimation Methodology Test',
      score: 74,
      date: '3 weeks ago',
    },
    learningHistory: [
      { title: 'PLFS Concepts and Definitions', status: 'Completed', provider: 'NSSTA', duration: '6h' },
      { title: 'Current Weekly Status Estimation', status: 'In Progress', provider: 'iGOT Karmayogi', duration: '6h' },
    ],
    recommendedAction: 'Complete PLFS estimation modules on iGOT to achieve target 4.0 level.',
  },
  {
    id: 'comp-stat-6',
    name: 'Data Quality',
    code: 'STAT-QLT-106',
    domain: 'Statistical',
    currentLevel: 4.3,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '5 days ago',
    description: 'Statistical audit, imputation protocols, non-sampling error detection, and consistency audits.',
    evidence: {
      assessmentScore: 90,
      completedCourses: 4,
      practiceActivities: 15,
      recentLearningHours: 22,
    },
    recentAssessment: {
      title: 'National Data Quality Audit Benchmark',
      score: 90,
      date: '5 days ago',
    },
    learningHistory: [
      { title: 'Principles of Official Data Validation', status: 'Completed', provider: 'NSSTA', duration: '8h' },
      { title: 'Imputation & Missing Data Management', status: 'Completed', provider: 'ISI Kolkata', duration: '10h' },
    ],
    recommendedAction: 'Benchmark exceeded. Continue applying standard data validation protocols during field reviews.',
  },

  // ==================== TECHNICAL DOMAIN (8) ====================
  {
    id: 'comp-tech-1',
    name: 'Python',
    code: 'TECH-PY-201',
    domain: 'Technical',
    currentLevel: 2.1,
    requiredLevel: 4.0,
    gap: 1.9,
    status: 'Critical Gap',
    confidence: 'High',
    lastAssessed: '2 days ago',
    description: 'Essential for statistical data processing, automation, tabular analysis, and microdata manipulation.',
    evidence: {
      assessmentScore: 68,
      completedCourses: 2,
      practiceActivities: 8,
      recentLearningHours: 12,
    },
    recentAssessment: {
      title: 'Python Fundamentals Assessment',
      score: 68,
      date: '2 days ago',
    },
    learningHistory: [
      { title: 'Python Basics', status: 'Completed', provider: 'iGOT Karmayogi', duration: '6h' },
      { title: 'Introduction to Data Structures', status: 'Completed', provider: 'iGOT Karmayogi', duration: '5h' },
      { title: 'Python for Statistical Analysis', status: 'In Progress', provider: 'iGOT Karmayogi', duration: '8h' },
    ],
    recommendedAction: 'Complete Python for Statistical Analysis to reduce this critical skill gap.',
  },
  {
    id: 'comp-tech-2',
    name: 'R Programming',
    code: 'TECH-R-202',
    domain: 'Technical',
    currentLevel: 3.0,
    requiredLevel: 3.5,
    gap: 0.5,
    status: 'Developing',
    confidence: 'Medium',
    lastAssessed: '1 month ago',
    description: 'Survey data manipulation with survey package, ggplot2, tidyr, and automated statistical reports.',
    evidence: {
      assessmentScore: 65,
      completedCourses: 2,
      practiceActivities: 6,
      recentLearningHours: 10,
    },
    recentAssessment: {
      title: 'R Scripting for Survey Analysis',
      score: 65,
      date: '1 month ago',
    },
    learningHistory: [
      { title: 'R for Statistical Computing', status: 'Completed', provider: 'NSSTA', duration: '8h' },
      { title: 'Complex Survey Package in R', status: 'Upcoming', provider: 'NSSTA', duration: '10h' },
    ],
    recommendedAction: 'Enroll in Complex Survey Package in R to achieve the 3.5 cadre benchmark.',
  },
  {
    id: 'comp-tech-3',
    name: 'SQL',
    code: 'TECH-SQL-203',
    domain: 'Technical',
    currentLevel: 3.4,
    requiredLevel: 4.0,
    gap: 0.6,
    status: 'Moderate Gap',
    confidence: 'High',
    lastAssessed: '5 days ago',
    description: 'Relational querying, multi-table joins, subqueries, aggregation, and large microdata extraction.',
    evidence: {
      assessmentScore: 78,
      completedCourses: 3,
      practiceActivities: 14,
      recentLearningHours: 16,
    },
    recentAssessment: {
      title: 'SQL Relational Database Benchmark',
      score: 78,
      date: '5 days ago',
    },
    learningHistory: [
      { title: 'SQL Fundamentals for Statisticians', status: 'Completed', provider: 'iGOT Karmayogi', duration: '6h' },
      { title: 'Advanced Window Functions & CTEs', status: 'In Progress', provider: 'iGOT Karmayogi', duration: '7h' },
    ],
    recommendedAction: 'Complete Advanced Window Functions on iGOT to bridge the 0.6 gap.',
  },
  {
    id: 'comp-tech-4',
    name: 'GIS',
    code: 'TECH-GIS-204',
    domain: 'Technical',
    currentLevel: 2.0,
    requiredLevel: 3.5,
    gap: 1.5,
    status: 'Critical Gap',
    confidence: 'High',
    lastAssessed: '1 week ago',
    description: 'Required for spatial analysis, geographic sampling frameworks, and geospatial data layering.',
    evidence: {
      assessmentScore: 54,
      completedCourses: 1,
      practiceActivities: 3,
      recentLearningHours: 6,
    },
    recentAssessment: {
      title: 'Geospatial Statistics Diagnostic',
      score: 54,
      date: '1 week ago',
    },
    learningHistory: [
      { title: 'Introduction to Spatial Coordinates', status: 'Completed', provider: 'NSSTA', duration: '4h' },
      { title: 'GIS for Government Statistics', status: 'Upcoming', provider: 'NSSTA / TPAC', duration: '10h' },
    ],
    recommendedAction: 'Prioritize GIS for Government Statistics to resolve spatial analysis deficit.',
  },
  {
    id: 'comp-tech-5',
    name: 'Data Visualization',
    code: 'TECH-VIS-205',
    domain: 'Technical',
    currentLevel: 2.4,
    requiredLevel: 4.0,
    gap: 1.6,
    status: 'Critical Gap',
    confidence: 'High',
    lastAssessed: '3 days ago',
    description: 'Important for communicating insights from official statistical data to policymakers and the public.',
    evidence: {
      assessmentScore: 60,
      completedCourses: 1,
      practiceActivities: 5,
      recentLearningHours: 7,
    },
    recentAssessment: {
      title: 'Statistical Visualization Diagnostic',
      score: 60,
      date: '3 days ago',
    },
    learningHistory: [
      { title: 'Chart Selection Fundamentals', status: 'Completed', provider: 'iGOT Karmayogi', duration: '4h' },
      { title: 'Data Visualization with Python', status: 'Upcoming', provider: 'iGOT Karmayogi', duration: '6h' },
    ],
    recommendedAction: 'Start Data Visualization with Python to build publication-grade official visual reports.',
  },
  {
    id: 'comp-tech-6',
    name: 'AI / Machine Learning',
    code: 'TECH-AIML-206',
    domain: 'Technical',
    currentLevel: 2.6,
    requiredLevel: 3.5,
    gap: 0.9,
    status: 'Moderate Gap',
    confidence: 'Medium',
    lastAssessed: '2 weeks ago',
    description: 'Automated record linkage, machine learning imputations, and predictive classification algorithms.',
    evidence: {
      assessmentScore: 62,
      completedCourses: 1,
      practiceActivities: 4,
      recentLearningHours: 8,
    },
    recentAssessment: {
      title: 'Applied Machine Learning Foundations',
      score: 62,
      date: '2 weeks ago',
    },
    learningHistory: [
      { title: 'AI & Data Science in Governance', status: 'Completed', provider: 'NIC', duration: '5h' },
      { title: 'Statistical Machine Learning Workflows', status: 'Upcoming', provider: 'ISI Kolkata', duration: '12h' },
    ],
    recommendedAction: 'Progress through Machine Learning Workflows following Python consolidation.',
  },
  {
    id: 'comp-tech-7',
    name: 'APIs',
    code: 'TECH-API-207',
    domain: 'Technical',
    currentLevel: 2.8,
    requiredLevel: 3.5,
    gap: 0.7,
    status: 'Moderate Gap',
    confidence: 'Medium',
    lastAssessed: '3 weeks ago',
    description: 'REST APIs, JSON data ingestion, Open Government Data (OGD) pipeline integrations, and webhooks.',
    evidence: {
      assessmentScore: 66,
      completedCourses: 1,
      practiceActivities: 5,
      recentLearningHours: 8,
    },
    recentAssessment: {
      title: 'Government Data Integration Assessment',
      score: 66,
      date: '3 weeks ago',
    },
    learningHistory: [
      { title: 'API Ingestion with Python', status: 'In Progress', provider: 'iGOT Karmayogi', duration: '6h' },
    ],
    recommendedAction: 'Complete API Ingestion modules to facilitate inter-departmental data exchanges.',
  },
  {
    id: 'comp-tech-8',
    name: 'Cloud Computing',
    code: 'TECH-CLD-208',
    domain: 'Technical',
    currentLevel: 2.5,
    requiredLevel: 3.0,
    gap: 0.5,
    status: 'Developing',
    confidence: 'Medium',
    lastAssessed: '1 month ago',
    description: 'National cloud infrastructure (MeghRaj), virtualized analysis sandboxes, and object storage.',
    evidence: {
      assessmentScore: 70,
      completedCourses: 1,
      practiceActivities: 4,
      recentLearningHours: 6,
    },
    recentAssessment: {
      title: 'Government Cloud Fundamentals',
      score: 70,
      date: '1 month ago',
    },
    learningHistory: [
      { title: 'GI Cloud MeghRaj Overview', status: 'Completed', provider: 'NIC', duration: '4h' },
    ],
    recommendedAction: 'Familiarize with cloud storage buckets and secure file transfers for census datasets.',
  },

  // ==================== DIGITAL GOVERNANCE (4) ====================
  {
    id: 'comp-gov-1',
    name: 'Cybersecurity',
    code: 'GOV-SEC-301',
    domain: 'Digital Governance',
    currentLevel: 3.5,
    requiredLevel: 3.5,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '2 weeks ago',
    description: 'Cert-In cybersecurity guidelines, credential protection, phishing prevention, and data safe rooms.',
    evidence: {
      assessmentScore: 88,
      completedCourses: 2,
      practiceActivities: 8,
      recentLearningHours: 10,
    },
    recentAssessment: {
      title: 'Government Information Security Protocol',
      score: 88,
      date: '2 weeks ago',
    },
    learningHistory: [
      { title: 'Cyber Hygiene for Government Officials', status: 'Completed', provider: 'iGOT Karmayogi', duration: '4h' },
      { title: 'Cert-In Compliance Essentials', status: 'Completed', provider: 'NIC', duration: '6h' },
    ],
    recommendedAction: 'Cadre benchmark satisfied. Complete annual compliance refreshers as scheduled.',
  },
  {
    id: 'comp-gov-2',
    name: 'Data Privacy',
    code: 'GOV-PRV-302',
    domain: 'Digital Governance',
    currentLevel: 3.8,
    requiredLevel: 4.0,
    gap: 0.2,
    status: 'Developing',
    confidence: 'High',
    lastAssessed: '1 month ago',
    description: 'Digital Personal Data Protection Act (DPDPA 2023), statistical disclosure control, and anonymization.',
    evidence: {
      assessmentScore: 82,
      completedCourses: 2,
      practiceActivities: 6,
      recentLearningHours: 9,
    },
    recentAssessment: {
      title: 'DPDPA Compliance & Anonymization Test',
      score: 82,
      date: '1 month ago',
    },
    learningHistory: [
      { title: 'DPDPA 2023 for Official Statisticians', status: 'Completed', provider: 'iGOT Karmayogi', duration: '5h' },
      { title: 'Microdata Anonymization Techniques', status: 'In Progress', provider: 'MoSPI', duration: '6h' },
    ],
    recommendedAction: 'Finish Microdata Anonymization module to reach full 4.0 level requirement.',
  },
  {
    id: 'comp-gov-3',
    name: 'Digital Signatures',
    code: 'GOV-SIG-303',
    domain: 'Digital Governance',
    currentLevel: 3.6,
    requiredLevel: 3.5,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '2 months ago',
    description: 'e-Sign, e-Office protocols, PKI certificate management, and document verification.',
    evidence: {
      assessmentScore: 94,
      completedCourses: 2,
      practiceActivities: 12,
      recentLearningHours: 8,
    },
    recentAssessment: {
      title: 'e-Office & Digital Signatures Workflow',
      score: 94,
      date: '2 months ago',
    },
    learningHistory: [
      { title: 'e-Office Advanced Workflows', status: 'Completed', provider: 'NIC', duration: '4h' },
    ],
    recommendedAction: 'Cadre benchmark met.',
  },
  {
    id: 'comp-gov-4',
    name: 'Government Cloud',
    code: 'GOV-CLD-304',
    domain: 'Digital Governance',
    currentLevel: 2.9,
    requiredLevel: 3.5,
    gap: 0.6,
    status: 'Moderate Gap',
    confidence: 'Medium',
    lastAssessed: '3 weeks ago',
    description: 'MeghRaj policies, sovereign data residency rules, and inter-agency data sharing frameworks.',
    evidence: {
      assessmentScore: 68,
      completedCourses: 1,
      practiceActivities: 4,
      recentLearningHours: 6,
    },
    recentAssessment: {
      title: 'Government Cloud Policy Evaluation',
      score: 68,
      date: '3 weeks ago',
    },
    learningHistory: [
      { title: 'Sovereign Cloud Data Management', status: 'In Progress', provider: 'NIC', duration: '6h' },
    ],
    recommendedAction: 'Complete sovereign data management training to resolve the 0.6 policy gap.',
  },

  // ==================== BEHAVIOURAL & MANAGERIAL (5) ====================
  {
    id: 'comp-beh-1',
    name: 'Leadership',
    code: 'BEH-LDR-401',
    domain: 'Behavioural & Managerial',
    currentLevel: 3.8,
    requiredLevel: 3.5,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '1 month ago',
    description: 'Field survey team supervision, conflict resolution, mentoring field investigators, and morale building.',
    evidence: {
      assessmentScore: 85,
      completedCourses: 3,
      practiceActivities: 10,
      recentLearningHours: 15,
    },
    recentAssessment: {
      title: 'Statistical Cadre Leadership Evaluation',
      score: 85,
      date: '1 month ago',
    },
    learningHistory: [
      { title: 'Supervisory Leadership in Field Operations', status: 'Completed', provider: 'NSSTA', duration: '8h' },
    ],
    recommendedAction: 'Exceeds role benchmark for Statistical Investigator cadre.',
  },
  {
    id: 'comp-beh-2',
    name: 'Communication',
    code: 'BEH-COM-402',
    domain: 'Behavioural & Managerial',
    currentLevel: 4.2,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '3 weeks ago',
    description: 'Drafting statistical briefs, technical documentation, press release assistance, and public communication.',
    evidence: {
      assessmentScore: 90,
      completedCourses: 4,
      practiceActivities: 14,
      recentLearningHours: 18,
    },
    recentAssessment: {
      title: 'Official Technical Reporting Exam',
      score: 90,
      date: '3 weeks ago',
    },
    learningHistory: [
      { title: 'Effective Communication for Public Servants', status: 'Completed', provider: 'iGOT Karmayogi', duration: '6h' },
      { title: 'Drafting Statistical Bulletins', status: 'Completed', provider: 'MoSPI', duration: '6h' },
    ],
    recommendedAction: 'Benchmark satisfied. Excellent proficiency in administrative communication.',
  },
  {
    id: 'comp-beh-3',
    name: 'Project Management',
    code: 'BEH-PRJ-403',
    domain: 'Behavioural & Managerial',
    currentLevel: 3.4,
    requiredLevel: 3.5,
    gap: 0.1,
    status: 'Developing',
    confidence: 'Medium',
    lastAssessed: '1 month ago',
    description: 'Census round milestone tracking, fieldwork resource budgeting, timeline adherence, and contingency handling.',
    evidence: {
      assessmentScore: 78,
      completedCourses: 2,
      practiceActivities: 6,
      recentLearningHours: 10,
    },
    recentAssessment: {
      title: 'Survey Operations Project Management',
      score: 78,
      date: '1 month ago',
    },
    learningHistory: [
      { title: 'Managing Large-Scale Field Surveys', status: 'In Progress', provider: 'NSSTA', duration: '8h' },
    ],
    recommendedAction: 'Near target. Complete field management case study module to close 0.1 gap.',
  },
  {
    id: 'comp-beh-4',
    name: 'Ethics',
    code: 'BEH-ETH-404',
    domain: 'Behavioural & Managerial',
    currentLevel: 4.5,
    requiredLevel: 4.0,
    gap: 0,
    status: 'Strong',
    confidence: 'High',
    lastAssessed: '2 weeks ago',
    description: 'UN Fundamental Principles of Official Statistics, integrity in data reporting, conflict of interest, and impartiality.',
    evidence: {
      assessmentScore: 96,
      completedCourses: 3,
      practiceActivities: 12,
      recentLearningHours: 16,
    },
    recentAssessment: {
      title: 'Ethics in Official Statistics Certification',
      score: 96,
      date: '2 weeks ago',
    },
    learningHistory: [
      { title: 'UN Principles of Official Statistics', status: 'Completed', provider: 'NSSTA', duration: '6h' },
      { title: 'Code of Conduct for Statistical Officers', status: 'Completed', provider: 'MoSPI', duration: '4h' },
    ],
    recommendedAction: 'Exemplary ethical standard. Recommended for ethical review committee assignments.',
  },
  {
    id: 'comp-beh-5',
    name: 'Decision Making',
    code: 'BEH-DEC-405',
    domain: 'Behavioural & Managerial',
    currentLevel: 3.9,
    requiredLevel: 4.0,
    gap: 0.1,
    status: 'Developing',
    confidence: 'Medium',
    lastAssessed: '3 weeks ago',
    description: 'Evidence-based decisions during non-response incidents, outlier threshold determinations, and field contingencies.',
    evidence: {
      assessmentScore: 80,
      completedCourses: 2,
      practiceActivities: 7,
      recentLearningHours: 11,
    },
    recentAssessment: {
      title: 'Evidence-Based Decision Scenarios',
      score: 80,
      date: '3 weeks ago',
    },
    learningHistory: [
      { title: 'Critical Thinking in Data Interpretation', status: 'In Progress', provider: 'iGOT Karmayogi', duration: '6h' },
    ],
    recommendedAction: 'Complete critical thinking module to bridge the 0.1 gap to benchmark.',
  },
];

export const mockCompetencies: Competency[] = mockDetailedCompetencies.map((c) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  domain: c.domain,
  category:
    c.domain === 'Statistical'
      ? 'Core Statistical'
      : c.domain === 'Technical'
        ? 'Data Science & AI'
        : c.domain === 'Digital Governance'
          ? 'Governance & Policy'
          : 'Core Statistical',
  description: c.description,
  currentLevel: Math.round(c.currentLevel),
  requiredLevel: Math.round(c.requiredLevel),
  lastAssessed: c.lastAssessed,
  benchmarkScore: c.evidence.assessmentScore,
}));
