import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { createRequestColumns, type RequestRow } from '@/components/tables/columns/requestColumns';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useRequestsStore } from '@/store/requestsStore';
import { useMembersStore } from '@/store/membersStore';
import { useBooksStore } from '@/store/booksStore';
import { useCan } from '@/access/useCan';

/**
 * The librarian's queue of student "apply to issue" requests. Approving holds one
 * physical copy for the student — the actual issue happens at the desk by scanning
 * that copy's barcode (Circulation → Issue a Book).
 */
export function RequestsPage() {
  const requests = useRequestsStore((s) => s.requests);
  const approve = useRequestsStore((s) => s.approve);
  const reject = useRequestsStore((s) => s.reject);
  const members = useMembersStore((s) => s.members);
  const books = useBooksStore((s) => s.books);
  const confirm = useConfirm();

  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const rows: RequestRow[] = useMemo(() => {
    const memberName = (id: string) => members.find((m) => m.memberId === id)?.name ?? id;
    const shelfOf = (accession: string) => books.find((b) => b.accessionNumber === accession)?.shelfLocation;
    return [...requests]
      .sort((a, b) => {
        const timeA = a.requestedAt || `${a.requestedDate}T00:00:00`;
        const timeB = b.requestedAt || `${b.requestedDate}T00:00:00`;
        return sortOrder === 'newest' ? timeB.localeCompare(timeA) : timeA.localeCompare(timeB);
      })
      .map((r) => ({ ...r, memberName: memberName(r.memberId), shelfLocation: shelfOf(r.accessionNumber) }));
  }, [requests, members, books, sortOrder]);

  function handleApprove(request: RequestRow) {
    const result = approve(request.id);
    if (result.success) {
      toast.success(`Held "${request.bookTitle}" (${result.request.heldCopyBarcode}) for ${request.memberName} — ready for pickup.`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleReject(request: RequestRow) {
    const ok = await confirm({
      title: 'Reject this request?',
      description: `${request.memberName}'s request for "${request.bookTitle}" will be rejected.`,
      confirmLabel: 'Reject',
      tone: 'danger',
    });
    if (ok) {
      reject(request.id);
      toast.success('Request rejected.');
    }
  }

  const canAction = useCan()('circulation', 'create');
  const columns = useMemo(
    () => createRequestColumns({ onApprove: canAction ? handleApprove : undefined, onReject: canAction ? handleReject : undefined }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canAction],
  );

  return (
    <div>
      <PageHeader
        title="Book Requests"
        description="Students apply to borrow an available title here. Approving holds one copy — issue it at the desk by scanning that copy's barcode."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member or book title..."
        toolbarActions={
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            aria-label="Sort requests by time"
            className="rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
          >
            <option value="newest">Sort: Newest First (Recent)</option>
            <option value="oldest">Sort: Oldest First (Queue / FIFO)</option>
          </select>
        }
        emptyState={{ title: 'No requests', description: 'No students currently have open book requests.' }}
      />
    </div>
  );
}
