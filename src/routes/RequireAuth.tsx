import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAccessStore } from '@/access/accessStore';
import { homePathFor } from '@/access/homePath';
import type { Role } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from './routePaths';

interface RequireAuthProps {
  /** Roles allowed into this area (the area-level split between staff and students). */
  roles: Role[];
  children: ReactNode;
}

export function RequireAuth({ roles, children }: RequireAuthProps) {
  const { isAuthenticated, currentUser } = useAuthStore();
  const matrix = useAccessStore((s) => s.matrix);
  const location = useLocation();
  const isRoleRestricted = isAuthenticated && !!currentUser && !roles.includes(currentUser.role);

  useEffect(() => {
    if (isRoleRestricted) toast.error('Access restricted for your role.');
  }, [isRoleRestricted]);

  if (!isAuthenticated || !currentUser) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (isRoleRestricted) {
    return <Navigate to={homePathFor(currentUser.role, matrix)} replace />;
  }

  return <>{children}</>;
}
