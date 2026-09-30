import type { ReactNode } from 'react';
import { useCan } from './useCan';
import type { Action, Module } from './permissions';

/** Renders children only when the signed-in user holds the permission (UI convenience — not a security boundary). */
export function Can({ module, action = 'view', children, fallback = null }: { module: Module; action?: Action; children: ReactNode; fallback?: ReactNode }) {
  const can = useCan();
  return <>{can(module, action) ? children : fallback}</>;
}
