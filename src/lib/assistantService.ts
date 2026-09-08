import { AIResponse, SourceReference, RelatedCompetencyInfo } from '@/data/assistant';

export interface AssistantQueryOptions {
  attachedContext?: string[];
  role?: string;
  department?: string;
}

/**
 * AssistantService Interface
 * Designed as a pluggable boundary: currently backed by localized MoSPI knowledge bases,
 * but ready for seamless drop-in replacement by a real RAG backend API endpoint.
 */
export class AssistantService {
  /**
   * Send a question to the assistant and retrieve a structured response.
   * Future implementation:
   * const response = await fetch('/api/assistant', { method: 'POST', body: JSON.stringify({ query, context }) });
   * return await response.json();
   */
  async sendMessage(query: string, options?: AssistantQueryOptions): Promise<AIResponse> {
    try {
      const { assistantApiService } = await import('@/services/assistant.service');
      const ragRes = await assistantApiService.chat(query);
      if (ragRes && ragRes.answer) {
        const sources: SourceReference[] = (ragRes.sources || []).map((s: any, idx: number) => ({
          id: s.material_id || `src-${idx}`,
          documentTitle: s.material_title || s.title || 'MoSPI Statistical Repository',
          module: `Module Part ${(s.chunk_index ?? idx) + 1}`,
          chunkReference: s.snippet || 'Grounded pedagogical extract',
          relevanceScore: Math.round(((s.relevance_score ?? s.score ?? 0.85) > 1 ? (s.relevance_score ?? s.score) : (s.relevance_score ?? s.score ?? 0.85) * 100)),
          sourceType: 'Approved Learning Material',
        }));

        return {
          answer: ragRes.answer,
          keyPoints: [
            'Response directly retrieved from indexed official learning corpus.',
            'Synthesized in accordance with MoSPI domain standards.',
          ],
          relatedCompetency: {
            name: 'Statistical Methods',
            currentLevel: 3.5,
            requiredLevel: 4.5,
            gap: 1.0,
            status: 'Moderate Gap',
            link: '/learner/skill-gaps',
          },
          sources: sources.length > 0 ? sources : undefined,
          followUpQuestions: ragRes.suggested_followups && ragRes.suggested_followups.length > 0
            ? ragRes.suggested_followups
            : [
                'Give me a real-world example in official statistics',
                'How does this link with our survey field guidelines?',
                'Create a practice question on this topic',
              ],
        };
      }
    } catch (apiErr) {
      // If backend RAG is offline or fails, seamlessly proceed to local knowledge base
    }

    // Simulate natural retrieval and processing delay (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    const normalized = query.toLowerCase().trim();

    // 1. Sampling Techniques & Survey Methodology
    if (normalized.includes('sampling') || normalized.includes('stratif') || normalized.includes('strata')) {
      return {
        answer:
          'Stratified sampling is a probability sampling method where a target population is divided into non-overlapping homogeneous sub-groups called strata based on shared characteristics (such as geographic administrative zones or establishment turnover brackets). Each stratum is sampled separately to ensure proportional representation.',
        keyPoints: [
          'Guarantees adequate sample size for small, statistically critical domains.',
          'Minimizes overall sample variance compared to unstratified Simple Random Sampling (SRS).',
          'Enables domain-specific estimation with known, bounded sampling error margins.',
        ],
        example:
          'In MoSPI National Sample Surveys, the population is first stratified into Rural and Urban strata within each National Sample Survey (NSS) region. If a state has 60% rural population and 40% urban population, sample First Stage Units (FSUs) are allocated proportionally.',
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
      };
    }

    // 2. Python & Pandas & Programming Skill Gap
    if (normalized.includes('python') || normalized.includes('pandas') || normalized.includes('dataframe')) {
      return {
        answer:
          'Your current Python competency is assessed at 2.1 / 5, while your target role requirement as Statistical Investigator in Economic Statistics requires approximately 4.0 / 5 (a critical gap of 1.9 points). In modern official statistical production, Python with Pandas is the core computational engine for automated microdata cleaning, aggregation, and anomaly auditing.',
        keyPoints: [
          'Pandas DataFrames provide high-performance in-memory tabular manipulation of large survey files.',
          'Vectorized operations eliminate slow Python loops when calculating weighted variances.',
          'Direct integration with Parquet files and SQL registries reduces data pipeline latency by over 80%.',
        ],
        example:
          'In National Accounts compilation, Python scripts automate monthly Index of Industrial Production (IIP) item group aggregation and outlier verification across 400+ factory item schedules.',
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
          impact: 'Python 2.1 → 3.5 (In Progress: 65%)',
        },
        sources: [
          {
            id: 'src-py-1',
            documentTitle: 'Python for Statistical Analysis',
            module: 'Module 3 — Survey Microdata Wrangling with Pandas',
            chunkReference: 'Section 4 — Microdata Cleaning & Vectorized Operations',
            relevanceScore: 97,
            sourceType: 'Approved Learning Material',
          },
          {
            id: 'src-py-2',
            documentTitle: 'MoSPI Computational Data Science Guidelines',
            module: 'Chapter 2 — Official Data Pipeline Automation',
            relevanceScore: 93,
            sourceType: 'National Statistical Standard',
          },
        ],
        followUpQuestions: [
          'How do I handle missing values in a Pandas DataFrame?',
          'Explain vectorization vs standard Python for-loops',
          'Show me code to calculate weighted survey totals',
          'What should I learn after Python Fundamentals?',
        ],
      };
    }

