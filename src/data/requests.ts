import type { Book, BookCopy, BookRequest, Member } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom } from './seededRandom';
import { addDaysISO, todayISO, formatTime } from '@/utils/date';
import { generateId } from '@/utils/id';

/**
 * A handful of demo book requests so the librarian's Requests queue and a student's
 * "My Requests" list aren't empty on first look. Approved ones actually hold a real
 * copy — mutating that copy to "Held" and the book's availableCopies to match, the
 * same way the live app's requestsStore.approve() does.
 */
export function buildRequests(books: Book[], copies: BookCopy[], members: Member[]): BookRequest[] {
  const rng = createSeededRandom(909);
  const today = todayISO();
  const candidates = books.filter((b) => b.availableCopies > 0 && !b.libraryUseOnly);
  if (candidates.length === 0) return [];

  const requests: BookRequest[] = [];
  const take = Math.min(SEED_COUNTS.requests, candidates.length);

  for (let i = 0; i < take; i += 1) {
    const book = candidates[i];
    const member = pickFrom(rng, members);
    const kind = i % 3; // cycle Pending, Approved, Rejected for a realistic mixed queue

    const reqDate = addDaysISO(today, -(i % 4));
    const hour = String(9 + (i % 8)).padStart(2, '0');
    const minute = String((i * 17) % 60).padStart(2, '0');
    const reqAt = `${reqDate}T${hour}:${minute}:00`;
    const base: BookRequest = {
      id: generateId('req'),
      memberId: member.memberId,
      accessionNumber: book.accessionNumber,
      bookId: book.id,
      bookTitle: book.title,
      requestedDate: reqDate,
      requestedAt: reqAt,
      requestedTime: formatTime(reqAt),
      status: 'Pending',
    };

    if (kind === 1) {
      const copy = copies.find((c) => c.accessionNumber === book.accessionNumber && c.status === 'Available');
      if (copy) {
        copy.status = 'Held';
        book.availableCopies = Math.max(0, book.availableCopies - 1);
        if (book.availableCopies === 0) book.status = 'Fully Issued';
        base.status = 'Approved';
        base.heldCopyBarcode = copy.barcode;
        base.readyDate = today;
        base.expiryDate = addDaysISO(today, DEFAULT_SETTINGS.reservationHoldDays);
      }
    } else if (kind === 2) {
      base.status = 'Rejected';
      base.rejectReason = 'Member already has an overdue book.';
    }

    requests.push(base);
  }

  return requests;
}
