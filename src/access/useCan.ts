import { useCallback } from 'react';
import { useAccessStore } from './accessStore';
import { can, type Action, type Module } from './permissions';
import { useAuthStore } from '@/store/authStore';

export type CanFn = (module: Module, action?: Action) => boolean;

/** Reactive permission check for the signed-in user (re-renders when the admin edits the matrix or the user's role). */
export function useCan(): CanFn {
  const matrix = useAccessStore((s) => s.matrix);
  const role = useAuthStore((s) => s.currentUser?.role);
  return useCallback((module, action = 'view') => can(matrix, role, module, action), [matrix, role]);
}