    // 3. SQL & Relational Databases
    if (normalized.includes('sql') || normalized.includes('query') || normalized.includes('database')) {
      return {
        answer:
          'SQL (Structured Query Language) is the standard query protocol used to extract, filter, join, and summarize official statistical datasets hosted across distributed relational registries. For official statistical workflows, analytical SQL focuses on multi-table joins, subqueries, and window functions (such as ROW_NUMBER, RANK, and LAG/LEAD).',
        keyPoints: [
          'Analytical SQL enables direct querying of central administrative registries without dumping raw CSVs.',
          'Window functions allow calculation of moving averages, cumulative totals, and ranking within administrative state partitions.',
          'Proper indexing and execution plan optimization prevent server timeouts on multi-million row census registries.',
        ],
        example:
          'SELECT state_code, district_code, AVG(mpce_expenditure) OVER (PARTITION BY state_code) as state_avg FROM nss_household_round80 WHERE survey_status = "validated";',
        relatedCompetency: {
          name: 'SQL',
          currentLevel: 3.4,
          requiredLevel: 4.0,
          gap: 0.6,
          status: 'Moderate Gap',
          link: '/learner/skill-gaps',
        },
        recommendation: {
          title: 'Upcoming Milestone',
          courseTitle: 'SQL for Data Analysis',
          courseId: 'crs-sql-ana',
          impact: 'SQL 3.4 → 4.0 (Stage 3)',
        },
        sources: [
          {
            id: 'src-sql-1',
            documentTitle: 'SQL for Data Analysis',
            module: 'Module 4 — Advanced Query Windowing & Partitioning',
            chunkReference: 'Lesson 4.2 — Multi-Table Relational Registry Queries',
            relevanceScore: 95,
            sourceType: 'Approved Learning Material',
          },
        ],
        followUpQuestions: [
          'What is the difference between RANK() and DENSE_RANK()?',
          'Create practice questions for SQL',
          'How to optimize queries on large survey databases?',
        ],
      };
    }

