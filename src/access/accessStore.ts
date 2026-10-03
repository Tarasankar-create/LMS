import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDefaultMatrix, type PermissionMatrix } from './permissions';
import { SEED_USERS } from '@/data/users';
import type { User, Role, UserStatus } from '@/types';
import { nowISO } from '@/utils/date';
import { generateId } from '@/utils/id';

export type Result = { ok: true } | { ok: false; error: string };
export type AddUserResult = { ok: true; user: User } | { ok: false; error: string };

export interface AddUserInput {
  username: string;
  password: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  status?: UserStatus;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  email?: string;
  phone?: string;
  status?: UserStatus;
}

interface AccessState {
  users: User[];
  matrix: PermissionMatrix;
  /** Signed-in users change their own password from the profile page. */
  changeOwnPassword: (userId: string, currentPassword: string, newPassword: string) => Result;
  recordLogin: (id: string) => void;
  addUser: (input: AddUserInput) => AddUserResult;
  updateUser: (id: string, updates: UpdateUserInput) => Result;
  deleteUser: (id: string, currentUserId?: string) => Result;
  toggleUserStatus: (id: string, currentUserId?: string) => Result;
  resetUserPassword: (id: string, newPassword: string) => Result;
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

      addUser: (input) => {
        const trimmedUsername = input.username.trim();
        const trimmedName = input.name.trim();

        if (!trimmedName) return { ok: false, error: 'Full name is required.' };
        if (!trimmedUsername) return { ok: false, error: 'Username is required.' };
        if (trimmedUsername.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
        if (!input.password || input.password.length < 6) {
          return { ok: false, error: 'Initial password must be at least 6 characters.' };
        }

        const existing = get().users.find(
          (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase(),
        );
        if (existing) {
          return { ok: false, error: `Username "${trimmedUsername}" is already in use by another account.` };
        }

        const newUser: User = {
          id: generateId(`user_${input.role}`),
          username: trimmedUsername,
          password: input.password,
          name: trimmedName,
          role: input.role,
          status: input.status ?? 'active',
          email: input.email?.trim() || undefined,
          phone: input.phone?.trim() || undefined,
          createdAt: nowISO(),
        };

        set((s) => ({ users: [newUser, ...s.users] }));
        return { ok: true, user: newUser };
      },

      updateUser: (id, updates) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return { ok: false, error: 'User record not found.' };

        set((s) => ({
          users: s.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
                  ...(updates.role !== undefined ? { role: updates.role } : {}),
                  ...(updates.email !== undefined ? { email: updates.email.trim() || undefined } : {}),
                  ...(updates.phone !== undefined ? { phone: updates.phone.trim() || undefined } : {}),
                  ...(updates.status !== undefined ? { status: updates.status } : {}),
                }
              : u,
          ),
        }));
        return { ok: true };
      },

      deleteUser: (id, currentUserId) => {
        if (currentUserId && id === currentUserId) {
          return { ok: false, error: 'You cannot delete your own account while logged in.' };
        }
        const user = get().users.find((u) => u.id === id);
        if (!user) return { ok: false, error: 'User record not found.' };

        if (user.role === 'admin') {
          const activeAdmins = get().users.filter((u) => u.role === 'admin' && u.status === 'active').length;
          if (activeAdmins <= 1) {
            return { ok: false, error: 'Cannot delete the only active Administrator in the system.' };
          }
        }

        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
        return { ok: true };
      },

      toggleUserStatus: (id, currentUserId) => {
        if (currentUserId && id === currentUserId) {
          return { ok: false, error: 'You cannot suspend your own account.' };
        }
        const user = get().users.find((u) => u.id === id);
        if (!user) return { ok: false, error: 'User record not found.' };

        const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
        if (user.role === 'admin' && nextStatus === 'suspended') {
          const activeAdmins = get().users.filter((u) => u.role === 'admin' && u.status === 'active').length;
          if (activeAdmins <= 1) {
            return { ok: false, error: 'Cannot suspend the only active Administrator in the system.' };
          }
        }

        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)),
        }));
        return { ok: true };
      },

      resetUserPassword: (id, newPassword) => {
        if (newPassword.length < 6) {
          return { ok: false, error: 'New password must be at least 6 characters.' };
        }
        const user = get().users.find((u) => u.id === id);
        if (!user) return { ok: false, error: 'User record not found.' };

        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, password: newPassword } : u)),
        }));
        return { ok: true };
      },
    }),
    {
      name: 'psc-lms-access',
      // The permission matrix is fixed in code; only accounts are persisted.
      partialize: (s) => ({ users: s.users }),
    },
  ),
);

