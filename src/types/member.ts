export type MemberStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Member {
  id: string;
  memberId: string;
  name: string;
  rollNumber: string;
  department: string;
  academicYear: string;
  email: string;
  phone: string;
  status: MemberStatus;
  joinDate: string;
  avatarUrl?: string;
}
