import { Link } from 'react-router-dom';
import { AlertCircle, BookMarked, BookOpen, Clock3, Wallet, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/routes/routePaths';
import { cn } from '@/utils/cn';

interface StudentDashboardBannerProps {
  overdueCount: number;
  dueSoonCount: number;
  readyReservationsCount: number;
}

interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
}

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Student welcome panel with on-screen alert counts for due soon, overdue, and ready reservations. */
export function StudentDashboardBanner({
  overdueCount,
  dueSoonCount,
  readyReservationsCount,
}: StudentDashboardBannerProps) {
  const user = useAuthStore((s) => s.currentUser);
  const now = new Date();

  const actions: QuickAction[] = [
    { label: 'My Books', to: ROUTES.studentMyBooks, icon: BookMarked },
    { label: 'My Requests', to: ROUTES.studentRequests, icon: Clock3 },
    { label: 'Catalogue', to: ROUTES.studentCatalogue, icon: BookOpen },
    { label: 'My Fines', to: ROUTES.studentFines, icon: Wallet },
  ];

  const attention: string[] = [];
  if (overdueCount > 0) {
    attention.push(`${overdueCount} overdue ${overdueCount === 1 ? 'book' : 'books'}`);
  }
  if (dueSoonCount > 0) {
    attention.push(`${dueSoonCount} ${dueSoonCount === 1 ? 'book' : 'books'} due soon`);
  }
  if (readyReservationsCount > 0) {
    attention.push(
      `${readyReservationsCount} ${readyReservationsCount === 1 ? 'reservation' : 'reservations'} ready for pickup`,
    );
  }

  const totalAlerts = overdueCount + dueSoonCount + readyReservationsCount;

  return (
    <section
      aria-labelledby="student-dash-welcome"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-6 text-white shadow-md sm:p-7"
    >
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/5" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 right-24 size-56 rounded-full bg-gold-500/10" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-500" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90">
            {now.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
              Student Portal
            </span>
          </p>
          <h1 id="student-dash-welcome" className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {greeting(now.getHours())}, {user?.name.split(' ')[0] ?? 'Student'} 👋
          </h1>

          {totalAlerts > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-bold text-primary-950 shadow-xs">
                <AlertCircle className="size-3.5" />
                {totalAlerts} {totalAlerts === 1 ? 'Action Needed' : 'Actions Needed'}
              </span>
              <p className="text-sm text-white">
                Today needs your attention:{' '}
                <strong className="font-semibold text-white">{attention.join(' · ')}</strong>.
              </p>
            </div>
          ) : (
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Everything is on track — no overdue books, upcoming due dates, or reservations waiting for pickup.
            </p>
          )}
        </div>

        <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <Link
              key={a.to}
              to={a.to}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                i === 0 && totalAlerts > 0
                  ? 'bg-gold-500 text-primary-900 hover:bg-gold-300'
                  : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25',
              )}
            >
              <a.icon aria-hidden className="size-4" />
              {a.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

