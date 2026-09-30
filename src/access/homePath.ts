import { ROUTES } from '@/routes/routePaths';
import { can, type PermissionMatrix, type Role } from './permissions';

/** First page a signed-in role is allowed to open (used after login and when a guard denies access). */
export function homePathFor(role: Role | undefined | null, matrix: PermissionMatrix): string {
  if (!role) return ROUTES.login;
  if (role === 'student') return ROUTES.studentDashboard;
  if (can(matrix, role, 'reports', 'view')) return ROUTES.dashboard;
  if (can(matrix, role, 'books', 'view')) return ROUTES.books;
  if (can(matrix, role, 'notices', 'view')) return ROUTES.notices;
  return ROUTES.noAccess;
}
