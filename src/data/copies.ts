import type { Book, BookCopy, Loan } from '@/types';
import { generateCopyBarcode } from '@/utils/barcode';
import { generateId } from '@/utils/id';

/**
 * Assigns a specific copy barcode to every seeded loan, and builds the matching
 * BookCopy records — mutates `loans` in place (fresh, not-yet-persisted objects from
 * buildLoans) so returning one of these seeded active loans releases the right copy.
 *
 * Active loans for an accession are assigned copy numbers 1..issuedCount, and exactly
 * those copies are seeded as "Issued" — so availableCopies (totalCopies - issuedCount,
 * already reconciled) always matches the number of copies actually left "Available".
 * Returned loans just need a real copy number for display and cycle through 1..totalCopies.
 */
export function buildCopies(books: Book[], loans: Loan[]): BookCopy[] {
  const issuedCountByAccession = new Map<string, number>();
  const activeCounters = new Map<string, number>();
  const returnedCounters = new Map<string, number>();

  loans.forEach((loan) => {
    const book = books.find((b) => b.accessionNumber === loan.accessionNumber);
    const totalCopies = book?.totalCopies ?? 1;
    if (loan.status === 'Active') {
      const next = (activeCounters.get(loan.accessionNumber) ?? 0) + 1;
      activeCounters.set(loan.accessionNumber, next);
      loan.copyBarcode = generateCopyBarcode(loan.accessionNumber, next);
      issuedCountByAccession.set(loan.accessionNumber, next);
    } else {
      const next = (returnedCounters.get(loan.accessionNumber) ?? 0) + 1;
      returnedCounters.set(loan.accessionNumber, next);
      const copyNumber = ((next - 1) % totalCopies) + 1;
      loan.copyBarcode = generateCopyBarcode(loan.accessionNumber, copyNumber);
    }
  });

  const copies: BookCopy[] = [];
  books.forEach((book) => {
    const issuedCount = issuedCountByAccession.get(book.accessionNumber) ?? 0;
    for (let copyNumber = 1; copyNumber <= book.totalCopies; copyNumber += 1) {
      copies.push({
        id: generateId('copy'),
        barcode: generateCopyBarcode(book.accessionNumber, copyNumber),
        accessionNumber: book.accessionNumber,
        bookId: book.id,
        copyNumber,
        status: copyNumber <= issuedCount ? 'Issued' : 'Available',
        addedDate: book.addedDate,
      });
    }
  });

  return copies;
}
