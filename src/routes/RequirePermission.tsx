import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAccessStore } from '@/access/accessStore';
import { homePathFor } from '@/access/homePath';
import type { Action, Module } from '@/access/permissions';
import { useCan } from '@/access/useCan';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from './routePaths';

/**
 * Route guard: the page renders only if the user holds the permission. Otherwise they are sent to the first
 * page their role can open. (Client-side only — a real backend must enforce the same rule on every request.)
 */
export function RequirePermission({ module, action = 'view', children }: { module: Module; action?: Action; children: ReactNode }) {
  const can = useCan();
  const role = useAuthStore((s) => s.currentUser?.role);
  const matrix = useAccessStore((s) => s.matrix);
  const allowed = can(module, action);

  useEffect(() => {
    if (!allowed && role) toast.error("You don't have access to that page.");
  }, [allowed, role]);

  if (!allowed) {
    const home = homePathFor(role, matrix);
    // Never redirect to the page we are already denied on.
    return <Navigate to={home === window.location.pathname ? ROUTES.noAccess : home} replace />;
  }
  return <>{children}</>;
}
