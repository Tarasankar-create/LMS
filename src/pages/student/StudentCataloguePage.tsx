import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { useBooksStore } from '@/store/booksStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { useRequestsStore } from '@/store/requestsStore';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import type { Book } from '@/types';

export function StudentCataloguePage() {
  const [searchParams] = useSearchParams();
  const books = useBooksStore((s) => s.books);
  const reservations = useReservationsStore((s) => s.reservations);
  const reserve = useReservationsStore((s) => s.reserve);
  const requests = useRequestsStore((s) => s.requests);
    const requestBook = useRequestsStore((s) => s.request);
  const isAtLoanLimit = useRequestsStore((s) => s.isAtLoanLimit);
  const member = useCurrentMember();
  const atLoanLimit = member ? isAtLoanLimit(member.memberId) : false;

  const visibleBooks = useMemo(() => books.filter((b) => b.status !== 'Retired'), [books]);

  function alreadyReserved(book: Book) {
    if (!member) return false;
    return reservations.some(
      (r) =>
        r.memberId === member.memberId &&
        r.accessionNumber === book.accessionNumber &&
        (r.status === 'Waiting' || r.status === 'Ready'),
    );
  }

  function handleReserve(book: Book) {
    if (!member) return;
    if (alreadyReserved(book)) {
      toast.error('You already have a pending reservation for this title.');
      return;
    }
    reserve(member.memberId, book.accessionNumber, book.id, book.title);
    toast.success('Reservation placed. You will be notified when a copy becomes available.');
  }

  function hasOpenRequest(book: Book) {
    if (!member) return false;
    return requests.some(
      (r) => r.memberId === member.memberId && r.accessionNumber === book.accessionNumber && (r.status === 'Pending' || r.status === 'Approved'),
    );
  }

  function handleRequest(book: Book) {
    if (!member) return;
    const result = requestBook(member.memberId, book.accessionNumber, book.id, book.title);
    if (result.success) {
      toast.success(`Requested "${book.title}". You'll be notified once the librarian approves it.`);
    } else {
      toast.error(result.error);
    }
  }

  const columns = useMemo<ColumnDef<Book, unknown>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'author', header: 'Author' },
      { accessorKey: 'category', header: 'Subject' },
      { accessorKey: 'shelfLocation', header: 'Shelf' },
      {
        id: 'availability',
        header: 'Availability',
        cell: ({ row }) => {
          const book = row.original;
          if (book.libraryUseOnly) return <Badge tone="primary">Library Use Only</Badge>;
          return (
            <Badge tone={book.availableCopies > 0 ? 'success' : 'warning'}>
              {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Fully Issued'}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const book = row.original;
          if (book.libraryUseOnly) return null;
          if (book.availableCopies > 0) {
            const requested = hasOpenRequest(book);
            const disabled = requested || atLoanLimit;
            return (
              <Button size="sm" variant="outline" disabled={disabled} onClick={() => handleRequest(book)}>
                {requested ? 'Requested' : atLoanLimit ? 'Limit reached' : 'Request'}
              </Button>
            );
          }
          const reserved = alreadyReserved(book);
          return (
            <Button size="sm" variant="outline" disabled={reserved} onClick={() => handleReserve(book)}>
              {reserved ? 'Reserved' : 'Reserve'}
            </Button>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reservations, requests, member, atLoanLimit],
  );

  return (
    <div>
      <PageHeader title="Library Catalogue" description="Search the collection and check live availability." />
      <DataTable
        data={visibleBooks}
        columns={columns}
        searchPlaceholder="Search by title, author, or subject..."
        initialSearch={searchParams.get('q') ?? ''}
        emptyState={{ title: 'No books found' }}
      />
    </div>
  );
}
