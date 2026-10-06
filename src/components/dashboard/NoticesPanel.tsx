import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { selectLiveNotices, useNoticesStore } from '@/store/noticesStore';
import { ROUTES } from '@/routes/routePaths';
import { formatDate } from '@/utils/date';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

const CATEGORY_TONE = {
  Admissions: 'accent',
  Examinations: 'primary',
  Events: 'warning',
  Circulars: 'neutral',
  'Library Notices': 'success',
} as const;

/** The newest live notices — the same board students see in their portal. */
export function NoticesPanel({ canOpen }: { canOpen: boolean }) {
  const items = useNoticesStore((s) => s.notices);
  const notices = useMemo(() => selectLiveNotices(items).slice(0, 4), [items]);

  return (
    <DashboardCard title="Latest notices" description="Live on the student portal" action={canOpen ? { label: 'Manage', to: ROUTES.notices } : undefined}>
      {notices.length === 0 ? (
        <WidgetEmpty>No live notices.</WidgetEmpty>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {notices.map((n) => (
            <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <Badge tone={CATEGORY_TONE[n.category]} withDot={false}>
                  {n.category}
                </Badge>
                {n.isDefault && (
                  <Badge tone="accent" withDot={false}>
                    Default
                  </Badge>
                )}
                <span className="text-xs text-secondary-500">{formatDate(n.publishDate)}</span>
              </div>
              {canOpen ? (
                <Link to={ROUTES.notices} className="mt-1 block truncate text-sm font-medium text-ink hover:text-primary-600 hover:underline">
                  {n.title}
                </Link>
              ) : (
                <p className="mt-1 truncate text-sm font-medium text-ink">{n.title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
