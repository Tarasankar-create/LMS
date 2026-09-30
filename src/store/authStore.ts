import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAccessStore } from '@/access/accessStore';
import type { User } from '@/types';

export type LoginKind = 'student' | 'staff';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  lastUsername: string | null;
  login: (kind: LoginKind, username: string, password: string, rememberMe?: boolean) => { success: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      lastUsername: null,

      login: (kind, username, password, rememberMe) => {
        const users = useAccessStore.getState().users;
        const match = users.find(
          (user) =>
            user.username.toLowerCase() === username.trim().toLowerCase() &&
            (kind === 'student' ? user.role === 'student' : user.role !== 'student'),
        );

        if (!match) {
          return { success: false, error: `No ${kind} account found for "${username}".` };
        }
        if (match.password !== password) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
        if (match.status !== 'active') {
          return { success: false, error: 'This account is suspended. Please contact the administrator.' };
        }

        useAccessStore.getState().recordLogin(match.id);
        const fresh = useAccessStore.getState().users.find((u) => u.id === match.id) ?? match;
        set({ currentUser: fresh, isAuthenticated: true, lastUsername: rememberMe ? match.username : null });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },
    }),
    { name: 'psc-lms-auth' },
  ),
);

/** Keep the signed-in user in sync with the account store (a suspended or deleted user is signed out on the spot). */
function syncWithAccess(state: ReturnType<typeof useAccessStore.getState>) {
  const { currentUser, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !currentUser) return;
  const fresh = state.users.find((u) => u.id === currentUser.id);
  if (!fresh || fresh.status !== 'active') {
    useAuthStore.setState({ currentUser: null, isAuthenticated: false });
  } else if (fresh !== currentUser) {
    useAuthStore.setState({ currentUser: fresh });
  }
}

useAccessStore.subscribe(syncWithAccess);
syncWithAccess(useAccessStore.getState()); // also reconcile a session restored from storage
