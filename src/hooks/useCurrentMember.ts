import { useAuthStore } from '@/store/authStore';
import { useMembersStore } from '@/store/membersStore';

export function useCurrentMember() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const member = useMembersStore((s) => (currentUser?.memberId ? s.getByMemberId(currentUser.memberId) : undefined));
  return member;
}
