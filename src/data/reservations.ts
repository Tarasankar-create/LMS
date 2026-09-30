import type { Book, Member, Reservation, ReservationStatus } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom, randomInt } from './seededRandom';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

const STATUS_SEQUENCE: ReservationStatus[] = [
  'Waiting', 'Waiting', 'Waiting', 'Waiting', 'Waiting', 'Waiting', 'Waiting', 'Waiting',
  'Ready', 'Ready', 'Ready',
  'Expired', 'Expired',
  'Cancelled', 'Cancelled',
  'Fulfilled', 'Fulfilled', 'Fulfilled',
];

export function buildReservations(reconciledBooks: Book[], members: Member[]): Reservation[] {
  const rng = createSeededRandom(555);
  const today = todayISO();
  const fullyIssuedBooks = reconciledBooks.filter((b) => b.status === 'Fully Issued' && !b.libraryUseOnly);
  if (fullyIssuedBooks.length === 0) return [];

  const queuePositionByAccession = new Map<string, number>();
  const reservations: Reservation[] = [];

  const count = Math.min(SEED_COUNTS.reservations, STATUS_SEQUENCE.length);
  for (let i = 0; i < count; i += 1) {
    const book = fullyIssuedBooks[i % fullyIssuedBooks.length];
    const member = pickFrom(rng, members);
    const status = STATUS_SEQUENCE[i];
    const nextPosition = (queuePositionByAccession.get(book.accessionNumber) ?? 0) + 1;
    queuePositionByAccession.set(book.accessionNumber, nextPosition);

    const reservedDate = addDaysISO(today, -randomInt(rng, 1, 20));
    const reservation: Reservation = {
      id: generateId('resv'),
      memberId: member.memberId,
      accessionNumber: book.accessionNumber,
      bookId: book.id,
      bookTitle: book.title,
      queuePosition: nextPosition,
      status,
      reservedDate,
    };

    if (status === 'Ready') {
      reservation.readyDate = addDaysISO(today, -randomInt(rng, 0, 1));
      reservation.expiryDate = addDaysISO(reservation.readyDate, DEFAULT_SETTINGS.reservationHoldDays);
    } else if (status === 'Expired') {
      reservation.readyDate = addDaysISO(today, -randomInt(rng, 5, 10));
      reservation.expiryDate = addDaysISO(reservation.readyDate, DEFAULT_SETTINGS.reservationHoldDays);
    } else if (status === 'Fulfilled') {
      reservation.readyDate = addDaysISO(today, -randomInt(rng, 6, 15));
      reservation.expiryDate = addDaysISO(reservation.readyDate, DEFAULT_SETTINGS.reservationHoldDays);
    }

    reservations.push(reservation);
  }

  return reservations;
}
