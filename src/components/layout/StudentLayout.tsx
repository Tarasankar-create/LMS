import { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useUiStore } from '@/store/uiStore';
import { useLoansStore } from '@/store/loansStore';
import { useFinesStore } from '@/store/finesStore';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { getRecentActivities } from '@/utils/activity';
import { STUDENT_NAV_ITEMS } from '@/constants/navigation';
import { ROUTES } from '@/routes/routePaths';

const PAGE_TITLES: [string, string][] = [
  [ROUTES.studentDashboard, 'Dashboard'],
  [ROUTES.studentCatalogue, 'Library Catalogue'],
  [ROUTES.studentMyBooks, 'My Books'],
  [ROUTES.studentRequests, 'My Requests'],
  [ROUTES.studentFines, 'My Fines'],
  [ROUTES.studentNotices, 'Notices'],
  [ROUTES.studentProfile, 'My Profile'],
];

function resolveTitle(pathname: string): string {
  return PAGE_TITLES.find(([path]) => pathname === path)?.[1] ?? 'Student Portal';
}

export function StudentLayout() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = STUDENT_NAV_ITEMS;

  // Scoped to the logged-in student's own records only — students must not see
  // other members' loan/fine activity (per the BRD's role-based access requirement).
  const member = useCurrentMember();
  const loans = useLoansStore((s) => s.loans);
  const fines = useFinesStore((s) => s.fines);
  const activities = useMemo(() => {
    if (!member) return [];
    const myLoans = loans.filter((l) => l.memberId === member.memberId);
    const myFines = fines.filter((f) => f.memberId === member.memberId);
    return getRecentActivities({ loans: myLoans, members: [], fines: myFines, books: [] }, 6);
  }, [loans, fines, member]);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        navItems={navItems}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        subtitle="Student Library Portal"
      />
      <MobileNav
        navItems={navItems}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        subtitle="Student Library Portal"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          title={resolveTitle(location.pathname)}
          onMenuClick={() => setMobileMenuOpen(true)}
          searchRoute={ROUTES.studentCatalogue}
          searchPlaceholder="Search the catalogue..."
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