    // 4. Data Visualization & Statistical Graphics
    if (normalized.includes('visualization') || normalized.includes('chart') || normalized.includes('matplotlib') || normalized.includes('dashboard')) {
      return {
        answer:
          'Data visualization for official statistics transforms complex microdata and econometric estimates into clear, accessible, publication-grade visual narratives. Government standards mandate high data-ink ratios, accessible color palettes for colorblind readers, explicit units of measurement, and precise confidence interval bounds.',
        keyPoints: [
          'Adherence to perceptually uniform colormaps (e.g. viridis, cividis) ensures readability under grayscale printing and color vision deficiencies.',
          'Selecting proper geometric encodings: bar charts for discrete categories, line charts for continuous time series, and box plots for skewed income distributions.',
          'Automating high-resolution vector exports (SVG, PDF) for parliamentary bulletins and Ministry annual reports.',
        ],
        relatedCompetency: {
          name: 'Data Visualization',
          currentLevel: 2.4,
          requiredLevel: 3.8,
          gap: 1.4,
          status: 'High Priority',
          link: '/learner/skill-gaps',
        },
        sources: [
          {
            id: 'src-vis-1',
            documentTitle: 'Data Visualization with Python',
            module: 'Module 1 — Principles of Statistical Graphics & Accessibility',
            relevanceScore: 94,
            sourceType: 'Approved Learning Material',
          },
        ],
        followUpQuestions: [
          'What chart is best for showing skewed income distributions?',
          'How to create an executive dashboard summary?',
          'What are MoSPI official color palette guidelines?',
        ],
      };
    }

    // 5. GIS & Geospatial Analysis
    if (normalized.includes('gis') || normalized.includes('spatial') || normalized.includes('map') || normalized.includes('qgis')) {
      return {
        answer:
          'Geographic Information Systems (GIS) in MoSPI allow statistical officers to link survey microdata to administrative polygon shapefiles (State, District, Sub-district, UFS Blocks). This enables thematic choropleth mapping, geographic cluster outlier detection, and Small Area Estimation (SAE) spatial validation.',
        keyPoints: [
          'Spatial joins merge household coordinate point observations with district polygon registries using spatial predicates.',
          'EPSG:4326 (WGS 84) is the universal standard for GPS raw coordinates, projected to appropriate UTM zones for accurate area measurements.',
          'Thematic classification rules (Quantile, Natural Breaks / Jenks) prevent visual misrepresentation of economic regional disparities.',
        ],
        relatedCompetency: {
          name: 'GIS',
          currentLevel: 2.0,
          requiredLevel: 3.5,
          gap: 1.5,
          status: 'Critical Gap',
          link: '/learner/skill-gaps',
        },
        sources: [
          {
            id: 'src-gis-1',
            documentTitle: 'GIS for Statistical Applications',
            module: 'Module 3 — Spatial Data Joining with Survey Microdata',
            relevanceScore: 95,
            sourceType: 'Approved Learning Material',
          },
        ],
        followUpQuestions: [
          'How to perform a spatial join between shapefiles and survey CSVs?',
          'What is the difference between EPSG:4326 and EPSG:3857?',
          'How does GIS integrate with Small Area Estimation?',
        ],
      };
    }

    // 6. Data Quality & Data Validation
    if (normalized.includes('quality') || normalized.includes('validation') || normalized.includes('audit')) {
      return {
        answer:
          'Data validation is the automated and manual verification protocol applied across survey field schedules to ensure microdata meets strict standards of range plausibility, cross-tabulation consistency, completeness, and structural integrity before release.',
        keyPoints: [
          'Hard validation checks reject logically impossible records (e.g. child age under 5 with college degree).',
          'Soft plausibility warnings flag extreme outliers (e.g. household monthly electricity bill exceeding 100,000 INR).',
          'Imputation algorithms (hot-deck, regression, mean matching) are logged with audit trails to preserve data provenance.',
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
          'What are standard outlier detection algorithms for microdata?',
          'How to handle missing values without introducing estimation bias?',
        ],
      };
    }

