import { useMemo } from 'react';
import { BookCopy, BookOpenCheck, BookMarked, CalendarClock, Clock3, HandCoins, Library, PackageCheck, Users, Wallet } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { MonthlyCirculationChart } from '@/components/charts/MonthlyCirculationChart';
import { CategoryDistributionChart } from '@/components/charts/CategoryDistributionChart';
import { OverdueSummaryChart } from '@/components/charts/OverdueSummaryChart';
import { DashboardBanner } from '@/components/dashboard/DashboardBanner';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { MiniStat } from '@/components/dashboard/MiniStat';
import { OverdueWatchlist } from '@/components/dashboard/OverdueWatchlist';
import { PopularBooks } from '@/components/dashboard/PopularBooks';
import { ReservationQueue } from '@/components/dashboard/ReservationQueue';
import { FinesOverview } from '@/components/dashboard/FinesOverview';
import { NoticesPanel } from '@/components/dashboard/NoticesPanel';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useCan } from '@/access/useCan';
import { useBooksStore } from '@/store/booksStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useFinesStore } from '@/store/finesStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { DASHBOARD_TOTALS } from '@/data/seedConfig';
import { buildCategoryDistribution, buildMonthlyCirculation } from '@/utils/circulationStats';
import { buildOverdueSummary } from '@/utils/overdueStats';
import { buildFinesBreakdown, buildOverdueWatchlist, buildTopBorrowed, countDueToday, countReservationsByStatus, countReturnedToday } from '@/utils/dashboardStats';
import { getRecentActivities } from '@/utils/activity';
import { formatCurrency } from '@/utils/currency';
import { overdueDays, todayISO } from '@/utils/date';
import { ROUTES } from '@/routes/routePaths';

const POPULAR_WINDOW_DAYS = 30;

export function DashboardPage() {
  const books = useBooksStore((s) => s.books);
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const fines = useFinesStore((s) => s.fines);
  const reservations = useReservationsStore((s) => s.reservations);
  const settings = useSettingsStore((s) => s.settings);
  const can = useCan();

  const overdueLoans = useMemo(() => loans.filter((l) => l.status === 'Active' && overdueDays(l.dueDate) > 0), [loans]);
  const issuedToday = useMemo(() => loans.filter((l) => l.issueDate === todayISO()), [loans]);
  const dueToday = useMemo(() => countDueToday(loans), [loans]);
  const returnedToday = useMemo(() => countReturnedToday(loans), [loans]);
  const finesBreakdown = useMemo(() => buildFinesBreakdown(fines), [fines]);
  const reservationCounts = useMemo(() => countReservationsByStatus(reservations), [reservations]);

  const monthlyCirculation = useMemo(() => buildMonthlyCirculation(loans), [loans]);
  const categoryDistribution = useMemo(() => buildCategoryDistribution(books), [books]);
  const overdueSummary = useMemo(() => buildOverdueSummary(loans), [loans]);
  const watchlist = useMemo(() => buildOverdueWatchlist(loans, members, settings), [loans, members, settings]);
  const popular = useMemo(() => buildTopBorrowed(loans, POPULAR_WINDOW_DAYS), [loans]);
  const activities = useMemo(() => getRecentActivities({ loans, members, fines, books }, 8), [loans, members, fines, books]);

  const veryOverdue = overdueSummary.find((b) => b.bucket === '30+ days')?.count ?? 0;
  // Links only where the signed-in user may open the target page.
  const to = (allowed: boolean, path: string) => (allowed ? path : undefined);
  const canCirculation = can('circulation', 'view');

  return (
    <div className="space-y-6">
      <DashboardBanner overdueCount={overdueLoans.length} readyReservations={reservationCounts.ready} />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard variant="solid" accent="primary" icon={Library} title="Total Book Titles" value={DASHBOARD_TOTALS.totalBookTitles.toLocaleString('en-IN')} note="Across all subjects" href={to(can('books'), ROUTES.books)} />
        <StatCard variant="solid" accent="slate" icon={BookCopy} title="Total Book Copies" value={DASHBOARD_TOTALS.totalBookCopies.toLocaleString('en-IN')} note="Physical copies held" href={to(can('books'), ROUTES.books)} />
        <StatCard variant="solid" accent="accent" icon={BookOpenCheck} title="Books Issued Today" value={issuedToday.length} note={`${returnedToday} returned today`} href={to(canCirculation, ROUTES.circulationActive)} />
        <StatCard
          variant="solid"
          accent="danger"
          icon={Clock3}
          title="Overdue Books"
          value={overdueLoans.length}
          note={veryOverdue > 0 ? `${veryOverdue} overdue by more than 30 days` : 'Loans past their due date'}
          href={to(canCirculation, ROUTES.circulationOverdue)}
        />
        <StatCard variant="solid" accent="success" icon={Users} title="Active Members" value={DASHBOARD_TOTALS.activeMembers.toLocaleString('en-IN')} note="Registered borrowers" href={to(can('members'), ROUTES.members)} />
        <StatCard
          variant="solid"
          accent="warning"
          icon={Wallet}
          title="Pending Fines"
          value={formatCurrency(finesBreakdown.pending.amount)}
          note={`${finesBreakdown.pending.count} unpaid ${finesBreakdown.pending.count === 1 ? 'fine' : 'fines'}`}
          href={to(can('fines'), ROUTES.fines)}
        />
      </section>

      <section aria-label="Today at a glance" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Due today" value={dueToday} detail="Loans coming back today" icon={CalendarClock} tone="primary" href={to(canCirculation, ROUTES.circulationActive)} />
        <MiniStat label="Returned today" value={returnedToday} detail="Books checked in" icon={PackageCheck} tone="success" href={to(canCirculation, ROUTES.circulationReturned)} />
        <MiniStat
          label="Reservations"
          value={reservationCounts.ready + reservationCounts.waiting}
          detail={`${reservationCounts.ready} ready · ${reservationCounts.waiting} waiting`}
          icon={BookMarked}
          tone="accent"
          href={to(can('reservations'), ROUTES.reservations)}
        />
        <MiniStat label="Fines collected" value={formatCurrency(finesBreakdown.collectedThisMonth)} detail="This month" icon={HandCoins} tone="warning" href={to(can('fines'), ROUTES.fines)} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardCard className="xl:col-span-2" title="Monthly circulation" description="Books issued, returned and renewed over the last 6 months">
          <MonthlyCirculationChart data={monthlyCirculation} />
        </DashboardCard>
        <DashboardCard title="Book category distribution" description="Active titles by category">
          <CategoryDistributionChart data={categoryDistribution} />
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardCard title="Overdue books summary" description="Currently overdue loans, grouped by days overdue">
          <OverdueSummaryChart data={overdueSummary} />
        </DashboardCard>
        <div className="xl:col-span-2">
          <OverdueWatchlist items={watchlist} totalOverdue={overdueLoans.length} canOpen={canCirculation} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <PopularBooks books={popular} days={POPULAR_WINDOW_DAYS} canOpen={can('books')} />
        <ReservationQueue reservations={reservations} members={members} canOpen={can('reservations')} />
        <FinesOverview breakdown={finesBreakdown} canOpen={can('fines')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <NoticesPanel canOpen={can('notices')} />
        <ActivityFeed activities={activities} className="xl:col-span-2" />
      </div>
    </div>
  );
}
