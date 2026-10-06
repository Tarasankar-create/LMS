import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/utils/id';
import type { Role } from '@/types';

export interface PasswordResetToken {
  token: string;
  userId: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

interface PasswordResetState {
  tokens: PasswordResetToken[];
  createToken: (user: { id: string; username: string; name: string; role: Role }) => PasswordResetToken;
  getToken: (tokenString: string) => PasswordResetToken | undefined;
  markTokenAsUsed: (tokenString: string) => void;
  cleanExpiredTokens: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>()(
  persist(
    (set, get) => ({
      tokens: [],

      createToken: (user) => {
        const now = new Date();
        // Link expires after 1 hour (3600 seconds)
        const expires = new Date(now.getTime() + 60 * 60 * 1000);

        // Generate a random secure url-safe token string
        const tokenString = `${generateId('rst')}_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

        const newToken: PasswordResetToken = {
          token: tokenString,
          userId: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          used: false,
        };

        set((s) => ({
          tokens: [
            newToken,
            ...s.tokens.filter((t) => !t.used && new Date(t.expiresAt) > now),
          ],
        }));

        return newToken;
      },

      getToken: (tokenString) => {
        const trimmed = tokenString?.trim();
        if (!trimmed) return undefined;
        const found = get().tokens.find((t) => t.token === trimmed);
        if (!found) return undefined;
        if (found.used) return undefined;
        if (new Date(found.expiresAt) < new Date()) return undefined;
        return found;
      },

      markTokenAsUsed: (tokenString) => {
        set((s) => ({
          tokens: s.tokens.map((t) => (t.token === tokenString ? { ...t, used: true } : t)),
        }));
      },

      cleanExpiredTokens: () => {
        const now = new Date();
        set((s) => ({
          tokens: s.tokens.filter((t) => !t.used && new Date(t.expiresAt) > now),
        }));
      },
    }),
    {
      name: 'psc-lms-password-resets',
    },
  ),
);
