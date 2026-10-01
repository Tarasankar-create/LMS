import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member } from '@/types';

interface MembersState {
  members: Member[];
  setMembers: (members: Member[]) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  setStatus: (id: string, status: Member['status']) => void;
  setMemberBlock: (memberId: string, isBlocked: boolean, reason?: string) => void;
  overrideBlock: (memberId: string, override: import('@/types').BlockOverride) => void;
  clearBlockOverride: (memberId: string) => void;
  getByMemberId: (memberId: string) => Member | undefined;
  getById: (id: string) => Member | undefined;
}

export const useMembersStore = create<MembersState>()(
  persist(
    (set, get) => ({
      members: [],
      setMembers: (members) => set({ members }),
      addMember: (member) => set((state) => ({ members: [member, ...state.members] })),
      updateMember: (id, updates) =>
        set((state) => ({ members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),
      setStatus: (id, status) =>
        set((state) => ({ members: state.members.map((m) => (m.id === id ? { ...m, status } : m)) })),
      setMemberBlock: (memberId, isBlocked, reason) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.memberId === memberId ? { ...m, isBlocked, blockReason: reason } : m,
          ),
        })),
      overrideBlock: (memberId, override) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.memberId === memberId ? { ...m, blockOverride: override } : m,
          ),
        })),
      clearBlockOverride: (memberId) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.memberId === memberId ? { ...m, blockOverride: undefined } : m,
          ),
        })),
      getByMemberId: (memberId) => get().members.find((m) => m.memberId === memberId),
      getById: (id) => get().members.find((m) => m.id === id),
    }),
    { name: 'psc-lms-members' },
  ),
);
