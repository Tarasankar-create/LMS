import { buildBookRecords, reconcileBookAvailability } from './books';
import { seedMembers } from './members';
import { buildLoans } from './loans';
import { buildCopies } from './copies';
import { buildFines } from './fines';
import { buildReservations } from './reservations';
import { buildRequests } from './requests';
import type { Book, BookCopy, BookRequest, Fine, Loan, Member, Reservation } from '@/types';

export interface SeededDemoData {
  books: Book[];
  members: Member[];
  loans: Loan[];
  copies: BookCopy[];
  fines: Fine[];
  reservations: Reservation[];
  requests: BookRequest[];
}

/**
 * Generates the full interlinked demo dataset in one pass so books, loans, copies,
 * fines, reservations and requests stay mutually consistent (e.g. a book's
 * availableCopies always matches its actual count of Available copies).
 */
export function seedDemoData(): SeededDemoData {
  const members = seedMembers();
  const placeholderBooks = buildBookRecords();
  const { loans, issuedCountByAccession } = buildLoans(placeholderBooks, members);
  const books = reconcileBookAvailability(placeholderBooks, issuedCountByAccession);
  const copies = buildCopies(books, loans);
  const fines = buildFines(loans, members);
  const reservations = buildReservations(books, members);
  const requests = buildRequests(books, copies, members);

  return { books, members, loans, copies, fines, reservations, requests };
}
