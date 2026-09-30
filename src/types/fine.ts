export type FineStatus = 'Pending' | 'Collected' | 'Waived';

export interface Fine {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  bookTitle: string;
  overdueDays: number;
  amount: number;
  reason?: string;
  status: FineStatus;
  createdDate: string;
  collectedDate?: string;
}
