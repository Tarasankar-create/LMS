import type { ColumnDef } from '@tanstack/react-table';
import type { Fine } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

interface FineColumnHandlers {
  onView: (fine: Fine) => void;
  onCollect?: (fine: Fine) => void;
  onWaive?: (fine: Fine) => void;
}

export function createFineColumns({ onView, onCollect, onWaive }: FineColumnHandlers): ColumnDef<Fine, unknown>[] {
  return [
    { accessorKey: 'id', header: 'Fine ID' },
    { accessorKey: 'memberName', header: 'Member' },
    { accessorKey: 'bookTitle', header: 'Book Title' },
    { accessorKey: 'overdueDays', header: 'Overdue Days' },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const tone = status === 'Pending' ? 'warning' : status === 'Collected' ? 'success' : 'neutral';
        return <Badge tone={tone}>{status}</Badge>;
      },
    },
    { accessorKey: 'createdDate', header: 'Date', cell: ({ row }) => formatDate(row.original.createdDate) },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onView(row.original)}>
            View
          </Button>
          {onCollect && row.original.status === 'Pending' && (
            <Button size="sm" variant="primary" onClick={() => onCollect(row.original)}>
              Collect
            </Button>
          )}
          {onWaive && row.original.status === 'Pending' && (
            <Button size="sm" variant="ghost" onClick={() => onWaive(row.original)}>
              Waive
            </Button>
          )}
        </div>
      ),
    },
  ];
}
