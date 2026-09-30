import type { ActivityItem } from '@/utils/activity';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

/** Chip colour by event type (the activity id starts with the event kind). */
function chipTone(id: string): string {
  if (id.startsWith('issue_')) return 'bg-primary-50 text-primary-600';
  if (id.startsWith('return_')) return 'bg-success-50 text-success-600';
  if (id.startsWith('member_')) return 'bg-accent-50 text-accent-600';
  if (id.startsWith('fine_')) return 'bg-warning-50 text-warning-600';
  return 'bg-secondary-100 text-secondary-600';
}

export function ActivityFeed({ activities, className }: { activities: ActivityItem[]; className?: string }) {
  return (
    <DashboardCard title="Recent library activity" description="Latest issues, returns, members and payments" className={className}>
      {activities.length === 0 ? (
        <WidgetEmpty>No recent activity yet.</WidgetEmpty>
      ) : (
        <ol className="relative space-y-3.5 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-secondary-100">
          {activities.map((a) => (
            <li key={a.id} className="relative flex items-start gap-3">
              <span className={cn('relative z-10 flex size-8 flex-none items-center justify-center rounded-full ring-4 ring-white', chipTone(a.id))}>
                <a.icon aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block truncate text-sm text-secondary-700">{a.message}</span>
                <span className="block text-xs text-secondary-500">{formatDate(a.date)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
