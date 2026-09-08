export interface SourceReference {
  id: string;
  documentTitle: string;
  module: string;
  chunkReference?: string;
  relevanceScore: number; // e.g. 96 for 96%
  sourceType: 'Approved Learning Material' | 'Official MoSPI Manual' | 'National Statistical Standard' | 'Course Syllabus';
}

export interface RelatedCompetencyInfo {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  status: 'Critical Gap' | 'High Priority' | 'Moderate Gap' | 'Proficient';
  link: string;
}

export interface RecommendationInfo {
  title: string;
  courseTitle: string;
  courseId: string;
  impact: string;
}

export interface AIResponse {
  answer: string;
  keyPoints?: string[];
  example?: string;
  relatedCompetency?: RelatedCompetencyInfo;
  sources?: SourceReference[];
  followUpQuestions?: string[];
  recommendation?: RecommendationInfo;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  structuredResponse?: AIResponse;
  attachedContext?: string[];
}

export interface ConversationThread {
  id: string;
  title: string;
  lastMessagePreview: string;
  dateLabel: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface LearningContextProfile {
  role: string;
  department: string;
  division: string;
  currentLearningGoal: string;
  overallCompetencyScore: number;
  currentFocusCourse: string;
  priorityCompetency: {
    name: string;
    current: number;
    required: number;
  };
  recommendedNextStep: {
    title: string;
    actionUrl: string;
  };
  recentAssessment: {
    title: string;
    score: number;
    date: string;
  };
  learningStreakDays: number;
  contextSignals: {
    label: string;
    active: boolean;
  }[];
}

// User Profile Learning Context
export const mockLearnerContext: LearningContextProfile = {
  role: 'Statistical Investigator',
  department: 'Economic Statistics',
  division: 'National Accounts Division (NAD)',
  currentLearningGoal: 'Advanced Statistical Data Analysis',
  overallCompetencyScore: 78,
  currentFocusCourse: 'Python for Statistical Analysis',
  priorityCompetency: {
    name: 'Python',
    current: 2.1,
    required: 4.0,
  },
  recommendedNextStep: {
    title: 'SQL for Data Analysis',
    actionUrl: '/learner/learning-path',
  },
  recentAssessment: {
    title: 'Python Fundamentals',
    score: 82,
    date: 'Completed Yesterday',
  },
  learningStreakDays: 5,
  contextSignals: [
    { label: 'Current Role & Cadre (ISS / SSS)', active: true },
    { label: 'Competency Profile (12 Core Skills)', active: true },
    { label: 'Identified Skill Gaps (4 Areas)', active: true },
    { label: 'Learning History & Course Progress', active: true },
    { label: 'Assessment Performance (82% Avg)', active: true },
    { label: 'Personalized 6-Stage Roadmap', active: true },
  ],
};

// Suggested Prompts for Quick Exploration
export const mockSuggestedPrompts: string[] = [
  'Explain stratified sampling',
  'Give me a real-world example',
  'Test my understanding',
  'Explain my Python skill gap',
  'Summarize this topic',
  'What should I learn next?',
  'How can I improve my data visualization skills?',
  'Create practice questions for SQL',
];

// Pre-seeded Mock Conversations
export const mockConversations: ConversationThread[] = [
  {
    id: 'conv-sampling',
    title: 'Sampling Techniques',
    lastMessagePreview: 'Explain stratified sampling',
    dateLabel: 'Today',
    updatedAt: '2026-09-08T09:15:00Z',
    messages: [
      {
        id: 'msg-s1',
        sender: 'user',
        text: 'Explain stratified sampling',
        timestamp: '09:14 AM',
        attachedContext: ['Current Competency Profile'],
      },
      {
        id: 'msg-s2',
        sender: 'assistant',
        text: 'Stratified sampling is a probability sampling method where a target population is divided into non-overlapping homogeneous sub-groups called **strata** based on shared characteristics (such as geographic region, urban/rural sectors, or establishment size).',
        timestamp: '09:14 AM',
        structuredResponse: {
          answer: 'Stratified sampling is a probability sampling method where a target population is divided into non-overlapping homogeneous sub-groups called strata based on shared characteristics.',
          keyPoints: [
            'Each stratum is sampled independently using Simple Random Sampling (SRS) or systematic sampling.',
            'Guarantees proportional or optimal representation of small or critical sub-populations.',
            'Significantly reduces overall sampling variance when within-stratum variability is lower than between-stratum variability.',
          ],
          example: 'In MoSPI National Sample Surveys, the population is first stratified into Rural and Urban strata within each National Sample Survey (NSS) region. If a state has 60% rural population and 40% urban population, sample First Stage Units (FSUs) are allocated to represent both domains accurately.',
          relatedCompetency: {
            name: 'Sampling Techniques',
            currentLevel: 4.4,
            requiredLevel: 4.8,
            gap: 0.4,
            status: 'Moderate Gap',
            link: '/learner/skill-gaps',
          },
          sources: [
            {
              id: 'src-smp-1',
              documentTitle: 'MoSPI Survey Design & Sampling Manual',
              module: 'Module 2 — Probability Sampling & Stratification',
              chunkReference: 'Section 3.2 — Design Effect & Strata Allocation',
              relevanceScore: 96,
              sourceType: 'Approved Learning Material',
            },
            {
              id: 'src-smp-2',
              documentTitle: 'National Sample Survey Frame (NSSF) Guidelines',
              module: 'Chapter 4 — Multi-Stage Stratified Sampling',
              chunkReference: 'Para 14.8 — Urban Frame Survey (UFS) Blocks',
              relevanceScore: 91,
              sourceType: 'Official MoSPI Manual',
            },
          ],
          followUpQuestions: [
            'Give me a real-world example',
            'How is it different from cluster sampling?',
            'Test my understanding with a practice question',
            'What is the formula for Neyman optimal allocation?',
          ],
        },
      },
    ],
  },
  {
    id: 'conv-python',
    title: 'Python Assessment Help',
    lastMessagePreview: 'Explain Pandas DataFrames',
    dateLabel: 'Yesterday',
    updatedAt: '2026-09-07T14:30:00Z',
    messages: [
      {
        id: 'msg-p1',
        sender: 'user',
        text: 'Explain Pandas DataFrames',
        timestamp: '02:29 PM',
      },
      {
        id: 'msg-p2',
        sender: 'assistant',
        text: 'A Pandas **DataFrame** is a two-dimensional, size-mutable, and tabular data structure with labeled axes (rows and columns). It is the foundational construct for structured data wrangling in modern statistical programming.',
        timestamp: '02:30 PM',
        structuredResponse: {
          answer: 'A Pandas DataFrame is a two-dimensional, size-mutable, and tabular data structure with labeled axes (rows and columns). It is the foundational construct for structured data wrangling in modern statistical programming.',
          keyPoints: [
            'Organizes survey observations as rows and variables/indicators as named columns.',
            'Each column is a Pandas Series with a uniform data type (integers, floats, categories, timestamps).',
            'Supports fast vectorized group-bys, multi-table joins, and aggregate summary tables.',
          ],
          example: 'When processing Consumer Expenditure Survey microdata, household sample IDs serve as row index identifiers, while columns capture state code, sector, item code, and monthly per capita expenditure (MPCE).',
          relatedCompetency: {
            name: 'Python for Statistical Analysis',
            currentLevel: 2.1,
            requiredLevel: 4.0,
            gap: 1.9,
            status: 'Critical Gap',
            link: '/learner/skill-gaps',
          },
          sources: [
            {
              id: 'src-py-1',
              documentTitle: 'Python for Statistical Analysis',
              module: 'Module 3 — Survey Microdata Wrangling with Pandas',
              chunkReference: 'Notebook 2.4 — Tabular Indexing & Filtering',
              relevanceScore: 95,
              sourceType: 'Approved Learning Material',
            },
          ],
          followUpQuestions: [
            'How do I handle missing values in a DataFrame?',
            'What is the difference between loc and iloc?',
            'How to group by state and calculate weighted mean?',
          ],
          recommendation: {
            title: 'Recommended Course Module',
            courseTitle: 'Python for Statistical Analysis',
            courseId: 'crs-py-stats',
            impact: 'Python 2.1 → 3.5',
          },
        },
      },
    ],
  },
  {
    id: 'conv-data-quality',
    title: 'Data Quality',
    lastMessagePreview: 'What is data validation?',
    dateLabel: 'Yesterday',
    updatedAt: '2026-09-07T11:00:00Z',
    messages: [
      {
        id: 'msg-dq1',
        sender: 'user',
        text: 'What is data validation?',
        timestamp: '10:59 AM',
      },
      {
        id: 'msg-dq2',
        sender: 'assistant',
        text: 'Data validation is the automated and manual process of verifying that incoming survey microdata meets defined standards of accuracy, consistency, completeness, and logical plausibility before aggregation.',
        timestamp: '11:00 AM',
        structuredResponse: {
          answer: 'Data validation is the process of verifying that incoming survey microdata meets defined standards of accuracy, consistency, completeness, and logical plausibility before aggregation.',
          keyPoints: [
            'Enforces range checks (e.g. age between 0 and 115, non-negative income).',
            'Cross-field relational checks (e.g. marital status vs age, educational attainment vs occupation).',
            'Prevents erroneous outlier contamination in official economic indices like CPI and IIP.',
          ],
          relatedCompetency: {
            name: 'Data Quality Assurance',
            currentLevel: 3.2,
            requiredLevel: 4.2,
            gap: 1.0,
            status: 'Moderate Gap',
            link: '/learner/skill-gaps',
          },
          sources: [
            {
              id: 'src-dq-1',
              documentTitle: 'Official Statistics Quality Assurance Framework',
              module: 'Chapter 5 — Microdata Cleaning & Validation Rules',
              relevanceScore: 92,
              sourceType: 'National Statistical Standard',
            },
          ],
          followUpQuestions: [
            'What are common imputation techniques for missing values?',
            'How to write validation rules in Python?',
          ],
        },
      },
    ],
  },
  {
    id: 'conv-path',
    title: 'Current Learning Path',
    lastMessagePreview: 'What should I learn next?',
    dateLabel: '2 days ago',
    updatedAt: '2026-09-06T16:20:00Z',
    messages: [
      {
        id: 'msg-lp1',
        sender: 'user',
        text: 'What should I learn next?',
        timestamp: '04:19 PM',
      },
      {
        id: 'msg-lp2',
        sender: 'assistant',
        text: 'Based on your recent 82% completion in Python Fundamentals and your current Statistical Investigator profile in Economic Statistics, your primary next priority is **Python for Statistical Analysis** (Stage 2) followed by **SQL for Data Analysis** (Stage 3).',
        timestamp: '04:20 PM',
        structuredResponse: {
          answer: 'Based on your recent 82% completion in Python Fundamentals and your current Statistical Investigator profile in Economic Statistics, your primary next priority is Python for Statistical Analysis (Stage 2) followed by SQL for Data Analysis (Stage 3).',
          keyPoints: [
            'Completing Stage 2 will increase your Python competency from 2.8 to 3.5.',
            'SQL for Data Analysis addresses the database querying gap required for autonomous querying in National Accounts Division.',
            'Your 6-stage trajectory is 17% completed with 4 weeks estimated remaining.',
          ],
          relatedCompetency: {
            name: 'Python',
            currentLevel: 2.1,
            requiredLevel: 4.0,
            gap: 1.9,
            status: 'Critical Gap',
            link: '/learner/skill-gaps',
          },
          recommendation: {
            title: 'Active Learning Path Milestone',
            courseTitle: 'Python for Statistical Analysis',
            courseId: 'crs-py-stats',
            impact: 'Python 2.8 → 3.5 (In Progress: 65%)',
          },
          sources: [
            {
              id: 'src-lp-1',
              documentTitle: 'Personalized Learning Trajectory: LP-2026-ISS-042',
              module: 'Stage 2 — Applied Statistical Computing',
              relevanceScore: 98,
              sourceType: 'Course Syllabus',
            },
          ],
          followUpQuestions: [
            'Explain my Python skill gap in detail',
            'How many stages are left in my roadmap?',
            'What will be the capstone project at Stage 6?',
          ],
        },
      },
    ],
  },
];
