import type { Role } from '@/access/permissions';

export type { Role };
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  /** Demo-only plain-text password. Never do this against a real backend. */
  password: string;
  name: string;
  role: Role;
  status: UserStatus;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  /** Links a student User to their Member record. */
  memberId?: string;
  createdAt: string;
  lastLoginAt?: string;
}
