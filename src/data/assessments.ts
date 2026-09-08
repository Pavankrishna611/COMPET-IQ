import { Assessment, DifficultyLevel } from '@/types';

export interface DetailedAssessmentItem {
  id: string;
  title: string;
  competency: string;
  competencyId: string;
  domain: string;
  questionsCount: number;
  durationMinutes: number;
  difficulty: DifficultyLevel;
  status: 'available' | 'in_progress' | 'completed';
  score?: number;
  lastAttemptDate?: string;
  actionRoute: string;
  description: string;
  category: string;
}

export interface TrainerAssessmentItem {
  id: string;
  title: string;
  competency: string;
  questionsCount: number;
  learnersCount: number;
  averageScore: number;
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string;
  author: string;
}

export interface LearnerAssessmentSummary {
  availableCount: number;
  inProgressCount: number;
  completedCount: number;
  averageScore: number;
}

export const learnerAssessmentSummary: LearnerAssessmentSummary = {
  availableCount: 4,
  inProgressCount: 1,
  completedCount: 12,
  averageScore: 82,
};

// Full list of Learner Assessments
export const mockLearnerAssessments: DetailedAssessmentItem[] = [
  {
    id: 'asmt-py-fund',
    title: 'Python Fundamentals Assessment',
    competency: 'Python',
    competencyId: 'comp_03',
    domain: 'Data Analytics & Computing',
    questionsCount: 20,
    durationMinutes: 25,
    difficulty: 'Beginner',
    status: 'in_progress',
    lastAttemptDate: 'In Progress (Started today)',
    actionRoute: '/learner/quiz',
    description: 'Validates basic Python scripting, list/dictionary comprehensions, and data structure handling for statistical operations.',
    category: 'Core Programming',
  },
  {
    id: 'asmt-smp-tech',
    title: 'Sampling Techniques Assessment',
    competency: 'Statistical Methods',
    competencyId: 'comp_01',
    domain: 'Economic Statistics',
    questionsCount: 15,
    durationMinutes: 20,
    difficulty: 'Intermediate',
    status: 'completed',
    score: 88,
    lastAttemptDate: 'Completed 2 days ago',
    actionRoute: '/learner/quiz/result',
    description: 'Evaluates stratified multi-stage sampling, PPS weight calibration, and non-response adjustment calculations.',
    category: 'Survey Methodology',
  },
  {
    id: 'asmt-sql-ana',
    title: 'SQL for Data Analysis',
    competency: 'SQL',
    competencyId: 'comp_06',
    domain: 'Data Analytics & Computing',
    questionsCount: 20,
    durationMinutes: 25,
    difficulty: 'Intermediate',
    status: 'available',
    actionRoute: '/learner/quiz',
    description: 'Tests multi-table relational joins, window functions (RANK, ROW_NUMBER), and microdata query optimization.',
    category: 'Database Querying',
  },
  {
    id: 'asmt-vis-bas',
    title: 'Data Visualization Basics',
    competency: 'Data Visualization',
    competencyId: 'comp_07',
    domain: 'Data Analytics & Computing',
    questionsCount: 15,
    durationMinutes: 20,
    difficulty: 'Beginner',
    status: 'available',
    actionRoute: '/learner/quiz',
    description: 'Assesses chart design selection, Matplotlib layout customization, and accessible publication palette adherence.',
    category: 'Statistical Reporting',
  },
  {
    id: 'asmt-gis-fund',
    title: 'GIS Fundamentals',
    competency: 'GIS',
    competencyId: 'comp_08',
    domain: 'Geospatial Statistics',
    questionsCount: 20,
    durationMinutes: 30,
    difficulty: 'Beginner',
    status: 'available',
    actionRoute: '/learner/quiz',
    description: 'Tests spatial boundary integration, QGIS layer mapping, and GPS coordinate projection systems for official surveys.',
    category: 'Geospatial Analytics',
  },
  {
    id: 'asmt-sna-gva',
    title: 'National Accounts & GVA Estimation Test',
    competency: 'Statistical Methods',
    competencyId: 'comp_02',
    domain: 'Economic Statistics',
    questionsCount: 20,
    durationMinutes: 35,
    difficulty: 'Advanced',
    status: 'completed',
    score: 84,
    lastAttemptDate: 'Completed 1 week ago',
    actionRoute: '/learner/quiz/result',
    description: 'Examines SNA 2008 gross value added derivations, intermediate consumption deductions, and deflator calculations.',
    category: 'Macroeconomic Aggregates',
  },
  {
    id: 'asmt-dq-audit',
    title: 'Survey Microdata Quality Audit Diagnostic',
    competency: 'Data Quality',
    competencyId: 'comp_04',
    domain: 'Statistical Quality Assurance',
    questionsCount: 15,
    durationMinutes: 20,
    difficulty: 'Intermediate',
    status: 'completed',
    score: 79,
    lastAttemptDate: 'Completed 2 weeks ago',
    actionRoute: '/learner/quiz/result',
    description: 'Verifies outlier detection rules, range plausibility constraints, and automated data cleaning pipelines.',
    category: 'Quality Assurance',
  },
];

