export type LoanStatus = 'Active' | 'Returned';

export interface Loan {
  id: string;
  memberId: string;
  accessionNumber: string;
  bookId: string;
  bookTitle: string;
  /** The specific physical copy issued, identified by its barcode. */
  copyBarcode: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  renewalCount: number;
  fineId?: string;
}

