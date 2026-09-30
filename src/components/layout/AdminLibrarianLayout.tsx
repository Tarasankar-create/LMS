import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useUiStore } from '@/store/uiStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useFinesStore } from '@/store/finesStore';
import { useBooksStore } from '@/store/booksStore';
import { getRecentActivities } from '@/utils/activity';
import { useStaffNav } from '@/hooks/useStaffNav';
import { ROUTES } from '@/routes/routePaths';

const PAGE_TITLES: [string, string][] = [
  [ROUTES.dashboard, 'Dashboard'],
  [ROUTES.circulationIssue, 'Issue a Book'],
  [ROUTES.circulationReturn, 'Return a Book'],
  [ROUTES.circulationActive, 'Active Loans'],
  [ROUTES.circulationReturned, 'Returned Books'],
  [ROUTES.circulationOverdue, 'Overdue Books'],
  [ROUTES.circulationTransactions, 'Recent Transactions'],
  [ROUTES.books, 'Books Catalogue'],
  [ROUTES.members, 'Members'],
  [ROUTES.reservations, 'Reservations'],
  [ROUTES.requests, 'Book Requests'],
  [ROUTES.fines, 'Fines'],
  [ROUTES.reports, 'Reports & Analytics'],
  [ROUTES.notices, 'Notices'],
  [ROUTES.settings, 'Library Settings'],
  [ROUTES.profile, 'My Profile'],
];

function resolveTitle(pathname: string): string {
  const match = PAGE_TITLES.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? 'Pathani Samanta College LMS';
}

export function AdminLibrarianLayout() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = useStaffNav();

  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const fines = useFinesStore((s) => s.fines);
  const books = useBooksStore((s) => s.books);
  const activities = useMemo(
    () => getRecentActivities({ loans, members, fines, books }, 6),
    [loans, members, fines, books],
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar navItems={navItems} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <MobileNav navItems={navItems} isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={resolveTitle(location.pathname)}
          onMenuClick={() => setMobileMenuOpen(true)}
          searchRoute={ROUTES.books}
          activities={activities}
        />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="no-print px-4 pb-4 text-center text-xs text-secondary-500 sm:px-6">
          Demo data only — not connected to a real backend. Built for Pathani Samanta College by Intulet Technologies.
        </footer>
      </div>
    </div>
  );
}
