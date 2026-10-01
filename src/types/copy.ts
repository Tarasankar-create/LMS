export type CopyStatus = 'Available' | 'Held' | 'Issued' | 'Lost' | 'Damaged' | 'Withdrawn';

/**
 * One physical copy of a book, identified by its own barcode sticker.
 * A title's `Book.totalCopies` is how many of these exist for its accession number.
 */
export interface BookCopy {
  id: string;
  /** Unique per copy, e.g. "PSC-0001-03". Scanned at hold, issue and return. */
  barcode: string;
  accessionNumber: string;
  bookId: string;
  copyNumber: number;
  status: CopyStatus;
  statusReason?: string;
  statusChangedDate?: string;
  shelfLocation?: string;
  addedDate: string;
}

