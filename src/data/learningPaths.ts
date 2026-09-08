import { LearningPath } from '@/types';

export interface LearningStageItem {
  stageNumber: number;
  title: string;
  courseId: string;
  provider: string;
  status: 'completed' | 'in_progress' | 'recommended' | 'upcoming';
  progress?: number;
  duration: string;
  skills: string[];
  competencyImpact: {
    competency: string;
    from: string;
    to: string;
  };
  description: string;
  whyRecommended: string;
  prerequisites: string[];
  learningObjectives: string[];
}

export interface LearningPathSummaryInfo {
  role: string;
  department: string;
  division: string;
  goal: string;
  estimatedDuration: string;
  targetCompetency: number;
  currentCompetency: number;
  description: string;
}

export interface PathInsightInfo {
  title: string;
  explanation: string;
  priorities: {
    name: string;
    level: string;
    badgeVariant: 'critical' | 'warning' | 'info' | 'teal';
  }[];
  confidence: number;
}

export interface PathProgressSummaryInfo {
  completedCourses: number;
  totalCourses: number;
  inProgressCourses: number;
  recommendedNext: string;
  estimatedCompletion: string;
}

export const learningProfileSummary: LearningPathSummaryInfo = {
  role: 'Statistical Investigator',
  department: 'Economic Statistics',
  division: 'National Accounts Division (NAD)',
  goal: 'Advanced Statistical Data Analysis',
  estimatedDuration: '6 Weeks',
  targetCompetency: 86,
  currentCompetency: 78,
  description: 'Your learning path prioritizes the highest-impact competency gaps while building on your existing strengths.',
};

export const learningPathAiInsight: PathInsightInfo = {
  title: 'Why This Learning Path?',
  explanation: 'COMPETIQ has prioritized technical competencies that currently have the largest gap between your assessed proficiency and role requirements.',
  priorities: [
    { name: 'Python for Data Analysis', level: 'Critical Gap', badgeVariant: 'critical' },
    { name: 'Data Visualization', level: 'High Priority', badgeVariant: 'warning' },
    { name: 'GIS', level: 'High Priority', badgeVariant: 'warning' },
    { name: 'Advanced SQL', level: 'Moderate Priority', badgeVariant: 'info' },
  ],
  confidence: 94,
};

export const learningPathProgressStats: PathProgressSummaryInfo = {
  completedCourses: 1,
  totalCourses: 6,
  inProgressCourses: 1,
  recommendedNext: 'SQL for Data Analysis',
  estimatedCompletion: '4 Weeks Remaining',
};

