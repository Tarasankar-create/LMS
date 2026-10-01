/**
 * Role-based access for the Library Management System: five roles and a fixed permission matrix
 * (module × action). There is no backend, so permissions are enforced in the browser only
 * (route guards and hidden controls). A real deployment must repeat every check on a server.
 */

export const ROLES = ['admin', 'librarian', 'staff', 'principal', 'student'] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ['admin', 'librarian', 'staff', 'principal'];

export const ROLE_META: Record<Role, { label: string; description: string }> = {
  admin: { label: 'Administrator', description: 'Full control of the library system and configuration.' },
  librarian: { label: 'Librarian', description: 'Runs circulation, catalogue, members, reservations, fines and reports.' },
  staff: { label: 'Staff', description: 'Circulation desk operations (issue, return, renew, reserve) and view catalogue/fines.' },
  principal: { label: 'Principal', description: 'Read-only access to all reports, catalogue, and fines.' },
  student: { label: 'Student', description: 'Student self-service portal only.' },
};

export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export const MODULES = [
  'books',
  'circulation',
  'members',
  'reservations',
  'fines',
  'reports',
  'librarySettings',
  'notices',
] as const;
export type Module = (typeof MODULES)[number];

export type PermissionMatrix = Record<Role, Partial<Record<Module, Action[]>>>;

export function buildDefaultMatrix(): PermissionMatrix {
  return {
    admin: {
      books: ['view', 'create', 'edit', 'delete'],
      circulation: ['view', 'create', 'edit'],
      members: ['view', 'create', 'edit', 'delete'],
      reservations: ['view', 'create', 'edit'],
      fines: ['view', 'edit'],
      reports: ['view'],
      librarySettings: ['view', 'edit'],
      notices: ['view', 'create', 'edit', 'delete'],
    },
    librarian: {
      books: ['view', 'create', 'edit', 'delete'],
      circulation: ['view', 'create', 'edit'],
      members: ['view', 'create', 'edit'],
      reservations: ['view', 'create', 'edit'],
      fines: ['view', 'edit'],
      reports: ['view'],
      notices: ['view', 'create', 'edit', 'delete'],
    },
    staff: {
      books: ['view'],
      circulation: ['view', 'create', 'edit'],
      reservations: ['view', 'create', 'edit'],
      fines: ['view'],
      notices: ['view'],
    },
    principal: {
      books: ['view'],
      fines: ['view'],
      reports: ['view'],
      notices: ['view'],
    },
    student: {},
  };
}

export function can(matrix: PermissionMatrix, role: Role | undefined | null, module: Module, action: Action = 'view'): boolean {
  if (!role) return false;
  return matrix[role]?.[module]?.includes(action) ?? false;
}

