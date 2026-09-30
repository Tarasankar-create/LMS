export type BookRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Issued' | 'Cancelled' | 'Expired';

/**
 * A student's application to borrow a book. The librarian approves it (which holds one
 * copy for pickup) or rejects it; an approved request is completed at the desk by
 * scanning the held copy's barcode, which turns it into a Loan.
 */
export interface BookRequest {
  id: string;
  memberId: string;
  accessionNumber: string;
  bookId: string;
  bookTitle: string;
  requestedDate: string;
  status: BookRequestStatus;
  /** Set once approved — the specific copy held for this student. */
  heldCopyBarcode?: string;
  /** Approval date, when a copy was held. */
  readyDate?: string;
  /** Unclaimed holds lapse after this date (mirrors reservation hold days). */
  expiryDate?: string;
  rejectReason?: string;
  /** Set once the held copy is scanned out at the desk. */
  loanId?: string;
}
