import type { ColumnDef } from '@tanstack/react-table';
import type { Reservation } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/date';

export interface ReservationRow extends Reservation {
  memberName: string;
}

interface ReservationColumnHandlers {
  onCancel?: (reservation: ReservationRow) => void;
}

const STATUS_TONE: Record<Reservation['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  Waiting: 'warning',
  Ready: 'success',
  Expired: 'neutral',
  Cancelled: 'neutral',
  Fulfilled: 'success',
};

export function createReservationColumns({ onCancel }: ReservationColumnHandlers): ColumnDef<ReservationRow, unknown>[] {
  return [
    { accessorKey: 'memberName', header: 'Member' },
    { accessorKey: 'bookTitle', header: 'Book Title' },
    { accessorKey: 'queuePosition', header: 'Queue Position' },
    { accessorKey: 'reservedDate', header: 'Reserved On', cell: ({ row }) => formatDate(row.original.reservedDate) },
    {
      accessorKey: 'expiryDate',
      header: 'Hold Expires',
      cell: ({ row }) => (row.original.expiryDate ? formatDate(row.original.expiryDate) : '-'),
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
        onCancel &&
        (row.original.status === 'Waiting' || row.original.status === 'Ready') && (
          <Button size="sm" variant="outline" onClick={() => onCancel(row.original)}>
            Cancel
          </Button>
        ),
    },
  ];
}
