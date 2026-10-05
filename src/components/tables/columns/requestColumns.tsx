import type { ColumnDef } from '@tanstack/react-table';
import { Check, X, Clock } from 'lucide-react';
import type { BookRequest } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate, formatTime } from '@/utils/date';

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
    {
      accessorKey: 'requestedAt',
      header: 'Requested At',
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.requestedAt || `${rowA.original.requestedDate}T00:00:00`;
        const b = rowB.original.requestedAt || `${rowB.original.requestedDate}T00:00:00`;
        return a.localeCompare(b);
      },
      cell: ({ row }) => {
        const r = row.original;
        const timeStr = r.requestedTime || (r.requestedAt ? formatTime(r.requestedAt) : '');
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-secondary-900">{formatDate(r.requestedDate)}</span>
            {timeStr ? (
              <span className="text-secondary-500 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                <Clock className="size-3 text-secondary-400" />
                {timeStr}
              </span>
            ) : (
              <span className="text-secondary-400 text-[11px]">-</span>
            )}
          </div>
        );
      },
    },
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
