import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDefaultMatrix, type PermissionMatrix } from './permissions';
import { SEED_USERS } from '@/data/users';
import { useMembersStore } from '@/store/membersStore';
import type { User, Role, UserStatus, Member } from '@/types';
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
  addUsers: (users: User[]) => void;
  updateUser: (id: string, updates: UpdateUserInput) => Result;
  deleteUser: (id: string, currentUserId?: string) => Result;
  toggleUserStatus: (id: string, currentUserId?: string) => Result;
  resetUserPassword: (id: string, newPassword: string) => Result;
  resetPasswordWithOldPassword: (userId: string, oldPassword: string, newPassword: string) => Result;
  findUserByUsernameOrRoll: (identifier: string) => User | undefined;
  verifyUserPassword: (identifier: string, oldPassword: string) => { ok: boolean; user?: User; error?: string };
  ensureStudentUserForMember: (member: Member) => User;
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

        if (input.role === 'admin') {
          return { ok: false, error: 'Cannot add additional Administrator accounts. Only one Admin is permitted.' };
        }

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

      addUsers: (newUsers) => set((s) => ({ users: [...newUsers, ...s.users] })),

      updateUser: (id, updates) => {
        const user = get().users.find((u) => u.id === id);
        if (!user) return { ok: false, error: 'User record not found.' };

        if (updates.role === 'admin' && user.role !== 'admin') {
          return { ok: false, error: 'Cannot promote account to Administrator. Only one Admin is permitted.' };
        }
        if (user.role === 'admin' && updates.role && updates.role !== 'admin') {
          return { ok: false, error: 'Cannot change the role of the primary Administrator.' };
        }

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

      resetPasswordWithOldPassword: (userId, oldPassword, newPassword) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) return { ok: false, error: 'Account not found.' };
        if (user.password !== oldPassword) {
          return { ok: false, error: 'The old password you entered is incorrect.' };
        }
        if (!newPassword || newPassword.length < 6) {
          return { ok: false, error: 'New password must be at least 6 characters.' };
        }
        if (newPassword === oldPassword) {
          return { ok: false, error: 'New password must be different from the old password.' };
        }

        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
        }));
        return { ok: true };
      },

      ensureStudentUserForMember: (member) => {
        const existing = get().users.find(
          (u) =>
            u.username.toLowerCase() === member.rollNumber.toLowerCase() ||
            (u.memberId && u.memberId.toLowerCase() === member.memberId.toLowerCase()),
        );
        if (existing) return existing;

        const newStudentUser: User = {
          id: generateId('user_student'),
          username: member.rollNumber,
          password: 'student123',
          name: member.name,
          role: 'student',
          status: member.status === 'Suspended' ? 'suspended' : 'active',
          email: member.email,
          phone: member.phone,
          memberId: member.memberId,
          createdAt: nowISO(),
        };

        set((s) => ({ users: [newStudentUser, ...s.users] }));
        return newStudentUser;
      },

      findUserByUsernameOrRoll: (identifier) => {
        const trimmed = identifier.trim().toLowerCase();
        if (!trimmed) return undefined;

        // 1. Check direct user accounts
        const user = get().users.find(
          (u) =>
            u.username.toLowerCase() === trimmed ||
            (u.memberId && u.memberId.toLowerCase() === trimmed),
        );
        if (user) return user;

        // 2. Check student members in membersStore
        const member = useMembersStore.getState().members.find(
          (m) =>
            m.rollNumber.toLowerCase() === trimmed ||
            m.memberId.toLowerCase() === trimmed,
        );
        if (member) {
          return get().ensureStudentUserForMember(member);
        }

        return undefined;
      },

      verifyUserPassword: (identifier, oldPassword) => {
        const user = get().findUserByUsernameOrRoll(identifier);
        if (!user) {
          return { ok: false, error: `No account found for "${identifier.trim()}".` };
        }
        if (user.password !== oldPassword) {
          return { ok: false, error: 'Incorrect old password. Please verify and try again.' };
        }
        if (user.status !== 'active') {
          return { ok: false, error: 'This account is currently suspended. Please contact the administrator.' };
        }
        return { ok: true, user };
      },
    }),
    {
      name: 'psc-lms-access',
      // The permission matrix is fixed in code; only accounts are persisted.
      partialize: (s) => ({ users: s.users }),
    },
  ),
);

