import type { Book, Loan } from '@/types';

export interface DerivedCopy {
  copyNumber: number;
  status: 'Issued' | 'Available';
}

/**
 * Books have no persisted per-copy records — copy-level status is derived
 * from totalCopies and the count of currently active loans for that
 * accession number, so it can never drift out of sync with real loan data.
 */
export function deriveCopies(book: Book, activeLoans: Loan[]): DerivedCopy[] {
  const issuedCount = activeLoans.filter((loan) => loan.accessionNumber === book.accessionNumber).length;
  return Array.from({ length: book.totalCopies }, (_, index) => ({
    copyNumber: index + 1,
    status: index < issuedCount ? 'Issued' : 'Available',
  }));
}
