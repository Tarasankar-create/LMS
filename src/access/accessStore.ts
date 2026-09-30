import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDefaultMatrix, type PermissionMatrix } from './permissions';
import { SEED_USERS } from '@/data/users';
import type { User } from '@/types';
import { nowISO } from '@/utils/date';

export type Result = { ok: true } | { ok: false; error: string };

interface AccessState {
  users: User[];
  matrix: PermissionMatrix;
  /** Signed-in users change their own password from the profile page. */
  changeOwnPassword: (userId: string, currentPassword: string, newPassword: string) => Result;
  recordLogin: (id: string) => void;
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set, get) => ({
      users: SEED_USERS,
      matrix: buildDefaultMatrix(),

      changeOwnPassword: (userId, currentPassword, newPassword) => {
        const me = get().users.find((u) => u.id === userId);
        if (!me) return { ok: false, error: 'Account not found.' };
        if (me.password !== currentPassword) return { ok: false, error: 'Your current password is incorrect.' };
        if (newPassword.length < 6) return { ok: false, error: 'The new password must be at least 6 characters.' };
        if (newPassword === currentPassword) return { ok: false, error: 'Choose a password different from the current one.' };
        set((s) => ({ users: s.users.map((u) => (u.id === me.id ? { ...u, password: newPassword } : u)) }));
        return { ok: true };
      },

      recordLogin: (id) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, lastLoginAt: nowISO() } : u)) })),
    }),
    {
      name: 'psc-lms-access',
      // The permission matrix is fixed in code; only accounts are persisted.
      partialize: (s) => ({ users: s.users }),
    },
  ),
);
