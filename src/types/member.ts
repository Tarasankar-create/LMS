import type { Role } from '@/access/permissions';

export type MemberStatus = 'Active' | 'Inactive' | 'Suspended';

export interface BlockOverride {
  overriddenBy: string;
  overriddenByName: string;
  reason: string;
  overriddenAt: string;
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  role?: Role;
  rollNumber: string;
  department: string;
  academicYear?: string;
  email: string;
  phone: string;
  status: MemberStatus;
  isBlocked?: boolean;
  blockReason?: string;
  blockOverride?: BlockOverride;
  joinDate: string;
  avatarUrl?: string;
}
