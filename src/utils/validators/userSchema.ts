import { z } from 'zod';

export const USER_ASSIGNABLE_ROLES = ['admin', 'librarian', 'staff', 'principal'] as const;
export type UserAssignableRole = (typeof USER_ASSIGNABLE_ROLES)[number];

export interface RoleOption {
  value: UserAssignableRole;
  label: string;
  badgeTone: 'primary' | 'accent' | 'warning' | 'success' | 'neutral';
  description: string;
}

export const ASSIGNABLE_ROLES: RoleOption[] = [
  {
    value: 'staff',
    label: 'Staff (College Staff)',
    badgeTone: 'primary',
    description: 'College teaching and non-teaching staff: Circulation desk operations (issue, return, renew books, handle reservations & inspect catalogue).',
  },
  {
    value: 'librarian',
    label: 'Librarian',
    badgeTone: 'accent',
    description: 'Full library administration: Circulation, catalogue management, student members, fines, and reports.',
  },
  {
    value: 'principal',
    label: 'Principal',
    badgeTone: 'warning',
    description: 'Executive institutional oversight: Read-only access to all reports, catalogue, and fine collections.',
  },
  {
    value: 'admin',
    label: 'Admin',
    badgeTone: 'success',
    description: 'Full master access: Library business rules, system configuration, and user credential management.',
  },
];

export const userSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(USER_ASSIGNABLE_ROLES),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().trim().email('Invalid email address format').optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .regex(/^(\+91[\s-]?)?[6789]\d{9}$/, 'Enter a valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'suspended']),
});

export type UserFormValues = z.infer<typeof userSchema>;
