import type { FinesBreakdown } from '@/utils/dashboardStats';
import { formatCurrency } from '@/utils/currency';
import { ROUTES } from '@/routes/routePaths';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

interface FinesOverviewProps {
  breakdown: FinesBreakdown;
  canOpen: boolean;
}

/** Where every fine ever raised ended up: still owed, collected, or waived. */
export function FinesOverview({ breakdown, canOpen }: FinesOverviewProps) {
  const rows = [
    { key: 'collected', label: 'Collected', bar: 'bg-success-500', dot: 'bg-success-500', ...breakdown.collected },
    { key: 'pending', label: 'Pending', bar: 'bg-warning-500', dot: 'bg-warning-500', ...breakdown.pending },
    { key: 'waived', label: 'Waived', bar: 'bg-secondary-400', dot: 'bg-secondary-400', ...breakdown.waived },
  ];
  const summary = rows.map((r) => `${r.label} ${formatCurrency(r.amount)}`).join(', ');

  return (
    <DashboardCard
      title="Fines overview"
      description={`${formatCurrency(breakdown.collectedThisMonth)} collected this month`}
      action={canOpen ? { label: 'Manage fines', to: ROUTES.fines } : undefined}
    >
      {breakdown.total === 0 ? (
        <WidgetEmpty>No fines have been raised.</WidgetEmpty>
      ) : (
        <>
          <p className="text-2xl font-semibold text-ink">
            {formatCurrency(breakdown.total)}
            <span className="ml-2 text-xs font-medium text-secondary-500">raised in total</span>
          </p>
          <div role="img" aria-label={`Fines split: ${summary}`} className="mt-3 flex h-3 overflow-hidden rounded-full bg-secondary-100">
            {rows.map((r) => (
              <span key={r.key} className={r.bar} style={{ width: `${(r.amount / breakdown.total) * 100}%` }} />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-secondary-700">
                  <span aria-hidden className={`size-2.5 rounded-full ${r.dot}`} />
                  {r.label}
                  <span className="text-xs text-secondary-500">({r.count})</span>
                </span>
                <span className="font-semibold text-ink">{formatCurrency(r.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashboardCard>
  );
}
