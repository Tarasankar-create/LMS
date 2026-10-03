import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { RequirePermission } from './RequirePermission';
import { useAccessStore } from '@/access/accessStore';
import { homePathFor } from '@/access/homePath';
import { STAFF_ROLES, type Action, type Module } from '@/access/permissions';
import { NoAccessPage } from '@/pages/NoAccessPage';
import { ROUTES, lmsRelative } from './routePaths';
import { useAuthStore } from '@/store/authStore';

import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLibrarianLayout } from '@/components/layout/AdminLibrarianLayout';
import { StudentLayout } from '@/components/layout/StudentLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { BooksCataloguePage } from '@/pages/books/BooksCataloguePage';
import { BookDetailsPage } from '@/pages/books/BookDetailsPage';
import { IssueBookPage } from '@/pages/circulation/IssueBookPage';
import { ReturnBookPage } from '@/pages/circulation/ReturnBookPage';
import { ActiveLoansPage } from '@/pages/circulation/ActiveLoansPage';
import { ReturnedBooksPage } from '@/pages/circulation/ReturnedBooksPage';
import { OverdueBooksPage } from '@/pages/circulation/OverdueBooksPage';
import { RecentTransactionsPage } from '@/pages/circulation/RecentTransactionsPage';
import { MembersPage } from '@/pages/members/MembersPage';
import { MemberDetailsPage } from '@/pages/members/MemberDetailsPage';
import { ReservationsPage } from '@/pages/reservations/ReservationsPage';
import { RequestsPage } from '@/pages/requests/RequestsPage';
import { FinesPage } from '@/pages/fines/FinesPage';
import { FineDetailsPage } from '@/pages/fines/FineDetailsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { NoticesPage } from '@/pages/notices/NoticesPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { StudentDashboardPage } from '@/pages/student/StudentDashboardPage';
import { StudentCataloguePage } from '@/pages/student/StudentCataloguePage';
import { StudentMyBooksPage } from '@/pages/student/StudentMyBooksPage';
import { StudentRequestsPage } from '@/pages/student/StudentRequestsPage';
import { StudentFinesPage } from '@/pages/student/StudentFinesPage';
import { StudentNoticesPage } from '@/pages/student/StudentNoticesPage';
import { EBooksManagementPage } from '@/pages/ebooks/EBooksManagementPage';
import { StudentEBooksPage } from '@/pages/student/StudentEBooksPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function RoleHome() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const matrix = useAccessStore((s) => s.matrix);
  if (!currentUser) return <Navigate to={ROUTES.login} replace />;
  return <Navigate to={homePathFor(currentUser.role, matrix)} replace />;
}

/** Wraps a staff page in a permission check (module + action). */
function guard(module: Module, action: Action, element: ReactElement) {
  return <RequirePermission module={module} action={action}>{element}</RequirePermission>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<RoleHome />} />

      <Route element={<AuthLayout />}>
        <Route path={lmsRelative(ROUTES.login)} element={<LoginPage />} />
      </Route>

      <Route
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <AdminLibrarianLayout />
          </RequireAuth>
        }
      >
        <Route path={lmsRelative(ROUTES.dashboard)} element={guard('reports', 'view', <DashboardPage />)} />
        <Route path={lmsRelative(ROUTES.books)} element={guard('books', 'view', <BooksCataloguePage />)} />
        <Route path={`${lmsRelative(ROUTES.books)}/:id`} element={guard('books', 'view', <BookDetailsPage />)} />
        <Route path={lmsRelative(ROUTES.circulationIssue)} element={guard('circulation', 'create', <IssueBookPage />)} />
        <Route path={lmsRelative(ROUTES.circulationReturn)} element={guard('circulation', 'edit', <ReturnBookPage />)} />
        <Route path={lmsRelative(ROUTES.circulationActive)} element={guard('circulation', 'view', <ActiveLoansPage />)} />
        <Route path={lmsRelative(ROUTES.circulationReturned)} element={guard('circulation', 'view', <ReturnedBooksPage />)} />
        <Route path={lmsRelative(ROUTES.circulationOverdue)} element={guard('circulation', 'view', <OverdueBooksPage />)} />
        <Route path={lmsRelative(ROUTES.circulationTransactions)} element={guard('circulation', 'view', <RecentTransactionsPage />)} />
        <Route path={lmsRelative(ROUTES.members)} element={guard('members', 'view', <MembersPage />)} />
        <Route path={`${lmsRelative(ROUTES.members)}/:id`} element={guard('members', 'view', <MemberDetailsPage />)} />
        <Route path={lmsRelative(ROUTES.reservations)} element={guard('reservations', 'view', <ReservationsPage />)} />
        <Route path={lmsRelative(ROUTES.requests)} element={guard('circulation', 'view', <RequestsPage />)} />
        <Route path={lmsRelative(ROUTES.fines)} element={guard('fines', 'view', <FinesPage />)} />
        <Route path={`${lmsRelative(ROUTES.fines)}/:id`} element={guard('fines', 'view', <FineDetailsPage />)} />
        <Route path={lmsRelative(ROUTES.reports)} element={guard('reports', 'view', <ReportsPage />)} />
        <Route path={lmsRelative(ROUTES.ebooks)} element={guard('books', 'view', <EBooksManagementPage />)} />
        <Route path={lmsRelative(ROUTES.notices)} element={guard('notices', 'view', <NoticesPage />)} />
        <Route path={lmsRelative(ROUTES.profile)} element={<ProfilePage />} />
        <Route path={lmsRelative(ROUTES.noAccess)} element={<NoAccessPage />} />
        <Route
          path={lmsRelative(ROUTES.settings)}
          element={guard('librarySettings', 'view', <SettingsPage />)}
        />
        <Route
          path={lmsRelative(ROUTES.adminUsers)}
          element={guard('librarySettings', 'view', <AdminUsersPage />)}
        />
      </Route>

      <Route
        element={
          <RequireAuth roles={['student']}>
            <StudentLayout />
          </RequireAuth>
        }
      >
        <Route path={lmsRelative(ROUTES.studentDashboard)} element={<StudentDashboardPage />} />
        <Route path={lmsRelative(ROUTES.studentCatalogue)} element={<StudentCataloguePage />} />
        <Route path={lmsRelative(ROUTES.studentEBooks)} element={<StudentEBooksPage />} />
        <Route path={lmsRelative(ROUTES.studentMyBooks)} element={<StudentMyBooksPage />} />
        <Route path={lmsRelative(ROUTES.studentRequests)} element={<StudentRequestsPage />} />
        <Route path={lmsRelative(ROUTES.studentFines)} element={<StudentFinesPage />} />
        <Route path={lmsRelative(ROUTES.studentNotices)} element={<StudentNoticesPage />} />
        <Route path={lmsRelative(ROUTES.studentProfile)} element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
