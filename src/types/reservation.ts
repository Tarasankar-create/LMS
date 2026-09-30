export type ReservationStatus = 'Waiting' | 'Ready' | 'Expired' | 'Cancelled' | 'Fulfilled';

export interface Reservation {
  id: string;
  memberId: string;
  accessionNumber: string;
  bookId: string;
  bookTitle: string;
  queuePosition: number;
  status: ReservationStatus;
  reservedDate: string;
  readyDate?: string;
  expiryDate?: string;
}
