import type { User } from '@/types';
import { addDaysISO, todayISO } from '@/utils/date';

const iso = (offsetDays: number, time = '10:30') => `${addDaysISO(todayISO(), offsetDays)}T${time}:00`;

/** Demo accounts (dummy data). Passwords are plain text on purpose — this is a frontend-only demo. */
export const SEED_USERS: User[] = [
  {
    id: 'user_admin',
    username: 'admin',
    password: 'admin123',
    name: 'Dr. Bijay Mohanty',
    role: 'admin',
    status: 'active',
    email: 'admin@pscollege.ac.in',
    createdAt: iso(-320),
    lastLoginAt: iso(0, '09:05'),
  },
  {
    id: 'user_librarian',
    username: 'librarian',
    password: 'librarian123',
    name: 'Smita Patra',
    role: 'librarian',
    status: 'active',
    email: 'library@pscollege.ac.in',
    createdAt: iso(-280),
    lastLoginAt: iso(0, '09:40'),
  },
  {
    id: 'user_librarian2',
    username: 'librarian2',
    password: 'librarian123',
    name: 'Manoj Kumar Dash',
    role: 'librarian',
    status: 'active',
    email: 'manoj.dash@pscollege.ac.in',
    createdAt: iso(-120),
    lastLoginAt: iso(-2, '13:10'),
  },
  {
    id: 'user_staff',
    username: 'staff',
    password: 'staff123',
    name: 'Priyanka Samal',
    role: 'staff',
    status: 'active',
    email: 'priyanka.samal@pscollege.ac.in',
    createdAt: iso(-180),
    lastLoginAt: iso(0, '08:45'),
  },
  {
    id: 'user_principal',
    username: 'principal',
    password: 'principal123',
    name: 'Prof. Ramesh Chandra Jena',
    role: 'principal',
    status: 'active',
    email: 'principal@pscollege.ac.in',
    createdAt: iso(-500),
    lastLoginAt: iso(-1, '11:00'),
  },
  {
    id: 'user_student_2026001',
    username: '2026001',
    password: 'student123',
    name: 'Ankit Rout',
    role: 'student',
    status: 'active',
    email: 'ankit.rout@pscollege.ac.in',
    memberId: 'MEM-1001',
    createdAt: iso(-400),
    lastLoginAt: iso(-3, '18:25'),
  },
];

/** Shown on the login page so reviewers can try every role. */
export const DEMO_LOGIN_HINTS: { role: string; username: string; password: string }[] = [
  { role: 'Administrator', username: 'admin', password: 'admin123' },
  { role: 'Librarian', username: 'librarian', password: 'librarian123' },
  { role: 'Staff Desk', username: 'staff', password: 'staff123' },
  { role: 'Principal (Read-Only)', username: 'principal', password: 'principal123' },
  { role: 'Student', username: '2026001', password: 'student123' },
];
