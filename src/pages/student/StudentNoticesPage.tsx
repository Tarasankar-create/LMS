import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { selectLiveNotices, useNoticesStore } from '@/store/noticesStore';
import { formatDate } from '@/utils/date';
import { NOTICE_CATEGORIES, type NoticeCategory } from '@/types';
import { cn } from '@/utils/cn';

export function StudentNoticesPage() {
  const allNotices = useNoticesStore((s) => s.notices);
  const portalNotices = useMemo(() => selectLiveNotices(allNotices), [allNotices]);
  const [categoryFilter, setCategoryFilter] = useState<'All' | NoticeCategory>('All');

  const visibleNotices = useMemo(
    () => portalNotices.filter((n) => categoryFilter === 'All' || n.category === categoryFilter),
    [portalNotices, categoryFilter],
  );

  return (
    <div>
      <PageHeader title="Notices" description="Announcements from the library and college office." />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('All')}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium',
            categoryFilter === 'All' ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-100',
          )}
        >
          All
        </button>
        {NOTICE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium',
              categoryFilter === cat ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-100',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {visibleNotices.length === 0 ? (
        <EmptyState title="No notices found" description="Check back later for announcements." />
      ) : (
        <div className="space-y-3">
          {visibleNotices.map((notice) => (
            <div key={notice.id} className="rounded-xl border border-secondary-100 bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h3 className="font-medium text-ink">{notice.title}</h3>
                <Badge tone="neutral">{notice.category}</Badge>
              </div>
              <p className="text-sm text-secondary-600">{notice.content}</p>
              <p className="mt-2 text-xs text-secondary-500">Published {formatDate(notice.publishDate)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
