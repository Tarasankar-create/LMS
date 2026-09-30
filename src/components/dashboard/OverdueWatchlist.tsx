import type { OverdueWatchItem } from '@/utils/dashboardStats';
import { formatCurrency } from '@/utils/currency';
import { ROUTES } from '@/routes/routePaths';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

interface OverdueWatchlistProps {
  items: OverdueWatchItem[];
  totalOverdue: number;
  canOpen: boolean;
}

/** The loans that have been out longest — the ones a librarian should chase first. */
export function OverdueWatchlist({ items, totalOverdue, canOpen }: OverdueWatchlistProps) {
  return (
    <DashboardCard
      title="Overdue watchlist"
      description={`Longest overdue first · showing ${items.length} of ${totalOverdue}`}
      action={canOpen ? { label: 'View all overdue', to: ROUTES.circulationOverdue } : undefined}
    >
      {items.length === 0 ? (
        <WidgetEmpty>No overdue books right now.</WidgetEmpty>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {items.map((item) => (
            <li key={item.loanId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className="flex size-11 flex-none flex-col items-center justify-center rounded-lg bg-danger-50 text-danger-600"
                aria-label={`${item.days} days overdue`}
              >
                <span className="text-base font-bold leading-none">{item.days}</span>
                <span className="text-[10px] font-semibold uppercase leading-tight">days</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                <span className="block truncate text-xs text-secondary-500">
                  {item.memberName} · {item.memberId}
                </span>
              </span>
              <span className="flex-none text-right">
                <span className="block text-sm font-semibold text-ink">{formatCurrency(item.fine)}</span>
                <span className="block text-xs text-secondary-500">fine so far</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
