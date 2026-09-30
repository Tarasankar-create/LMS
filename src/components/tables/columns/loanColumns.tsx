import type { ColumnDef } from '@tanstack/react-table';
import type { Loan, Member } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate, overdueDays } from '@/utils/date';

export interface LoanRow extends Loan {
  memberName: string;
}

interface LoanColumnOptions {
  members: Member[];
  onReturn?: (loan: LoanRow) => void;
  onRenew?: (loan: LoanRow) => void;
}

export function createLoanColumns({ onReturn, onRenew }: LoanColumnOptions): ColumnDef<LoanRow, unknown>[] {
  const columns: ColumnDef<LoanRow, unknown>[] = [
    { accessorKey: 'memberName', header: 'Member' },
    { accessorKey: 'accessionNumber', header: 'Accession No.' },
    { accessorKey: 'bookTitle', header: 'Book Title' },
    { accessorKey: 'issueDate', header: 'Issue Date', cell: ({ row }) => formatDate(row.original.issueDate) },
    { accessorKey: 'dueDate', header: 'Due Date', cell: ({ row }) => formatDate(row.original.dueDate) },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const loan = row.original;
        if (loan.status === 'Returned') {
          return <Badge tone="neutral">Returned</Badge>;
        }
        const days = overdueDays(loan.dueDate);
        if (days > 0) return <Badge tone="danger">Overdue ({days}d)</Badge>;
        return <Badge tone="success">Active</Badge>;
      },
    },
  ];

  if (onReturn || onRenew) {
    columns.push({
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {onRenew && row.original.status === 'Active' && (
            <Button size="sm" variant="outline" onClick={() => onRenew(row.original)}>
              Renew
            </Button>
          )}
          {onReturn && row.original.status === 'Active' && (
            <Button size="sm" variant="primary" onClick={() => onReturn(row.original)}>
              Return
            </Button>
          )}
        </div>
      ),
    });
  }

  return columns;
}
