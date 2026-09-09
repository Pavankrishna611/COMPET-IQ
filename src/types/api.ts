/**
 * Backend API Response & Request Type Definitions
 * Aligned with FastAPI Pydantic Models across Parts 1-9.
 */

// ============================================================================
// 1. Authentication & Users
// ============================================================================
export interface LoginRequest {
  email: string; // Supports official_id or email
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role?: 'LEARNER' | 'TRAINER';
  phone_number?: string;
  official_id?: string;
  designation?: string;
  department?: string;
  organization?: string;
  job_role?: string;
  experience_years?: number;
  role_id?: string;
  department_id?: string;
}

export interface TokenUser {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: TokenUser;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface UserResponse {
  id: string;
  official_id: string;
  email: string;
  full_name: string;
  designation?: string;
  experience_years: number;
  is_active: boolean;
  role?: RoleResponse;
  department?: DepartmentResponse;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 2. Competencies
// ============================================================================
export interface CompetencyResponse {
  id: string;
  name: string;
  code: string;
  domain: string;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompetencyResponse {
  id: string;
  user_id?: string;
  competency_id: string;
  competency?: CompetencyResponse;
  competency_name?: string;
  competency_code?: string;
  domain?: string;
  current_level: number;
  confidence_score: number;
  last_evaluated_at?: string;
  last_assessed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// 3. Skill Gap Analysis
// ============================================================================
export interface SkillGapItem {
  competency_id: string;
  competency_name: string;
  competency_code: string;
  domain: string;
  current_level: number;
  required_level: number;
  gap: number;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'STRONG';
  recommended_action: string;
}

export interface SkillGapSummary {
  total_competencies: number;
  critical_gaps: number;
  high_priority_gaps: number;
  moderate_gaps: number;
  low_priority_gaps: number;
  strong_competencies: number;
  average_competency: number;
  average_gap: number;
}

export interface SkillGapAnalysisResponse {
  user_id: string;
  role: string;
  summary: SkillGapSummary;
  skill_gaps: SkillGapItem[];
  analyzed_at: string;
}

// ============================================================================
// 4. Courses & Recommendations
// ============================================================================
export interface CourseCompetencyDetail {
  competency_id: string;
  competency_name: string;
  competency_code: string;
  expected_improvement: number;
}

export interface CourseDetailPrerequisite {
  prerequisite_course_id: string;
  prerequisite_title: string;
}

export interface CourseResponse {
  id: string;
  title: string;
  provider: string;
  domain: string;
  difficulty: string;
  duration_hours: number;
  description?: string;
  learning_objectives?: string;
  url?: string;
  is_active: boolean;
  competencies: CourseCompetencyDetail[];
  prerequisites: CourseDetailPrerequisite[];
  created_at: string;
  updated_at: string;
}

export interface CourseRecommendationResponse {
  course_id: string;
  course_title: string;
  provider: string;
  domain?: string | null;
  difficulty: string;
  duration_hours: number;
  description?: string;
  recommendation_score: number;
  priority: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  matching_competencies: string[];
  reason: string;
  is_interested: boolean;
  is_in_learning_path: boolean;
  score?: number;
  recommendation_reasons?: string[];
  targeted_competencies?: string[];
}


// ============================================================================
// 5. Learning Paths
// ============================================================================
export interface LearningPathItemBriefCourse {
  id: string;
  title: string;
  provider: string;
  domain: string;
  difficulty: string;
  duration_hours: number;
  url?: string;
}

export interface LearningPathItemResponse {
  id: string;
  sequence_order: number;
  course: LearningPathItemBriefCourse;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  priority: string;
  reason: string;
  estimated_duration_hours: number;
}

export interface LearningPathResponse {
  id: string;
  title: string;
  description?: string;
  target_role: string;
  estimated_duration_hours: number;
  status: string;
  generated_at: string;
  items: LearningPathItemResponse[];
}

export interface LearningPathGenerationResponse {
  learning_path: LearningPathResponse;
  skill_gaps_used: number;
  courses_recommended: number;
  generated_at: string;
}

export interface WatchTimeStatsResponse {
  total_watch_hours: number;
  completed_courses_count: number;
  in_progress_courses_count: number;
  total_courses_count: number;
  completion_rate_percent: number;
}

export type LearningPathItem = LearningPathItemResponse;
export type SkillGapResponse = SkillGapAnalysisResponse;

// ============================================================================
// 6. Assessments & Quizzes
// ============================================================================
export interface AssessmentResponse {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes: number;
  difficulty: string;
  status: string;
  question_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  due_date?: string;
  assigned_to_me?: boolean;
  assigned_learners_count?: number;
}

export interface AssessmentAssignRequest {
  learner_ids: string[];
  due_date?: string;
}

export interface AssessmentAssignmentResponse {
  id: string;
  assessment_id: string;
  user_id: string;
  learner_name: string;
  learner_email: string;
  learner_official_id: string;
  department_name?: string;
  designation?: string;
  assigned_at: string;
  due_date?: string;
  status: string;
}

export interface AssessmentAssignResult {
  assessment_id: string;
  assigned_count: number;
  skipped_duplicates_count: number;
  assignments: AssessmentAssignmentResponse[];
  message: string;
}

export interface AssignableLearnerResponse {
  id: string;
  official_id: string;
  full_name: string;
  email: string;
  designation?: string;
  department_name?: string;
  current_assignment?: string;
}

export interface QuestionLearnerResponse {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  points: number;
  sequence_order: number;
}

export interface QuizStartResponse {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  duration_minutes: number;
  started_at: string;
  status: string;
  questions: QuestionLearnerResponse[];
}

export interface QuizActiveResponse {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  duration_minutes: number;
  started_at: string;
  status: string;
  questions: QuestionLearnerResponse[];
  saved_answers: Record<string, string>;
}

export interface CompetencyScoreBreakdown {
  competency_id?: string;
  competency_name: string;
  questions_count: number;
  correct_count: number;
  score_percentage: number;
  competency_level_delta: number;
  updated_level?: number;
}

export interface QuestionReviewItem {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option?: string;
  correct_option: string;
  is_correct: boolean;
  explanation?: string;
  competency_name?: string;
}

export interface QuizResultResponse {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  score: number;
  total_points: number;
  percentage: number;
  status: string;
  completed_at?: string;
  time_taken_seconds?: number;
  competency_breakdown: CompetencyScoreBreakdown[];
  question_reviews: QuestionReviewItem[];
}

export interface UserAttemptHistoryItem {
  attempt_id: string;
  assessment_id: string;
  assessment_title: string;
  status: string;
  score?: number;
  total_points?: number;
  percentage?: number;
  started_at: string;
  completed_at?: string;
}

// ============================================================================
// 7. AI Learning Assistant
// ============================================================================
export interface SourceReference {
  material_id?: string;
  material_title: string;
  chunk_index: number;
  relevance_score: number;
  snippet?: string;
}

export interface AssistantResponse {
  conversation_id: string;
  answer: string;
  sources: SourceReference[];
  confidence?: number;
  suggested_followups: string[];
  generation_mode: 'RAG_LLM' | 'RETRIEVAL_ONLY';
}

export interface ConversationResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  sources?: SourceReference[];
  created_at: string;
}

export interface ConversationDetailResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessageResponse[];
}

// ============================================================================
// 8. Learning Material & AI Assessment Generator
// ============================================================================
export interface LearningMaterialResponse {
  id: string;
  title: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: string;
  is_approved: boolean;
  created_at: string;
  has_extracted_text?: boolean;
  word_count?: number;
  extraction_error?: string;
  material_type?: string;
}


export interface MaterialAnalysisResponse {
  material_id: string;
  title: string;
  word_count: number;
  estimated_reading_minutes: number;
  topics: string[];
  keywords: string[];
}

export interface GeneratedQuestionResponse {
  id: string;
  learning_material_id: string;
  competency_id?: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  generation_status: 'GENERATED' | 'APPROVED' | 'REJECTED' | 'EDITED';
  validation_status: 'PENDING' | 'VALID' | 'INVALID';
  generation_mode: 'AI' | 'MOCK';
  created_at: string;
  source_reference?: string;
  topic?: string;
  options?: string[];
}

export interface GeneratedQuestionsResponse {
  material_id: string;
  generation_mode: 'AI' | 'MOCK';
  questions: GeneratedQuestionResponse[];
  generated_count: number;
  invalid_count: number;
  duplicate_warnings?: string[];
}

export interface TrainerAssessmentGenerateRequest {
  number_of_questions: number;
  difficulty?: string;
  title?: string;
  competency_id?: string;
}

export interface TrainerGeneratedQuestionPreview {
  id: string;
  sequence_order: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
  topic?: string;
  source_reference?: string;
}

export interface TrainerAssessmentDraftResponse {
  assessment_id: string;
  title: string;
  description?: string;
  material_id: string;
  material_title: string;
  status: string;
  assessment_type: string;
  is_published: boolean;
  difficulty: string;
  number_of_questions: number;
  generation_mode: string;
  is_mock_fallback: boolean;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  questions: TrainerGeneratedQuestionPreview[];
}

export interface TrainerDraftQuestionUpdate {
  id?: string;
  sequence_order?: number;
  question_text: string;
  question_type?: string;
  difficulty?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
  points?: number;
  topic?: string;
}

export interface TrainerDraftSaveRequest {
  title?: string;
  description?: string;
  difficulty?: string;
  duration_minutes?: number;
  questions?: TrainerDraftQuestionUpdate[];
}

export interface TrainerDraftSummaryItem {
  assessment_id: string;
  title: string;
  description?: string;
  difficulty: string;
  status: string;
  assessment_type: string;
  number_of_questions: number;
  created_at: string;
  updated_at?: string;
  published_at?: string;
}

export interface PracticeQuizAnswerSubmit {
  question_id: string;
  selected_option?: string | null;
}

export interface PracticeQuizSubmitRequest {
  answers: PracticeQuizAnswerSubmit[];
  time_taken_seconds?: number;
}

export interface PracticeQuestionReviewItem {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option?: string | null;
  correct_option: string;
  is_correct: boolean;
  explanation?: string;
  topic?: string;
  difficulty?: string;
}

export interface PracticeQuizResultResponse {
  attempt_id: string;
  material_id: string;
  material_title: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score: number;
  percentage: number;
  time_taken_seconds?: number;
  submitted_at: string;
  question_review: PracticeQuestionReviewItem[];
}

export interface WeakTopicAnalysis {
  topic: string;
  missed_count: number;
  total_count: number;
  miss_rate: number;
  diagnosis: string;
  difficulty_spread?: Record<string, number>;
}

export interface CompetencyReference {
  id: string;
  code: string;
  name: string;
  domain: string;
  category?: string | null;
}

export interface CourseReference {
  id: string;
  title: string;
  provider: string;
  domain: string;
  difficulty: string;
  duration_hours: number;
  url?: string | null;
}

export interface PracticeFeedbackResponse {
  attempt_id: string;
  learning_material_id: string;
  material_title: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score: number;
  percentage: number;
  time_taken_seconds?: number;
  overall_summary: string;
  strengths: string[];
  weak_topics: WeakTopicAnalysis[];
  weak_skills: string[];
  improvement_areas: string[];
  recommended_next_steps: string[];
  mapped_competencies: CompetencyReference[];
  recommended_courses: CourseReference[];
  generation_mode: 'AI' | 'MOCK_FALLBACK';
  is_mock_fallback: boolean;
  created_at: string;
  disclaimer: string;
}



// ============================================================================
// 9. Administrative Analytics
// ============================================================================
export interface DepartmentHealthMetric {
  department_id?: string;
  department: string;
  total_officers: number;
  assessed_officers: number;
  assessed_pct: number;
  average_competency: number;
  critical_gaps: number;
  health_status: string;
}

export interface CompetencyDistributionItem {
  level: string;
  count: number;
  percentage: number;
}

export interface TopSkillGapMetric {
  competency: string;
  domain: string;
  average_gap: number;
  affected_officers: number;
  priority: string;
}

export interface WorkforceInsightItem {
  id: string;
  title: string;
  description: string;
  impact_level: string;
  category: string;
  metric_highlight: string;
  source: string;
}

export interface DashboardAnalyticsResponse {
  total_officers: number;
  active_learners: number;
  average_competency_score: number;
  critical_skill_gaps: number;
  learning_completion_rate: number;
  department_health: DepartmentHealthMetric[];
  competency_distribution: CompetencyDistributionItem[];
  top_skill_gaps: TopSkillGapMetric[];
  insights: WorkforceInsightItem[];
}

export interface WorkforceAnalyticsResponse {
  total_officers: number;
  assessed_officers: number;
  assessment_coverage_pct: number;
  department_metrics: DepartmentHealthMetric[];
  cadre_distribution: { cadre: string; officers: number; assessed_pct: number; avg_competency: number }[];
  competency_domain_averages: { domain: string; average_score: number }[];
}

export interface SkillGapAnalyticsResponse {
  total_gaps_identified: number;
  critical_gaps_count: number;
  high_priority_gaps_count: number;
  moderate_gaps_count: number;
  top_gaps: TopSkillGapMetric[];
  department_gaps: { department: string; critical_gaps: number; high_gaps: number }[];
}

export interface TrainingAnalyticsResponse {
  total_assessments_conducted: number;
  average_score_pct: number;
  pass_rate_pct: number;
  total_learning_hours_estimated: number;
  active_learning_paths_count: number;
  popular_courses: { id: string; title: string; provider: string; enrolled: number; rating: number }[];
  recent_assessments_performance: any[];
}

export interface AIInsightsResponse {
  generated_at: string;
  insights: WorkforceInsightItem[];
}

// ============================================================================
// 10. Onboarding & User Profile Models (Part 9)
// ============================================================================
export interface OnboardingStatusResponse {
  current_step: number;
  profile_completed: boolean;
  skills_completed: boolean;
  competency_initialized: boolean;
  onboarding_completed: boolean;
  next_action: string;
}

export interface ProfileCreate {
  department_id?: string;
  department?: string;
  designation?: string;
  job_role?: string;
  current_assignment?: string;
  employment_type?: string;
  experience_years?: number;
  experience?: number | string;
  education_level?: string;
  education?: string;
  specialization?: string;
  current_work_area?: string;
  previous_trainings?: string;
  professional_goal?: string;
  career_goal?: string;
  location?: string;
  bio?: string;
}

export interface ProfileUpdate {
  department_id?: string;
  department?: string;
  designation?: string;
  job_role?: string;
  current_assignment?: string;
  employment_type?: string;
  experience_years?: number;
  experience?: number | string;
  education_level?: string;
  education?: string;
  specialization?: string;
  current_work_area?: string;
  previous_trainings?: string;
  professional_goal?: string;
  career_goal?: string;
  location?: string;
  bio?: string;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  full_name?: string;
  department_id?: string;
  department_name?: string;
  department?: string;
  designation?: string;
  job_role?: string;
  current_assignment?: string;
  employment_type: string;
  experience_years: number;
  experience?: number | string;
  education_level: string;
  education?: string;
  specialization?: string;
  current_work_area?: string;
  previous_trainings?: string;
  professional_goal?: string;
  career_goal?: string;
  location?: string;
  bio?: string;
  profile_completed: boolean;
  skills_completed: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface CompetencyOption {
  id: string;
  name: string;
  description?: string;
  domain?: string;
}

export interface CompetencyDomainGroup {
  domain: string;
  competencies: CompetencyOption[];
}

export interface AvailableCompetenciesResponse {
  domains: CompetencyDomainGroup[];
}

export interface SkillDeclarationCreate {
  competency_id: string;
  self_assessed_level: number;
  confidence_level: 'LOW' | 'MEDIUM' | 'HIGH';
  years_of_experience?: number;
  last_used?: string;
}

export interface BulkSkillDeclarationRequest {
  skills: SkillDeclarationCreate[];
}

export interface SkillDeclarationResponse {
  id: string;
  competency_id: string;
  competency_name: string;
  competency_code?: string;
  competency_domain?: string;
  domain?: string;
  category?: string;
  self_assessed_level: number;
  confidence_level: string;
  years_of_experience: number;
  last_used?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Part 9C: AI Competency Analysis & Suggestion
// ============================================================================
export interface ProfileAnalysisRequest {
  department?: string;
  designation?: string;
  job_role?: string;
  current_assignment?: string;
  assignment?: string;
  employment_type?: string;
  experience_years?: number;
  experience?: number | string;
  education_level?: string;
  education?: string;
  specialization?: string;
  current_work_area?: string;
  previous_trainings?: string;
  professional_goal?: string;
  career_goal?: string;
  location?: string;
  bio?: string;
}

export interface SuggestedCompetencyResponse {
  competency_id: string;
  competency_name: string;
  domain: string;
  relevance_reason: string;
  required_level: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface AcceptedCompetencyItem {
  competency_id: string;
  competency_name?: string;
  domain?: string;
  required_level?: number;
  priority?: string;
}

export interface AcceptCompetenciesRequest {
  competencies: AcceptedCompetencyItem[];
}

export interface AcceptCompetenciesResponse {
  status: string;
  message: string;
  saved_count: number;
  competency_ids: string[];
}

// ============================================================================
// Part 9D: Competency Evaluation & Skill-Gap Analysis
// ============================================================================
export interface CompetencyEvaluationItem {
  competency_id: string;
  competency_name: string;
  competency_code: string;
  domain: string;
  current_level: number;
  current_level_source: 'ASSESSED' | 'TRAINING' | 'EXPERIENCE' | 'SELF_REPORTED' | 'INITIAL_ESTIMATE';
  required_level: number;
  gap: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MET';
  relevance: string;
  why_required: string;
  evidence: string;
  requirement_met: boolean;
}

export interface CompetencyEvaluationSummary {
  total_competencies: number;
  requirements_met: number;
  critical_gaps: number;
  high_priority_gaps: number;
  moderate_gaps: number;
  low_priority_gaps: number;
  average_current_level: number;
  average_required_level: number;
  overall_competency_score?: number | null;
  overall_gap_indicator: string;
}

export interface LearnerProfileSummaryInfo {
  full_name?: string;
  designation?: string;
  job_role?: string;
  department?: string;
  career_goal?: string;
}

export interface CompetencyEvaluationResponse {
  learner_profile: LearnerProfileSummaryInfo;
  summary: CompetencyEvaluationSummary;
  competencies: CompetencyEvaluationItem[];
  evaluated_at: string;
}

// ============================================================================
// 12. Interested Courses (Part 9E)
// ============================================================================
export interface InterestedCourseResponse {
  id: string;
  course_id: string;
  course_title: string;
  provider: string;
  difficulty: string;
  duration_hours: number;
  domain?: string | null;
  marked_at: string;
  is_in_learning_path: boolean;
}

