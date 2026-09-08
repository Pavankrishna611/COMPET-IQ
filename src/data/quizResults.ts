export interface QuestionReviewItem {
  id: string;
  questionNumber: number;
  question: string;
  yourAnswer: string;
  yourOptionKey: 'A' | 'B' | 'C' | 'D';
  correctAnswer: string;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  explanation: string;
  competency: string;
}

export interface QuizResultData {
  assessmentId: string;
  assessmentTitle: string;
  score: number; // e.g. 82
  statusHeading: string;
  statusSubheading: string;
  metrics: {
    correct: number;
    incorrect: number;
    accuracy: number;
    timeTaken: string;
  };
  competencyBreakdown: {
    name: string;
    score: number;
    benchmark: number;
  }[];
  breakdownInsight: string;
  competencyImpact: {
    competency: string;
    before: number;
    after: number;
    improvement: number;
    explanation: string;
  };
  recommendation: {
    title: string;
    description: string;
    courseId: string;
    courseTitle: string;
    competency: string;
    impactFrom: string;
    impactTo: string;
  };
  reviews: QuestionReviewItem[];
}

export const mockQuizResult: QuizResultData = {
  assessmentId: 'asmt-py-fund',
  assessmentTitle: 'Python Fundamentals Assessment',
  score: 82,
  statusHeading: 'Great Progress!',
  statusSubheading: 'You have demonstrated strong understanding in several competency areas.',
  metrics: {
    correct: 16,
    incorrect: 4,
    accuracy: 80,
    timeTaken: '18m 32s',
  },
  competencyBreakdown: [
    { name: 'Python', score: 76, benchmark: 70 },
    { name: 'Sampling', score: 91, benchmark: 75 },
    { name: 'Data Quality', score: 88, benchmark: 80 },
    { name: 'SQL', score: 74, benchmark: 70 },
  ],
  breakdownInsight: 'Sampling Techniques is currently your strongest assessment area.',
  competencyImpact: {
    competency: 'PYTHON',
    before: 2.1,
    after: 2.8,
    improvement: 0.7,
    explanation: 'Your assessment performance contributes to your competency confidence score.',
  },
  recommendation: {
    title: 'Recommended Next Step',
    description: 'Your Python fundamentals are improving. Continue with Python for Statistical Analysis to strengthen your data processing skills.',
    courseId: 'crs-py-stats',
    courseTitle: 'Python for Statistical Analysis',
    competency: 'Python',
    impactFrom: '2.8',
    impactTo: '3.5',
  },
  reviews: [
    {
      id: 'rev-1',
      questionNumber: 1,
      question: 'Which Python library is most commonly used for tabular data analysis?',
      yourAnswer: 'Pandas',
      yourOptionKey: 'B',
      correctAnswer: 'Pandas',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'Pandas provides DataFrame structures designed specifically for working with structured tabular datasets.',
      competency: 'Python',
    },
    {
      id: 'rev-2',
      questionNumber: 2,
      question: 'What is the primary difference between a Python list and a NumPy ndarray in terms of performance and storage?',
      yourAnswer: 'ndarrays store homogeneous contiguous memory blocks; lists store pointers to heterogeneous objects',
      yourOptionKey: 'B',
      correctAnswer: 'ndarrays store homogeneous contiguous memory blocks; lists store pointers to heterogeneous objects',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'NumPy arrays store fixed-size data types in contiguous memory, enabling C-speed SIMD vectorization.',
      competency: 'Python',
    },
    {
      id: 'rev-3',
      questionNumber: 3,
      question: 'In Pandas, which method is most appropriate for handling missing observations by replacing NaN values with the column mean?',
      yourAnswer: 'df.dropna(axis=0)',
      yourOptionKey: 'A',
      correctAnswer: 'df.fillna(df.mean())',
      correctOptionKey: 'B',
      isCorrect: false,
      explanation: 'df.dropna() removes rows with missing values. To impute with the mean, df.fillna(df.mean()) is the standard approach.',
      competency: 'Python',
    },
    {
      id: 'rev-4',
      questionNumber: 4,
      question: 'Which SQL clause is executed first in the logical query processing order of a relational database engine?',
      yourAnswer: 'FROM',
      yourOptionKey: 'C',
      correctAnswer: 'FROM',
      correctOptionKey: 'C',
      isCorrect: true,
      explanation: 'FROM (and JOIN) is evaluated first to establish the source data tables before WHERE filters and GROUP BY aggregations.',
      competency: 'SQL',
    },
    {
      id: 'rev-5',
      questionNumber: 5,
      question: 'In survey sampling design, what is the primary consequence of using a stratified sampling design instead of Simple Random Sampling (SRS)?',
      yourAnswer: 'It ensures subgroup representation and typically reduces sampling variance across heterogeneous strata',
      yourOptionKey: 'B',
      correctAnswer: 'It ensures subgroup representation and typically reduces sampling variance across heterogeneous strata',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'Stratification controls variance within strata and guarantees proportional sample allocation across geographic regions.',
      competency: 'Sampling Techniques',
    },
    {
      id: 'rev-6',
      questionNumber: 6,
      question: 'Which SQL window function assigns a unique sequential integer to rows within a partition without gaps or ties?',
      yourAnswer: 'RANK()',
      yourOptionKey: 'A',
      correctAnswer: 'ROW_NUMBER()',
      correctOptionKey: 'C',
      isCorrect: false,
      explanation: 'RANK() creates gaps when tie values exist. ROW_NUMBER() assigns strictly sequential integers (1, 2, 3...) regardless of ties.',
      competency: 'SQL',
    },
    {
      id: 'rev-7',
      questionNumber: 7,
      question: 'When creating official statistical publications with Matplotlib, what technique ensures color accessibility for readers with color vision deficiency?',
      yourAnswer: 'Employing perceptually uniform sequential/diverging colormaps (like viridis or cividis) with secondary redundant encodings',
      yourOptionKey: 'B',
      correctAnswer: 'Employing perceptually uniform sequential/diverging colormaps (like viridis or cividis) with secondary redundant encodings',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'Perceptually uniform colormaps maintain monotonic luminance gradients that can be clearly distinguished by colorblind readers.',
      competency: 'Data Visualization',
    },
    {
      id: 'rev-8',
      questionNumber: 8,
      question: 'In Python, what is the output of the expression: `[x**2 for x in range(5) if x % 2 != 0]`?',
      yourAnswer: '[1, 9]',
      yourOptionKey: 'B',
      correctAnswer: '[1, 9]',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'Odd numbers in range(5) are 1 and 3; squaring them gives [1, 9].',
      competency: 'Python',
    },
    {
      id: 'rev-9',
      questionNumber: 9,
      question: 'Under the System of National Accounts (SNA 2008), which valuation concept excludes taxes on products and includes subsidies on products?',
      yourAnswer: 'Factor cost',
      yourOptionKey: 'C',
      correctAnswer: 'Basic prices',
      correctOptionKey: 'B',
      isCorrect: false,
      explanation: 'Basic prices include subsidies on products but exclude taxes on products. Factor cost also excludes other taxes on production.',
      competency: 'Statistical Methods',
    },
    {
      id: 'rev-10',
      questionNumber: 10,
      question: 'Which Python function or method in Pandas is used to reshape a DataFrame from wide format to long format for time-series econometric modeling?',
      yourAnswer: 'pd.melt()',
      yourOptionKey: 'B',
      correctAnswer: 'pd.melt()',
      correctOptionKey: 'B',
      isCorrect: true,
      explanation: 'pd.melt() unpivots wide columns into identifier variables and observation rows.',
      competency: 'Python',
    },
  ],
};
