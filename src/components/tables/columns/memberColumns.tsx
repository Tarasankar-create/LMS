import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil } from 'lucide-react';
import type { Member } from '@/types';
import { Badge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/currency';

export interface MemberRow extends Member {
  totalBooksIssued: number;
  outstandingFine: number;
}

interface MemberColumnHandlers {
  onView: (member: MemberRow) => void;
  onEdit?: (member: MemberRow) => void;
}

export function createMemberColumns({ onView, onEdit }: MemberColumnHandlers): ColumnDef<MemberRow, unknown>[] {
  return [
    { accessorKey: 'memberId', header: 'Member ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'rollNumber', header: 'Roll No.' },
    { accessorKey: 'department', header: 'Department' },
    { accessorKey: 'totalBooksIssued', header: 'Books Issued' },
    {
      accessorKey: 'outstandingFine',
      header: 'Outstanding Fine',
      cell: ({ row }) => (
        <span className={row.original.outstandingFine > 0 ? 'font-medium text-danger-600' : 'text-secondary-500'}>
          {formatCurrency(row.original.outstandingFine)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const tone = status === 'Active' ? 'success' : status === 'Suspended' ? 'danger' : 'neutral';
        return <Badge tone={tone}>{status}</Badge>;
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
            className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-100 hover:text-primary-500"
            aria-label="View member"
          >
            <Eye className="size-4" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row.original);
              }}
              className="rounded-lg p-1.5 text-secondary-500 hover:bg-secondary-100 hover:text-primary-500"
              aria-label="Edit member"
            >
              <Pencil className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