// Trainer Assessments Management Data
export const mockTrainerAssessments: TrainerAssessmentItem[] = [
  {
    id: 'tr-asmt-1',
    title: 'Python Fundamentals',
    competency: 'Python',
    questionsCount: 20,
    learnersCount: 248,
    averageScore: 78,
    status: 'Published',
    lastUpdated: '2026-08-30',
    author: 'NSSTA Training Faculty',
  },
  {
    id: 'tr-asmt-2',
    title: 'Sampling Techniques',
    competency: 'Statistical Methods',
    questionsCount: 15,
    learnersCount: 312,
    averageScore: 84,
    status: 'Published',
    lastUpdated: '2026-08-25',
    author: 'Field Operations Wing',
  },
  {
    id: 'tr-asmt-3',
    title: 'SQL Data Analysis',
    competency: 'SQL',
    questionsCount: 20,
    learnersCount: 189,
    averageScore: 76,
    status: 'Published',
    lastUpdated: '2026-08-18',
    author: 'Computer Centre Division',
  },
  {
    id: 'tr-asmt-4',
    title: 'Data Visualization',
    competency: 'Data Visualization',
    questionsCount: 15,
    learnersCount: 165,
    averageScore: 82,
    status: 'Published',
    lastUpdated: '2026-08-12',
    author: 'Dissemination Division',
  },
  {
    id: 'tr-asmt-5',
    title: 'GIS for Field Officers',
    competency: 'GIS',
    questionsCount: 20,
    learnersCount: 94,
    averageScore: 73,
    status: 'Draft',
    lastUpdated: '2026-09-02',
    author: 'Geomatics Cell',
  },
  {
    id: 'tr-asmt-6',
    title: 'National Accounts GVA Estimation',
    competency: 'Statistical Methods',
    questionsCount: 25,
    learnersCount: 84,
    averageScore: 86,
    status: 'Archived',
    lastUpdated: '2026-07-15',
    author: 'NAD Advisory Group',
  },
];

// Preserved for backward compatibility with Part 0 showcase
export const mockAssessments: Assessment[] = [
  {
    id: 'asmt_01',
    title: 'National Accounts & GVA Estimation Competency Test',
    competencyId: 'comp_02',
    competencyName: 'National Accounts & GDP Estimation (SNA 2008)',
    domain: 'Economic Statistics',
    questionsCount: 20,
    durationMinutes: 45,
    passingScore: 75,
    category: 'Core Statistical Verification',
    status: 'available',
  },
  {
    id: 'asmt_02',
    title: 'R Microdata Wrangling & Aggregation Practical Check',
    competencyId: 'comp_03',
    competencyName: 'Statistical Computing with R & Python',
    domain: 'Data Analytics & Computing',
    questionsCount: 15,
    durationMinutes: 30,
    passingScore: 70,
    category: 'Data Science Skills',
    status: 'completed',
    lastScore: 88,
  },
  {
    id: 'asmt_03',
    title: 'Small Area Estimation: Fay-Herriot Diagnostic Exam',
    competencyId: 'comp_05',
    competencyName: 'Small Area Estimation (SAE) for Policy',
    domain: 'Microdata Modeling',
    questionsCount: 25,
    durationMinutes: 60,
    passingScore: 80,
    category: 'Advanced Modeling',
    status: 'available',
  },
];
