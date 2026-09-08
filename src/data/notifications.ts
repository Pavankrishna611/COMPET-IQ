import { Notification, Role } from '@/types';

export interface RoleNotification extends Notification {
  targetRole: Role;
}

export const mockNotifications: RoleNotification[] = [
  // Learner Notifications
  {
    id: 'notif_lrn_01',
    title: 'Assessment Available',
    message: 'Your Python competency assessment is available.',
    timestamp: '15m ago',
    read: false,
    type: 'info',
    targetRole: 'learner',
    actionUrl: '/learner/assessments',
  },
  {
    id: 'notif_lrn_02',
    title: 'New AI Recommendation',
    message: 'New course recommendation generated.',
    timestamp: '1h ago',
    read: false,
    type: 'ai',
    targetRole: 'learner',
    actionUrl: '/learner/courses',
  },
  {
    id: 'notif_lrn_03',
    title: 'Competency Milestone',
    message: 'Your competency score improved by 6%.',
    timestamp: '1d ago',
    read: true,
    type: 'success',
    targetRole: 'learner',
    actionUrl: '/learner/competencies',
  },

  // Admin Notifications
  {
    id: 'notif_adm_01',
    title: 'Workforce Gap Alert',
    message: 'Critical AI/ML skill gap detected.',
    timestamp: '30m ago',
    read: false,
    type: 'warning',
    targetRole: 'admin',
    actionUrl: '/admin/skill-gaps',
  },
  {
    id: 'notif_adm_02',
    title: 'Training Analytics Update',
    message: 'Training completion rate increased.',
    timestamp: '3h ago',
    read: false,
    type: 'success',
    targetRole: 'admin',
    actionUrl: '/admin/training',
  },
  {
    id: 'notif_adm_03',
    title: 'Report Published',
    message: 'New workforce analytics report is available.',
    timestamp: '2d ago',
    read: true,
    type: 'info',
    targetRole: 'admin',
    actionUrl: '/admin/workforce',
  },

  // Trainer Notifications
  {
    id: 'notif_trn_01',
    title: 'Assessment Published',
    message: 'Assessment successfully published.',
    timestamp: '45m ago',
    read: false,
    type: 'success',
    targetRole: 'trainer',
    actionUrl: '/trainer/assessments',
  },
  {
    id: 'notif_trn_02',
    title: 'Learner Activity',
    message: '12 learners completed the Python assessment.',
    timestamp: '4h ago',
    read: false,
    type: 'info',
    targetRole: 'trainer',
    actionUrl: '/trainer/assessments',
  },
];

export function getNotificationsForRole(role: Role): RoleNotification[] {
  return mockNotifications.filter((n) => n.targetRole === role);
}
