import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Printer } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useBooksStore } from '@/store/booksStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useCopiesStore } from '@/store/copiesStore';
import { BarcodeLabelsSheet } from '@/components/modals/BarcodeLabelsSheet';
import { formatDate } from '@/utils/date';
import { ROUTES } from '@/routes/routePaths';
import { cn } from '@/utils/cn';

export function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const book = useBooksStore((s) => s.getById(id ?? ''));
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const allCopies = useCopiesStore((s) => s.copies);

  const [labelsOpen, setLabelsOpen] = useState(false);

  useEffect(() => {
    if ((location.state as { printLabels?: boolean } | null)?.printLabels) {
      setLabelsOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookLoans = useMemo(
    () => (book ? loans.filter((l) => l.accessionNumber === book.accessionNumber) : []),
    [loans, book],
  );
  const activeLoans = useMemo(() => bookLoans.filter((l) => l.status === 'Active'), [bookLoans]);
  const history = useMemo(
    () => [...bookLoans].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [bookLoans],
  );
  const copies = useMemo(
    () => (book ? allCopies.filter((c) => c.accessionNumber === book.accessionNumber).sort((a, b) => a.copyNumber - b.copyNumber) : []),
    [allCopies, book],
  );

  function memberName(memberId: string) {
    return members.find((m) => m.memberId === memberId)?.name ?? memberId;
  }

  if (!book) {
    return (
      <div>
        <PageHeader title="Book Not Found" breadcrumbs={[{ label: 'Books Catalogue', href: ROUTES.books }, { label: 'Not Found' }]} />
        <EmptyState
          icon={BookOpen}
          title="This book could not be found"
          description="It may have been removed from the catalogue."
          action={{ label: 'Back to Catalogue', onClick: () => navigate(ROUTES.books) }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={book.title}
        breadcrumbs={[{ label: 'Books Catalogue', href: ROUTES.books }, { label: book.accessionNumber }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLabelsOpen(true)}>
              <Printer className="size-4" /> Print Labels
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.books)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone={book.status === 'Available' ? 'success' : book.status === 'Fully Issued' ? 'warning' : 'neutral'}>
              {book.status}
            </Badge>
            {book.libraryUseOnly && <Badge tone="primary">Library Use Only</Badge>}
            <Badge tone="neutral">{book.category}</Badge>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-secondary-500">Accession Number</dt>
              <dd className="font-medium text-ink">{book.accessionNumber}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Author</dt>
              <dd className="font-medium text-ink">{book.author}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">ISBN</dt>
              <dd className="font-medium text-ink">{book.isbn ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Shelf Location</dt>
              <dd className="font-medium text-ink">{book.shelfLocation}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Total / Available Copies</dt>
              <dd className="font-medium text-ink">
                {book.totalCopies} / {book.availableCopies}
              </dd>
            </div>
            <div>
              <dt className="text-secondary-500">Added On</dt>
              <dd className="font-medium text-ink">{formatDate(book.addedDate)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-ink">Copy Status</h3>
            <div className="flex flex-wrap gap-2">
              {copies.map((copy) => (
                <span
                  key={copy.id}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 font-mono text-xs font-medium',
                    copy.status === 'Available' && 'border-success-500/30 bg-success-50 text-success-600',
                    copy.status === 'Held' && 'border-warning-500/30 bg-warning-50 text-warning-600',
                    copy.status === 'Issued' && 'border-primary-500/30 bg-primary-50 text-primary-600',
                    (copy.status === 'Lost' || copy.status === 'Damaged') && 'border-danger-500/30 bg-danger-50 text-danger-600',
                  )}
                >
                  {copy.barcode} · {copy.status}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-ink">Currently Issued To</h3>
          {activeLoans.length === 0 ? (
            <p className="text-sm text-secondary-500">All copies are currently available.</p>
          ) : (
            <ul className="space-y-2">
              {activeLoans.map((loan) => (
                <li key={loan.id} className="rounded-lg border border-secondary-100 p-2.5 text-sm">
                  <p className="font-medium text-ink">{memberName(loan.memberId)}</p>
                  <p className="font-mono text-xs text-secondary-500">
                    {loan.copyBarcode} · Due {formatDate(loan.dueDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-ink">Issue History</h3>
        {history.length === 0 ? (
          <p className="text-sm text-secondary-500">This book has not been issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-secondary-100 text-xs uppercase text-secondary-500">
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Issue Date</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Return Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((loan) => (
                  <tr key={loan.id} className="border-b border-secondary-50 last:border-0">
                    <td className="px-3 py-2">{memberName(loan.memberId)}</td>
                    <td className="px-3 py-2">{formatDate(loan.issueDate)}</td>
                    <td className="px-3 py-2">{formatDate(loan.dueDate)}</td>
                    <td className="px-3 py-2">{formatDate(loan.returnDate)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={loan.status === 'Active' ? 'success' : 'neutral'}>{loan.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {labelsOpen && <BarcodeLabelsSheet book={book} copies={copies} onClose={() => setLabelsOpen(false)} />}
    </div>
  );
}