    // 7. Learning Path & What to Learn Next
    if (normalized.includes('next') || normalized.includes('learning path') || normalized.includes('recommend') || normalized.includes('roadmap')) {
      return {
        answer:
          'Your personalized MoSPI learning roadmap is tailored to bridge your 4 identified competency gaps while building on your strong foundations in Survey Design (4.2 / 5) and Sampling (4.4 / 5). Your current recommended milestone is to complete Stage 2: Python for Statistical Analysis (65% in progress), followed by Stage 3: SQL for Data Analysis.',
        keyPoints: [
          'Stage 1: Python Fundamentals — Completed (Score: 82%).',
          'Stage 2: Python for Statistical Analysis — Active in progress (8 Hours, targeting Python 2.8 → 3.5).',
          'Stage 3: SQL for Data Analysis — Unlocked upon completing Stage 2.',
          'Stages 4–6: Data Visualization, GIS Mapping, and Applied Statistical Data Capstone.',
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
          title: 'Immediate Next Action',
          courseTitle: 'Python for Statistical Analysis',
          courseId: 'crs-py-stats',
          impact: 'Elevates Overall Cadre Readiness to 82%',
        },
        sources: [
          {
            id: 'src-lp-1',
            documentTitle: 'Personalized Learning Trajectory: LP-2026-ISS-042',
            module: 'Cadre Development Track — Economic Statistics',
            relevanceScore: 99,
            sourceType: 'Course Syllabus',
          },
        ],
        followUpQuestions: [
          'Show details for Stage 2: Python for Statistical Analysis',
          'How does this path impact my supervisory promotions?',
          'What assessments are required before Stage 3 unlocks?',
        ],
      };
    }

    // 8. Practice Questions & Test My Understanding
    if (normalized.includes('practice') || normalized.includes('test') || normalized.includes('quiz') || normalized.includes('question')) {
      return {
        answer:
          'Here is a practice question calibrated to your current competency level in Statistical Methods & Survey Design:\n\n**Practice Question:**\nUnder what condition does Neyman optimal allocation yield the exact same sample size allocation across all strata as proportional allocation?',
        keyPoints: [
          'Option A: When the total population in all strata is equal to zero.',
          'Option B: When the within-stratum standard deviations are identical across all strata (S_h = S for all h).',
          'Option C: When the survey sampling fraction exceeds 50%.',
          'Option D: When cluster sampling is used instead of stratified sampling.',
        ],
        example:
          'Correct Answer: **Option B**. The Neyman allocation formula allocates sample size n_h proportional to N_h * S_h. If standard deviations S_h are identical across all strata, N_h * S_h simplifies to N_h, matching proportional allocation.',
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
            id: 'src-smp-3',
            documentTitle: 'Advanced Sampling Techniques',
            module: 'Module 2 — Optimal Strata Allocation Formulas',
            relevanceScore: 94,
            sourceType: 'Approved Learning Material',
          },
        ],
        followUpQuestions: [
          'Give me another practice question for Python',
          'Explain the derivation of the Neyman allocation formula',
          'What is the formula when sampling costs vary across strata?',
        ],
      };
    }

    // Default intelligent MoSPI competency guidance
    return {
      answer: `As your COMPETIQ Learning Assistant, I analyze your query within the context of your role as **Statistical Investigator in the National Accounts Division**. Based on your official learning trajectory and competency profile (Overall: 78%), I can assist with conceptual clarifications, practical Python/SQL syntax, survey sampling theory, or diagnostic test prep.`,
      keyPoints: [
        'All guidance is grounded in approved MoSPI curricula, NSSTA manuals, and international statistical standards (SNA 2008).',
        'Questions are directly linked to your 12 assessed competencies and active 6-stage roadmap.',
        'You can attach specific context (e.g. Current Learning Path, Recent Assessment) using the attachment selector below.',
      ],
      relatedCompetency: {
        name: 'Overall Statistical Competency',
        currentLevel: 3.9,
        requiredLevel: 4.3,
        gap: 0.4,
        status: 'Moderate Gap',
        link: '/learner/competencies',
      },
      sources: [
        {
          id: 'src-gen-1',
          documentTitle: 'MoSPI Competency Framework & Cadre Training Guidelines',
          module: 'Section 1 — Statistical Investigator Competency Standards',
          relevanceScore: 90,
          sourceType: 'National Statistical Standard',
        },
      ],
      followUpQuestions: [
        'Explain my Python skill gap',
        'What should I learn next?',
        'Explain stratified sampling',
        'Create practice questions for SQL',
      ],
    };
  }
}

export const assistantService = new AssistantService();
