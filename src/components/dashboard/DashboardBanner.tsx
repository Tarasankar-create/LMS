import { Link } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, BookOpenCheck, Clock3, Users, type LucideIcon } from 'lucide-react';
import { useCan } from '@/access/useCan';
import { ROLE_META } from '@/access/permissions';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/routes/routePaths';
import { cn } from '@/utils/cn';

interface DashboardBannerProps {
  overdueCount: number;
  readyReservations: number;
}

interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
  allowed: boolean;
}

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Welcome panel: who is signed in, what needs attention today, and shortcuts to the actions they may perform. */
export function DashboardBanner({ overdueCount, readyReservations }: DashboardBannerProps) {
  const user = useAuthStore((s) => s.currentUser);
  const can = useCan();
  const now = new Date();

  const actions: QuickAction[] = [
    { label: 'Issue a Book', to: ROUTES.circulationIssue, icon: BookOpenCheck, allowed: can('circulation', 'create') },
    { label: 'Return a Book', to: ROUTES.circulationReturn, icon: ArrowLeftRight, allowed: can('circulation', 'edit') },
    { label: 'Manage Members', to: ROUTES.members, icon: Users, allowed: can('members', 'create') },
    { label: 'Overdue Books', to: ROUTES.circulationOverdue, icon: Clock3, allowed: can('circulation', 'view') },
    { label: 'Reports', to: ROUTES.reports, icon: BarChart3, allowed: can('reports', 'view') },
  ].filter((a) => a.allowed);

  const attention: string[] = [];
  if (overdueCount > 0) attention.push(`${overdueCount} overdue ${overdueCount === 1 ? 'loan' : 'loans'}`);
  if (readyReservations > 0) attention.push(`${readyReservations} ${readyReservations === 1 ? 'reservation' : 'reservations'} ready for pickup`);

  return (
    <section aria-labelledby="dash-welcome" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 p-6 text-white shadow-md sm:p-7">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/5" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 right-24 size-56 rounded-full bg-gold-500/10" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gold-500" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {user && <span className="ml-2 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">{ROLE_META[user.role].label}</span>}
          </p>
          <h1 id="dash-welcome" className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {greeting(now.getHours())}, {user?.name ?? 'there'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white">
            {attention.length > 0 ? (
              <>
                Today needs your attention: <strong className="font-semibold">{attention.join(' and ')}</strong>.
              </>
            ) : (
              "Everything is on track — no overdue loans or reservations waiting."
            )}
          </p>
        </div>

        {actions.length > 0 && (
          <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <Link
                key={a.to}
                to={a.to}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                  i === 0 ? 'bg-gold-500 text-primary-900 hover:bg-gold-300' : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25',
                )}
              >
                <a.icon aria-hidden className="size-4" />
                {a.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
