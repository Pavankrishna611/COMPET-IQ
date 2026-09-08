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
  phone_number?: string;
  official_id?: string;
  designation?: string;
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
  user_id: string;
  competency_id: string;
  competency: CompetencyResponse;
  current_level: number;
  confidence_score: number;
  last_evaluated_at?: string;
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
  domain: string;
  difficulty: string;
  duration_hours: number;
  description?: string;
  score: number;
  recommendation_reasons: string[];
  targeted_competencies: string[];
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
  designation?: string;
  employment_type?: string;
  experience_years?: number;
  education_level?: string;
  specialization?: string;
  current_work_area?: string;
  location?: string;
  bio?: string;
}

export interface ProfileUpdate {
  department_id?: string;
  designation?: string;
  employment_type?: string;
  experience_years?: number;
  education_level?: string;
  specialization?: string;
  current_work_area?: string;
  location?: string;
  bio?: string;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  department_id?: string;
  department_name?: string;
  designation?: string;
  employment_type: string;
  experience_years: number;
  education_level: string;
  specialization?: string;
  current_work_area?: string;
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
