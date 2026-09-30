import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useRequestsStore } from '@/store/requestsStore';
import { formatDate } from '@/utils/date';
import { ROUTES } from '@/routes/routePaths';
import type { BookRequest } from '@/types';

const STATUS_TONE: Record<BookRequest['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Issued: 'success',
  Cancelled: 'neutral',
  Expired: 'neutral',
};

const STATUS_NOTE: Partial<Record<BookRequest['status'], (r: BookRequest) => string>> = {
  Pending: () => 'Waiting for the librarian to review your request.',
  Approved: (r) => `Ready for pickup at the desk${r.expiryDate ? ` — collect by ${formatDate(r.expiryDate)}` : ''}.`,
  Rejected: (r) => r.rejectReason ?? 'This request was not approved.',
  Issued: () => 'Issued to you — see My Books.',
  Expired: () => 'The hold expired before you collected it.',
  Cancelled: () => 'You cancelled this request.',
};

/** A student's own book requests — from "Pending" through pickup or rejection. */
export function StudentRequestsPage() {
  const navigate = useNavigate();
  const member = useCurrentMember();
  const allRequests = useRequestsStore((s) => s.requests);
  const cancel = useRequestsStore((s) => s.cancel);

  const myRequests = useMemo(
    () =>
      member
        ? [...allRequests].filter((r) => r.memberId === member.memberId).sort((a, b) => (a.requestedDate < b.requestedDate ? 1 : -1))
        : [],
    [allRequests, member],
  );

  function handleCancel(id: string) {
    cancel(id);
    toast.success('Request cancelled.');
  }

  if (!member) return <EmptyState title="Member record not found" />;

  return (
    <div>
      <PageHeader
        title="My Requests"
        description="Books you've applied to borrow. Once a librarian approves a request, a copy is held for you to collect at the desk."
      />

      {myRequests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Find an available title in the catalogue and select Request."
          action={{ label: 'Browse Catalogue', onClick: () => navigate(ROUTES.studentCatalogue) }}
        />
      ) : (
        <ul className="divide-y divide-secondary-50 rounded-xl border border-secondary-100 bg-white shadow-sm">
          {myRequests.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-ink">{r.bookTitle}</p>
                <p className="text-xs text-secondary-500">
                  Requested {formatDate(r.requestedDate)} · {STATUS_NOTE[r.status]?.(r)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                {r.status === 'Pending' && (
                  <Button size="sm" variant="outline" onClick={() => handleCancel(r.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
