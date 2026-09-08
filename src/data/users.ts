import { User } from '@/types';

export const mockUsers: Record<'learner' | 'admin' | 'trainer', User> = {
  learner: {
    id: 'usr_learner_01',
    name: 'Arjun Kumar',
    email: 'arjun.kumar@mospi.gov.in',
    designation: 'Statistical Investigator',
    department: 'Survey Design and Research Division (SDRD)',
    cadre: 'SSS',
    role: 'learner',
    employeeId: 'SSS-2021-0892',
    joinedDate: '2021-07-15',
    avatarUrl: '',
  },
  admin: {
    id: 'usr_admin_01',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@mospi.gov.in',
    designation: 'Administrator',
    department: 'National Accounts Division & Training Wing',
    cadre: 'ISS',
    role: 'admin',
    employeeId: 'ISS-2012-0198',
    joinedDate: '2012-03-10',
    avatarUrl: '',
  },
  trainer: {
    id: 'usr_trainer_01',
    name: 'Rahul Verma',
    email: 'rahul.verma@nssta.gov.in',
    designation: 'Training Officer',
    department: 'National Statistical Systems Training Academy (NSSTA)',
    cadre: 'Field Operations',
    role: 'trainer',
    employeeId: 'TRN-2016-0089',
    joinedDate: '2016-09-01',
    avatarUrl: '',
  },
};

export const currentUserMock = mockUsers.learner;
