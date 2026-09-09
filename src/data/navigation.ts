import { NavigationItem, Role } from '@/types';

export const navigationItems: NavigationItem[] = [
  // Learner Navigation
  {
    id: 'learner_dashboard',
    label: 'Dashboard',
    href: '/learner/dashboard',
    iconName: 'LayoutDashboard',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_competencies',
    label: 'My Competencies',
    href: '/learner/competencies',
    iconName: 'Target',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_skill_gaps',
    label: 'Skill Gaps',
    href: '/learner/skill-gaps',
    iconName: 'AlertTriangle',
    badge: '3 Critical',
    badgeVariant: 'warning',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_learning_path',
    label: 'Learning Path',
    href: '/learner/learning-path',
    iconName: 'Route',
    badge: '40%',
    badgeVariant: 'teal',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_recommendations',
    label: 'Recommendations',
    href: '/learner/recommendations',
    iconName: 'Sparkles',
    badge: 'AI',
    badgeVariant: 'ai',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_courses',
    label: 'Courses',
    href: '/learner/courses',
    iconName: 'BookOpen',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_interested_courses',
    label: 'Interested Courses',
    href: '/learner/interested-courses',
    iconName: 'BookmarkCheck',
    roles: ['learner'],
    section: 'main',
  },

  {
    id: 'learner_assessments',
    label: 'Assessments',
    href: '/learner/assessments',
    iconName: 'ClipboardCheck',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_quiz_generator',
    label: 'AI Quiz Generator',
    href: '/learner/quiz-generator',
    iconName: 'BrainCircuit',
    badge: 'AI',
    badgeVariant: 'ai',
    roles: ['learner'],
    section: 'main',
  },
  {
    id: 'learner_ai_assistant',
    label: 'AI Assistant',
    href: '/learner/assistant',
    iconName: 'Sparkles',
    badge: 'AI',
    badgeVariant: 'ai',
    roles: ['learner'],
    section: 'main',
  },

  {
    id: 'learner_profile',
    label: 'Profile',
    href: '/learner/profile',
    iconName: 'User',
    roles: ['learner'],
    section: 'main',
  },

  // Administrator Navigation
  {
    id: 'admin_dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    iconName: 'LayoutDashboard',
    roles: ['admin'],
    section: 'main',
  },
  {
    id: 'admin_workforce',
    label: 'Workforce',
    href: '/admin/workforce',
    iconName: 'Users',
    roles: ['admin'],
    section: 'main',
  },
  {
    id: 'admin_skill_gaps',
    label: 'Skill Gap Analytics',
    href: '/admin/skill-gaps',
    iconName: 'BarChart3',
    roles: ['admin'],
    section: 'main',
  },
  {
    id: 'admin_training',
    label: 'Training Analytics',
    href: '/admin/training',
    iconName: 'GraduationCap',
    roles: ['admin'],
    section: 'main',
  },
  {
    id: 'admin_insights',
    label: 'AI Insights',
    href: '/admin/insights',
    iconName: 'BrainCircuit',
    badge: 'AI',
    badgeVariant: 'ai',
    roles: ['admin'],
    section: 'main',
  },

  // Trainer Navigation
  {
    id: 'trainer_dashboard',
    label: 'Dashboard',
    href: '/trainer/dashboard',
    iconName: 'LayoutDashboard',
    roles: ['trainer'],
    section: 'main',
  },
  {
    id: 'trainer_generator',
    label: 'Assessment Generator',
    href: '/trainer/assessment-generator',
    iconName: 'FileSpreadsheet',
    roles: ['trainer'],
    section: 'main',
  },
  {
    id: 'trainer_assessments',
    label: 'Assessments',
    href: '/trainer/assessments',
    iconName: 'ClipboardCheck',
    roles: ['trainer'],
    section: 'main',
  },
  {
    id: 'trainer_question_bank',
    label: 'Question Bank',
    href: '/trainer/question-bank',
    iconName: 'Database',
    roles: ['trainer'],
    section: 'main',
  },

  // Bottom Navigation (Shared)
  {
    id: 'nav_settings',
    label: 'Settings',
    href: '#settings',
    iconName: 'Settings',
    roles: ['learner', 'admin', 'trainer'],
    section: 'bottom',
  },
  {
    id: 'nav_logout',
    label: 'Logout',
    href: '/login',
    iconName: 'LogOut',
    roles: ['learner', 'admin', 'trainer'],
    section: 'bottom',
  },
];

export function getNavigationForRole(role: Role): {
  mainItems: NavigationItem[];
  bottomItems: NavigationItem[];
} {
  const roleFiltered = navigationItems.filter((item) => item.roles.includes(role));
  return {
    mainItems: roleFiltered.filter((item) => item.section === 'main'),
    bottomItems: roleFiltered.filter((item) => item.section === 'bottom'),
  };
}