export const learningPathStages: LearningStageItem[] = [
  {
    stageNumber: 1,
    title: 'Python Fundamentals',
    courseId: 'crs-py-fund',
    provider: 'iGOT Karmayogi',
    status: 'completed',
    duration: '6 Hours',
    skills: ['Python Basics', 'Variables', 'Functions', 'Data Structures'],
    competencyImpact: {
      competency: 'Python',
      from: '2.1',
      to: '2.8',
    },
    description: 'Foundational syntax, scripting logic, data types, and file operations tailored for statistical workflows.',
    whyRecommended: 'Essential programming foundation required before applying computational analytics to microdata.',
    prerequisites: ['Basic computer operations', 'Familiarity with spreadsheets'],
    learningObjectives: [
      'Write structured Python scripts using clean conventions',
      'Understand lists, dictionaries, tuples, and sets',
      'Handle file input/output for CSV and JSON datasets',
    ],
  },
  {
    stageNumber: 2,
    title: 'Python for Statistical Analysis',
    courseId: 'crs-py-stats',
    provider: 'iGOT Karmayogi',
    status: 'in_progress',
    progress: 65,
    duration: '8 Hours',
    skills: ['Pandas', 'NumPy', 'Data Processing', 'Statistical Analysis'],
    competencyImpact: {
      competency: 'Python',
      from: '2.8',
      to: '3.5',
    },
    description: 'Applied statistical data wrangling, aggregation, missing data handling, and automated survey batch analysis.',
    whyRecommended: 'Your Python competency is below the required level for your current assignment in Economic Statistics.',
    prerequisites: ['Python Fundamentals', 'Basic statistical terminology'],
    learningObjectives: [
      'Master Pandas DataFrames for large survey microdata wrangling',
      'Perform vectorized array computations using NumPy',
      'Automate monthly statistical compilation pipelines',
    ],
  },
  {
    stageNumber: 3,
    title: 'SQL for Data Analysis',
    courseId: 'crs-sql-ana',
    provider: 'iGOT Karmayogi',
    status: 'recommended',
    duration: '7 Hours',
    skills: ['SQL Queries', 'Joins', 'Data Aggregation', 'Data Analysis'],
    competencyImpact: {
      competency: 'SQL',
      from: '3.4',
      to: '4.0',
    },
    description: 'Relational database extraction, complex multi-table joins, subqueries, and window functions for official data.',
    whyRecommended: 'Addresses the 0.6 SQL level differential required for autonomous database querying in NAD.',
    prerequisites: ['Basic database concepts'],
    learningObjectives: [
      'Execute multi-table relational joins across administrative registries',
      'Use window functions for cumulative totals and moving averages',
      'Optimize query execution plans on government databases',
    ],
  },
  {
    stageNumber: 4,
    title: 'Data Visualization for Statistics',
    courseId: 'crs-vis-py',
    provider: 'iGOT Karmayogi',
    status: 'recommended',
    duration: '6 Hours',
    skills: ['Matplotlib', 'Dashboards', 'Statistical Charts', 'Data Storytelling'],
    competencyImpact: {
      competency: 'Data Visualization',
      from: '2.4',
      to: '3.8',
    },
    description: 'Creating publication-grade statistical charts, distribution plots, time-series graphs, and executive dashboards.',
    whyRecommended: 'Improves your ability to communicate complex statistical trends to policy makers and leadership.',
    prerequisites: ['Python for Statistical Analysis'],
    learningObjectives: [
      'Generate clear, accessible statistical charts using Matplotlib and Seaborn',
      'Adhere to official government branding and color palettes',
      'Construct automated dashboard summaries for executive briefings',
    ],
  },
  {
    stageNumber: 5,
    title: 'GIS for Statistical Applications',
    courseId: 'crs-gis-stat',
    provider: 'NSSTA / TPAC',
    status: 'upcoming',
    duration: '10 Hours',
    skills: ['Spatial Data', 'Maps', 'Geographic Analysis', 'Regional Statistics'],
    competencyImpact: {
      competency: 'GIS',
      from: '2.0',
      to: '3.5',
    },
    description: 'Geospatial mapping of survey strata, district-level thematic representations, and spatial correlation analysis.',
    whyRecommended: 'Resolves a critical spatial analysis competency gap required for sub-state regional statistical reporting.',
    prerequisites: ['Basic cartographic awareness', 'Data Visualization basics'],
    learningObjectives: [
      'Layer survey microdata over district administrative shapefiles',
      'Perform spatial aggregation and identify geographic outlier clusters',
      'Generate thematic choropleth maps adhering to Census GIS standards',
    ],
  },
  {
    stageNumber: 6,
    title: 'Applied Statistical Data Project',
    courseId: 'crs-stat-proj',
    provider: 'NSSTA / TPAC',
    status: 'upcoming',
    duration: '12 Hours',
    skills: ['Data Analysis', 'Visualization', 'Statistical Reporting', 'Applied Research'],
    competencyImpact: {
      competency: 'Overall Competency',
      from: '78%',
      to: '86%',
    },
    description: 'Capstone project integrating automated Python data ingestion, SQL querying, GIS mapping, and executive report compilation.',
    whyRecommended: 'Validates holistic cadre elevation, moving overall assessed competency from 78% to target 86%.',
    prerequisites: ['Completion of Stages 1 through 5'],
    learningObjectives: [
      'Complete end-to-end official statistical pipeline from raw survey data to report',
      'Demonstrate verified proficiency across all 4 priority development areas',
      'Present project outcomes to NSSTA supervisory evaluation panel',
    ],
  },
];

// Preserved for Part 0 showcase backward compatibility
export const mockLearningPath: LearningPath = {
  id: 'path_economic_stat_01',
  title: 'Economic Statistics & National Accounts Specialist Pathway',
  description: 'A curated progression track for Senior Statistical Officers to bridge gaps in SNA 2008 compilation, R computing, and microdata synthesis.',
  targetRole: 'Senior Statistical Officer (ISS Cadre)',
  totalModules: 6,
  completedModules: 1,
  progressPercentage: 17,
  estimatedHours: 49,
  items: learningPathStages.map((s) => ({
    id: s.courseId,
    pathId: 'path_economic_stat_01',
    stepOrder: s.stageNumber,
    title: s.title,
    type: 'course',
    duration: s.duration,
    status: s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in_progress' : 'locked',
    competencyMapped: s.competencyImpact.competency,
  })),
};
