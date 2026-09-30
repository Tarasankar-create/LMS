import { Badge } from '@/components/common/Badge';
import { ROUTES } from '@/routes/routePaths';
import type { Member, Reservation } from '@/types';
import { formatDate } from '@/utils/date';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

interface ReservationQueueProps {
  reservations: Reservation[];
  members: Member[];
  canOpen: boolean;
}

/** Ready-for-pickup reservations first (someone is waiting at the desk), then the oldest waiting ones. */
export function ReservationQueue({ reservations, members, canOpen }: ReservationQueueProps) {
  const names = new Map(members.map((m) => [m.memberId, m.name]));
  const active = reservations.filter((r) => r.status === 'Ready' || r.status === 'Waiting');
  const next = [...active]
    .sort((a, b) => (a.status === b.status ? a.reservedDate.localeCompare(b.reservedDate) : a.status === 'Ready' ? -1 : 1))
    .slice(0, 4);
  const ready = active.filter((r) => r.status === 'Ready').length;

  return (
    <DashboardCard
      title="Reservation queue"
      description={`${ready} ready for pickup · ${active.length - ready} waiting`}
      action={canOpen ? { label: 'View all', to: ROUTES.reservations } : undefined}
    >
      {next.length === 0 ? (
        <WidgetEmpty>No active reservations.</WidgetEmpty>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {next.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{r.bookTitle}</span>
                <span className="block truncate text-xs text-secondary-500">
                  {names.get(r.memberId) ?? r.memberId} · reserved {formatDate(r.reservedDate)}
                </span>
              </span>
              <Badge tone={r.status === 'Ready' ? 'success' : 'warning'} className="flex-none">
                {r.status === 'Ready' ? 'Ready' : `#${r.queuePosition}`}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
