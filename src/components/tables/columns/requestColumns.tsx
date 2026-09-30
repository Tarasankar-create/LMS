import type { ColumnDef } from '@tanstack/react-table';
import { Check, X } from 'lucide-react';
import type { BookRequest } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/date';

export interface RequestRow extends BookRequest {
  memberName: string;
  shelfLocation?: string;
}

interface RequestColumnHandlers {
  onApprove?: (request: RequestRow) => void;
  onReject?: (request: RequestRow) => void;
}

const STATUS_TONE: Record<BookRequest['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'danger',
  Issued: 'success',
  Cancelled: 'neutral',
  Expired: 'neutral',
};

export function createRequestColumns({ onApprove, onReject }: RequestColumnHandlers): ColumnDef<RequestRow, unknown>[] {
  return [
    { accessorKey: 'memberName', header: 'Member' },
    { accessorKey: 'bookTitle', header: 'Book Title' },
    { accessorKey: 'requestedDate', header: 'Requested On', cell: ({ row }) => formatDate(row.original.requestedDate) },
    {
      id: 'pickup',
      header: 'Pickup',
      cell: ({ row }) => {
        const r = row.original;
        if (r.status !== 'Approved') return <span className="text-secondary-400">-</span>;
        return (
          <div className="text-xs">
            <p className="font-mono font-medium text-ink">{r.heldCopyBarcode}</p>
            {r.shelfLocation && <p className="text-secondary-500">Shelf {r.shelfLocation}</p>}
            {r.expiryDate && <p className="text-secondary-500">Hold expires {formatDate(r.expiryDate)}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status]}>{row.original.status}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.status === 'Pending' && (onApprove || onReject) && (
          <div className="flex justify-end gap-1">
            {onApprove && (
              <Button size="sm" variant="outline" onClick={() => onApprove(row.original)}>
                <Check className="size-4" /> Approve
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="ghost" onClick={() => onReject(row.original)}>
                <X className="size-4 text-danger-500" />
              </Button>
            )}
          </div>
        ),
    },
  ];
}
