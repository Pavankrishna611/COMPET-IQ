/**
 * COMPETIQ Domain TypeScript Type Definitions
 * Architecture ready for future API / Backend integration
 */

export type Role = 'learner' | 'admin' | 'trainer';

export type Cadre = 'ISS' | 'SSS' | 'Field Operations' | 'Data Analytics' | 'General Administration';

export type PriorityLevel = 'critical' | 'moderate' | 'low';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type ItemStatus = 'completed' | 'in_progress' | 'locked';

export interface User {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  cadre: Cadre;
  role: Role;
  avatarUrl?: string;
  employeeId: string;
  joinedDate: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  ministry: string;
  division: string;
  totalOfficers: number;
}

export interface Competency {
  id: string;
  name: string;
  code: string;
  domain: string;
  category: 'Core Statistical' | 'Data Science & AI' | 'Survey & Field Operations' | 'Governance & Policy';
  description: string;
  currentLevel: number; // Scale 1 - 5
  requiredLevel: number; // Scale 1 - 5
  lastAssessed?: string;
  benchmarkScore?: number;
}

export interface SkillGap {
  id: string;
  competencyId: string;
  competencyName: string;
  domain: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number; // requiredLevel - currentLevel
  priority: PriorityLevel;
  impactScore?: number; // 1 - 100
}

export interface Course {
  id: string;
  title: string;
  provider: 'NSSTA' | 'iGOT Karmayogi' | 'MoSPI Internal' | 'NIC' | 'ISI Kolkata';
  duration: string; // e.g. "4h 30m"
  durationMinutes: number;
  difficulty: DifficultyLevel;
  skills: string[];
  recommendationScore: number; // 0 - 100
  format: 'Self-Paced' | 'Live Workshop' | 'Blended' | 'Interactive Sandbox';
  description?: string;
  thumbnailUrl?: string;
  enrolledCount?: number;
  url?: string;
}

export interface LearningPathItem {
  id: string;
  pathId: string;
  stepOrder: number;
  title: string;
  type: 'course' | 'assessment' | 'case_study' | 'milestone';
  duration: string;
  status: ItemStatus;
  competencyMapped: string;
  score?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  estimatedHours: number;
  items: LearningPathItem[];
}

export interface Question {
  id: string;
  assessmentId: string;
  questionText: string;
  type: 'multiple_choice' | 'scenario' | 'practical_case';
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty: DifficultyLevel;
  points: number;
}

export interface Assessment {
  id: string;
  title: string;
  competencyId: string;
  competencyName: string;
  domain: string;
  questionsCount: number;
  durationMinutes: number;
  passingScore: number;
  category: string;
  status: 'available' | 'in_progress' | 'completed' | 'expired';
  lastScore?: number;
  questions?: Question[];
}

export interface Recommendation {
  id: string;
  type: 'course' | 'assessment' | 'path';
  title: string;
  provider?: string;
  rationale: string;
  score: number; // 0 - 100
  competencyId: string;
  competencyName: string;
  tags: string[];
  isAiGenerated: boolean;
  actionUrl: string;
}

export interface WorkforceMetric {
  id: string;
  cadre: Cadre;
  totalOfficers: number;
  assessedOfficers: number;
  averageCompetencyScore: number; // 1 - 5
  criticalGapsIdentified: number;
  topGaps: { name: string; gapCount: number }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'ai';
  actionUrl?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badge?: string;
  badgeVariant?: 'teal' | 'ai' | 'warning' | 'info';
  roles: Role[];
  section?: 'main' | 'analytics' | 'management' | 'bottom';
}
