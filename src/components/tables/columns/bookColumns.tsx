import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Archive } from 'lucide-react';
import type { Book } from '@/types';
import { Badge } from '@/components/common/Badge';

interface BookColumnHandlers {
  onView: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onRetire?: (book: Book) => void;
}

export function createBookColumns({ onView, onEdit, onRetire }: BookColumnHandlers): ColumnDef<Book, unknown>[] {
  return [
    { accessorKey: 'accessionNumber', header: 'Accession No.' },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'author', header: 'Author' },
    { accessorKey: 'category', header: 'Category' },
    {
      id: 'copies',
      header: 'Copies',
      accessorFn: (book) => `${book.availableCopies}/${book.totalCopies}`,
      cell: ({ row }) => (
        <span>
          {row.original.availableCopies}/{row.original.totalCopies}
        </span>
      ),
    },
    { accessorKey: 'shelfLocation', header: 'Shelf' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const tone = status === 'Available' ? 'success' : status === 'Fully Issued' ? 'warning' : 'neutral';
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
            aria-label="View book"
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
              aria-label="Edit book"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onRetire && row.original.status !== 'Retired' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetire(row.original);
              }}
              className="rounded-lg p-1.5 text-secondary-500 hover:bg-danger-50 hover:text-danger-500"
              aria-label="Retire book"
            >
              <Archive className="size-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
