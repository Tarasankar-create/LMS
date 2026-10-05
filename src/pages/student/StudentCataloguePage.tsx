import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { useBooksStore } from '@/store/booksStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { useRequestsStore } from '@/store/requestsStore';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { isBookInDepartment } from '@/utils/departmentBooks';
import type { Book } from '@/types';

export function StudentCataloguePage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

  const books = useBooksStore((s) => s.books);
  const reservations = useReservationsStore((s) => s.reservations);
  const reserve = useReservationsStore((s) => s.reserve);
  const requests = useRequestsStore((s) => s.requests);
  const requestBook = useRequestsStore((s) => s.request);
  const isAtLoanLimit = useRequestsStore((s) => s.isAtLoanLimit);
  const member = useCurrentMember();
  const atLoanLimit = member ? isAtLoanLimit(member.memberId) : false;

  const studentDepartment = member?.department;
  const isSearching = searchQuery.trim().length > 0;

  // By default, show books from the student's department.
  // When searching, show all non-retired books so other department books can be searched.
  const visibleBooks = useMemo(() => {
    const nonRetired = books.filter((b) => b.status !== 'Retired');
    if (!isSearching && studentDepartment) {
      return nonRetired.filter((b) => isBookInDepartment(b, studentDepartment));
    }
    return nonRetired;
  }, [books, isSearching, studentDepartment]);

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
      { accessorKey: 'category', header: 'Category' },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => row.original.department || row.original.category || '-',
      },
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

      {studentDepartment && !isSearching && (
        <div className="mb-4 flex flex-col gap-1 rounded-xl border border-primary-100 bg-primary-50/60 p-3.5 text-sm text-primary-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 shrink-0 text-primary-600" />
            <span>
              Showing books for <strong>{studentDepartment}</strong> Department.
            </span>
          </div>
          <span className="text-xs text-primary-700">
            Need books from another department? Type in the search bar to find them.
          </span>
        </div>
      )}

      {isSearching && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-secondary-200 bg-secondary-50/70 p-3 text-sm text-secondary-800">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-secondary-500" />
            <span>
              Searching across <strong>all departments</strong> for &ldquo;{searchQuery}&rdquo;.
            </span>
          </div>
          {studentDepartment && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Reset to {studentDepartment} books
            </button>
          )}
        </div>
      )}

      <DataTable
        data={visibleBooks}
        columns={columns}
        searchPlaceholder="Search by title, author, department, or subject..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        emptyState={{
          title: 'No books found',
          description: isSearching
            ? 'Try adjusting your search terms to find books across all departments.'
            : `No books currently found for ${studentDepartment ?? 'your'} department. Use search to view other departments.`,
        }}
      />
    </div>
  );
}
