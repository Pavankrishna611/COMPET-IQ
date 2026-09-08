import { DifficultyLevel } from '@/types';

export interface QuizQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  competency: string;
  difficulty: DifficultyLevel;
  sourceReference?: string;
}

export interface BankQuestionItem {
  id: string;
  questionText: string;
  competency: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Scenario Based' | 'Practical Case';
  usageCount: number;
  status: 'Active' | 'Draft' | 'Archived';
  options: {
    key: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  createdAt: string;
}

// 10 realistic Python Fundamentals & Data Analysis questions for /learner/quiz
export const mockQuizQuestions: QuizQuestionItem[] = [
  {
    id: 'quiz-q1',
    questionNumber: 1,
    questionText: 'Which Python library is most commonly used for tabular data analysis and structured microdata manipulation?',
    options: [
      { key: 'A', text: 'NumPy' },
      { key: 'B', text: 'Pandas' },
      { key: 'C', text: 'Matplotlib' },
      { key: 'D', text: 'TensorFlow' },
    ],
    correctAnswer: 'B',
    explanation: 'Pandas provides DataFrame and Series data structures specifically designed for tabular datasets, indexing, grouping, and aggregations.',
    competency: 'Python',
    difficulty: 'Beginner',
    sourceReference: 'Module 1 — Python for Official Statistics',
  },
  {
    id: 'quiz-q2',
    questionNumber: 2,
    questionText: 'What is the primary difference between a Python list and a NumPy ndarray in terms of performance and storage?',
    options: [
      { key: 'A', text: 'Lists support vectorized operations; ndarrays require for-loops' },
      { key: 'B', text: 'ndarrays store homogeneous contiguous memory blocks; lists store pointers to heterogeneous objects' },
      { key: 'C', text: 'Lists are always faster than ndarrays for numeric mathematical aggregations' },
      { key: 'D', text: 'ndarrays cannot be resized or sliced dynamically' },
    ],
    correctAnswer: 'B',
    explanation: 'NumPy ndarrays enforce uniform data types stored in contiguous memory buffers, enabling fast SIMD vectorization and lower memory overhead.',
    competency: 'Python',
    difficulty: 'Intermediate',
    sourceReference: 'Module 2 — Vectorized Data Processing',
  },
  {
    id: 'quiz-q3',
    questionNumber: 3,
    questionText: 'In Pandas, which method is most appropriate for handling missing observations by replacing NaN values with the cadre column mean?',
    options: [
      { key: 'A', text: 'df.dropna(axis=0)' },
      { key: 'B', text: 'df.fillna(df.mean())' },
      { key: 'C', text: 'df.replace(np.nan, 0)' },
      { key: 'D', text: 'df.interpolate(method="polynomial")' },
    ],
    correctAnswer: 'B',
    explanation: 'df.fillna(df.mean()) imputes null/missing cells with the arithmetic mean of the respective numeric series.',
    competency: 'Python',
    difficulty: 'Beginner',
    sourceReference: 'Module 3 — Data Cleaning & Imputation',
  },
  {
    id: 'quiz-q4',
    questionNumber: 4,
    questionText: 'Which SQL clause is executed first in the logical query processing order of a relational database engine?',
    options: [
      { key: 'A', text: 'SELECT' },
      { key: 'B', text: 'WHERE' },
      { key: 'C', text: 'FROM' },
      { key: 'D', text: 'HAVING' },
    ],
    correctAnswer: 'C',
    explanation: 'In logical SQL query evaluation, FROM (including JOINs) is evaluated first to determine the working dataset before filtering (WHERE) and grouping.',
    competency: 'SQL',
    difficulty: 'Intermediate',
    sourceReference: 'Module 4 — Relational Database Architecture',
  },
  {
    id: 'quiz-q5',
    questionNumber: 5,
    questionText: 'In survey sampling design, what is the primary consequence of using a stratified sampling design instead of Simple Random Sampling (SRS)?',
    options: [
      { key: 'A', text: 'It completely eliminates non-response error across all domains' },
      { key: 'B', text: 'It ensures subgroup representation and typically reduces sampling variance across heterogeneous strata' },
      { key: 'C', text: 'It removes the requirement of having a sampling frame' },
      { key: 'D', text: 'It increases the overall design effect (Deff) significantly above 2.0' },
    ],
    correctAnswer: 'B',
    explanation: 'Stratification groups homogeneous sub-populations, ensuring proportional or optimal allocation and decreasing standard error compared to unstratified SRS.',
    competency: 'Statistical Methods',
    difficulty: 'Intermediate',
    sourceReference: 'Module 5 — MoSPI Survey Frame Methodology',
  },
  {
    id: 'quiz-q6',
    questionNumber: 6,
    questionText: 'Which SQL window function assigns a unique sequential integer to rows within a partition without gaps or ties?',
    options: [
      { key: 'A', text: 'RANK()' },
      { key: 'B', text: 'DENSE_RANK()' },
      { key: 'C', text: 'ROW_NUMBER()' },
      { key: 'D', text: 'NTILE(4)' },
    ],
    correctAnswer: 'C',
    explanation: 'ROW_NUMBER() generates a continuous sequence of integers (1, 2, 3...) regardless of identical values in the ORDER BY clause.',
    competency: 'SQL',
    difficulty: 'Intermediate',
    sourceReference: 'Module 4 — Advanced Query Windowing',
  },
  {
    id: 'quiz-q7',
    questionNumber: 7,
    questionText: 'When creating official statistical publications with Matplotlib, what technique ensures color accessibility for readers with color vision deficiency?',
    options: [
      { key: 'A', text: 'Using default saturated red and green gradients without line styles' },
      { key: 'B', text: 'Employing perceptually uniform sequential/diverging colormaps (like viridis or cividis) with secondary redundant encodings' },
      { key: 'C', text: 'Removing legends and relying solely on axis titles' },
      { key: 'D', text: 'Exporting charts strictly in 8-bit grayscale' },
    ],
    correctAnswer: 'B',
    explanation: 'Perceptually uniform colormaps combined with geometric symbols or textures ensure statistical graphs remain interpretable under colorblind conditions.',
    competency: 'Data Visualization',
    difficulty: 'Beginner',
    sourceReference: 'Module 6 — Official Statistical Publishing Standards',
  },
  {
    id: 'quiz-q8',
    questionNumber: 8,
    questionText: 'In Python, what is the output of the expression: `[x**2 for x in range(5) if x % 2 != 0]`?',
    options: [
      { key: 'A', text: '[0, 4, 16]' },
      { key: 'B', text: '[1, 9]' },
      { key: 'C', text: '[1, 4, 9, 16]' },
      { key: 'D', text: '[1, 9, 25]' },
    ],
    correctAnswer: 'B',
    explanation: 'Range(5) generates [0, 1, 2, 3, 4]. The odd integers are 1 and 3. Their squares are 1 and 9.',
    competency: 'Python',
    difficulty: 'Beginner',
    sourceReference: 'Module 1 — Python Comprehension Syntax',
  },
  {
    id: 'quiz-q9',
    questionNumber: 9,
    questionText: 'Under the System of National Accounts (SNA 2008), which valuation concept excludes taxes on products and includes subsidies on products?',
    options: [
      { key: 'A', text: 'Purchasers\' prices' },
      { key: 'B', text: 'Basic prices' },
      { key: 'C', text: 'Factor cost' },
      { key: 'D', text: 'Market prices' },
    ],
    correctAnswer: 'B',
    explanation: 'Basic prices represent the amount receivable by the producer, excluding any taxes payable on the product but including subsidies receivable on the product.',
    competency: 'Statistical Methods',
    difficulty: 'Intermediate',
    sourceReference: 'Module 7 — National Accounts GVA Estimation',
  },
  {
    id: 'quiz-q10',
    questionNumber: 10,
    questionText: 'Which Python function or method in Pandas is used to reshape a DataFrame from wide format to long format for time-series econometric modeling?',
    options: [
      { key: 'A', text: 'pd.pivot_table()' },
      { key: 'B', text: 'pd.melt()' },
      { key: 'C', text: 'df.unstack()' },
      { key: 'D', text: 'df.transpose()' },
    ],
    correctAnswer: 'B',
    explanation: 'pd.melt() unpivots a DataFrame from wide format to long format, gathering multiple metric columns into identifier and value columns.',
    competency: 'Python',
    difficulty: 'Intermediate',
    sourceReference: 'Module 3 — Data Reshaping & Restructuring',
  },
];

// Question Bank for Trainer Repository
export const mockQuestionBank: BankQuestionItem[] = [
  {
    id: 'bank-q1',
    questionText: 'Which Python library provides the DataFrame structure for tabular data manipulation?',
    competency: 'Python',
    difficulty: 'Easy',
    questionType: 'MCQ',
    usageCount: 142,
    status: 'Active',
    options: [
      { key: 'A', text: 'NumPy' },
      { key: 'B', text: 'Pandas' },
      { key: 'C', text: 'TensorFlow' },
      { key: 'D', text: 'Flask' },
    ],
    correctAnswer: 'B',
    explanation: 'Pandas is the primary library for data structures and data analysis tools in the Python programming language.',
    createdAt: '2026-08-12',
  },
  {
    id: 'bank-q2',
    questionText: 'What is the expected value of an unbiased estimator under repeated sampling from the target population?',
    competency: 'Sampling Techniques',
    difficulty: 'Medium',
    questionType: 'MCQ',
    usageCount: 88,
    status: 'Active',
    options: [
      { key: 'A', text: 'Zero' },
      { key: 'B', text: 'The true population parameter' },
      { key: 'C', text: 'The sample variance' },
      { key: 'D', text: 'The median of the bootstrap distribution' },
    ],
    correctAnswer: 'B',
    explanation: 'An estimator is said to be unbiased if its mathematical expectation equals the true population parameter being estimated.',
    createdAt: '2026-08-14',
  },
  {
    id: 'bank-q3',
    questionText: 'In SQL, which aggregate filter must be used instead of WHERE when filtering based on the result of a GROUP BY aggregate?',
    competency: 'SQL',
    difficulty: 'Easy',
    questionType: 'MCQ',
    usageCount: 119,
    status: 'Active',
    options: [
      { key: 'A', text: 'QUALIFY' },
      { key: 'B', text: 'HAVING' },
      { key: 'C', text: 'ORDER BY' },
      { key: 'D', text: 'LIMIT' },
    ],
    correctAnswer: 'B',
    explanation: 'HAVING specifies search conditions for a group or an aggregate, whereas WHERE operates on individual rows before grouping.',
    createdAt: '2026-08-18',
  },
  {
    id: 'bank-q4',
    questionText: 'A field surveyor observes a discrepancy in household consumer expenditure microdata. Which data validation rule flags negative values in non-negative expenditure items?',
    competency: 'Data Quality',
    difficulty: 'Hard',
    questionType: 'Scenario Based',
    usageCount: 64,
    status: 'Active',
    options: [
      { key: 'A', text: 'Range plausibility constraint checking' },
      { key: 'B', text: 'Cross-tabulation imputation' },
      { key: 'C', text: 'Benford law audit' },
      { key: 'D', text: 'Principal component filter' },
    ],
    correctAnswer: 'A',
    explanation: 'Range plausibility constraints enforce boundary conditions (such as non-negativity) during survey data entry and batch validation.',
    createdAt: '2026-08-20',
  },
  {
    id: 'bank-q5',
    questionText: 'Which coordinate reference system (CRS) standard is most commonly used for pan-India geospatial data layers in GPS mapping?',
    competency: 'GIS',
    difficulty: 'Medium',
    questionType: 'MCQ',
    usageCount: 76,
    status: 'Active',
    options: [
      { key: 'A', text: 'EPSG:4326 (WGS 84)' },
      { key: 'B', text: 'EPSG:3857 (Web Mercator)' },
      { key: 'C', text: 'NAD 83' },
      { key: 'D', text: 'ED 50' },
    ],
    correctAnswer: 'A',
    explanation: 'EPSG:4326 (WGS 84 geographic 2D) is the official global and national standard for GPS raw coordinate capture.',
    createdAt: '2026-08-22',
  },
  {
    id: 'bank-q6',
    questionText: 'When compiling Gross Domestic Product (GDP) using the Production Approach, what is the role of the intermediate consumption deduction?',
    competency: 'Statistical Methods',
    difficulty: 'Hard',
    questionType: 'Scenario Based',
    usageCount: 92,
    status: 'Active',
    options: [
      { key: 'A', text: 'To avoid double counting the value of goods and services used up in the production process' },
      { key: 'B', text: 'To account for changes in consumer retail price indices' },
      { key: 'C', text: 'To calculate total tax revenues received by the central exchequer' },
      { key: 'D', text: 'To deduct imports before calculating balance of payments' },
    ],
    correctAnswer: 'A',
    explanation: 'Deducting intermediate consumption from gross output isolates the net value added, eliminating duplication across supply chain stages.',
    createdAt: '2026-08-25',
  },
  {
    id: 'bank-q7',
    questionText: 'What is the purpose of the Seaborn library in the Python official statistical ecosystem?',
    competency: 'Data Visualization',
    difficulty: 'Easy',
    questionType: 'MCQ',
    usageCount: 104,
    status: 'Active',
    options: [
      { key: 'A', text: 'High-level statistical graphics interface built on top of Matplotlib' },
      { key: 'B', text: 'Database connection pooler' },
      { key: 'C', text: 'Web application web server' },
      { key: 'D', text: 'Distributed array manager' },
    ],
    correctAnswer: 'A',
    explanation: 'Seaborn provides attractive default themes and statistical plotting functions (histograms, KDEs, pairplots) integrated with Pandas.',
    createdAt: '2026-08-28',
  },
  {
    id: 'bank-q8',
    questionText: 'In supervised machine learning applied to survey imputation, which metric is most resilient to skewed microdata outliers?',
    competency: 'AI / ML',
    difficulty: 'Hard',
    questionType: 'Practical Case',
    usageCount: 45,
    status: 'Draft',
    options: [
      { key: 'A', text: 'Mean Absolute Error (MAE)' },
      { key: 'B', text: 'Root Mean Squared Error (RMSE)' },
      { key: 'C', text: 'R-Squared Score' },
      { key: 'D', text: 'Mean Squared Logarithmic Error without floor' },
    ],
    correctAnswer: 'A',
    explanation: 'MAE weights errors linearly rather than quadratically, making it significantly less sensitive to extreme statistical outliers than RMSE.',
    createdAt: '2026-09-01',
  },
];

// Mock AI generated questions pool for /trainer/assessment-generator
export const mockAiGeneratedQuestionsPool: QuizQuestionItem[] = [
  {
    id: 'gen-q1',
    questionNumber: 1,
    questionText: 'Which Python library provides the DataFrame structure for manipulating structured tabular data?',
    options: [
      { key: 'A', text: 'NumPy' },
      { key: 'B', text: 'Pandas' },
      { key: 'C', text: 'TensorFlow' },
      { key: 'D', text: 'Flask' },
    ],
    correctAnswer: 'B',
    explanation: 'Pandas is widely used for manipulating structured and tabular data across official data processing workflows.',
    difficulty: 'Beginner',
    competency: 'Python',
    sourceReference: 'Module 2 — Data Analysis Fundamentals',
  },
  {
    id: 'gen-q2',
    questionNumber: 2,
    questionText: 'In survey data cleaning with Pandas, which function is used to convert categorical variables into dummy or indicator indicators?',
    options: [
      { key: 'A', text: 'pd.get_dummies()' },
      { key: 'B', text: 'df.to_indicators()' },
      { key: 'C', text: 'pd.categorize()' },
      { key: 'D', text: 'df.split_columns()' },
    ],
    correctAnswer: 'A',
    explanation: 'pd.get_dummies() converts categorical variables into dummy/indicator 0/1 columns for econometric modeling.',
    difficulty: 'Intermediate',
    competency: 'Python',
    sourceReference: 'Section 4.1 — Categorical Variable Encoding',
  },
  {
    id: 'gen-q3',
    questionNumber: 3,
    questionText: 'What is the primary benefit of vectorization in NumPy compared to standard Python loops?',
    options: [
      { key: 'A', text: 'Vectorization delegates iterative loops to compiled C/Fortran code, yielding 10x-100x speedups' },
      { key: 'B', text: 'Vectorization allows mixing strings and numbers in the same contiguous array' },
      { key: 'C', text: 'Vectorization automatically handles web scraping routines' },
      { key: 'D', text: 'Vectorization removes the need for memory allocation' },
    ],
    correctAnswer: 'A',
    explanation: 'Vectorized operations execute in compiled C backend loops, bypassing Python bytecode interpretation overhead.',
    difficulty: 'Beginner',
    competency: 'Python',
    sourceReference: 'Module 2 — High Performance Computing with NumPy',
  },
  {
    id: 'gen-q4',
    questionNumber: 4,
    questionText: 'Which SQL operator is used to search for a specified pattern in a column using wildcards like % and _?',
    options: [
      { key: 'A', text: 'MATCH' },
      { key: 'B', text: 'CONTAINS' },
      { key: 'C', text: 'LIKE' },
      { key: 'D', text: 'SIMILAR' },
    ],
    correctAnswer: 'C',
    explanation: 'The LIKE operator is used in a WHERE clause to search for a specified pattern in a column.',
    difficulty: 'Beginner',
    competency: 'SQL',
    sourceReference: 'Syllabus Item 3 — Filtering and Pattern Matching',
  },
  {
    id: 'gen-q5',
    questionNumber: 5,
    questionText: 'When calculating survey weights, what does the design weight (or base weight) represent?',
    options: [
      { key: 'A', text: 'The inverse of the inclusion probability of the sampling unit' },
      { key: 'B', text: 'The ratio of respondents to non-respondents in the district' },
      { key: 'C', text: 'The standard error of the sample proportion' },
      { key: 'D', text: 'The interview duration penalty factor' },
    ],
    correctAnswer: 'A',
    explanation: 'The design weight is mathematically defined as the reciprocal of the selection probability: w_i = 1 / p_i.',
    difficulty: 'Advanced',
    competency: 'Sampling Techniques',
    sourceReference: 'MoSPI National Sample Survey Frame Manual, Chapter 4',
  },
  {
    id: 'gen-q6',
    questionNumber: 6,
    questionText: 'In GIS spatial joins, what type of predicate evaluates whether a point observation lies strictly inside an administrative polygon boundary?',
    options: [
      { key: 'A', text: 'ST_Touches' },
      { key: 'B', text: 'ST_Contains / ST_Within' },
      { key: 'C', text: 'ST_Disjoint' },
      { key: 'D', text: 'ST_Crosses' },
    ],
    correctAnswer: 'B',
    explanation: 'ST_Contains returns true if no points of the secondary geometry lie in the exterior of the first geometry.',
    difficulty: 'Intermediate',
    competency: 'GIS',
    sourceReference: 'QGIS Spatial Analysis Handbook, Unit 6',
  },
];
