import { useMemo } from 'react';
import { useCan } from '@/access/useCan';
import { filterStaffNav, type NavItem } from '@/constants/navigation';
import { useRequestsStore } from '@/store/requestsStore';
import { ROUTES } from '@/routes/routePaths';

export function useStaffNav(): NavItem[] {
  const can = useCan();
  const pendingRequests = useRequestsStore((s) => s.countPending());
  return useMemo(() => filterStaffNav(can, { [ROUTES.requests]: pendingRequests }), [can, pendingRequests]);
}
