import type { TopBorrowedBook } from '@/utils/dashboardStats';
import { ROUTES } from '@/routes/routePaths';
import { DashboardCard, WidgetEmpty } from './DashboardCard';

interface PopularBooksProps {
  books: TopBorrowedBook[];
  days: number;
  canOpen: boolean;
}

/** Most-issued titles in the recent window, drawn as small proportional bars. */
export function PopularBooks({ books, days, canOpen }: PopularBooksProps) {
  const max = Math.max(1, ...books.map((b) => b.count));
  return (
    <DashboardCard
      title="Popular books"
      description={`Most issued in the last ${days} days`}
      action={canOpen ? { label: 'Catalogue', to: ROUTES.books } : undefined}
    >
      {books.length === 0 ? (
        <WidgetEmpty>No books were issued in this period.</WidgetEmpty>
      ) : (
        <ol className="space-y-3.5">
          {books.map((book, i) => (
            <li key={book.bookId} className="flex items-center gap-3">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-600">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink">{book.title}</span>
                  <span className="flex-none text-xs font-semibold text-secondary-600">
                    {book.count} {book.count === 1 ? 'loan' : 'loans'}
                  </span>
                </span>
                <span aria-hidden className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-secondary-100">
                  <span className="block h-full rounded-full bg-gradient-to-r from-accent-500 to-primary-500" style={{ width: `${Math.max(6, (book.count / max) * 100)}%` }} />
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
