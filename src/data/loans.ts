import type { Book, Loan, Member } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom, randomInt } from './seededRandom';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

const FIXED_ACCESSION_TARGETS: Record<string, number> = {
  'PSC-0001': 4,
  'PSC-0002': 5,
  'PSC-0003': 5,
  'PSC-0004': 4,
};

interface MemberSlotQueue {
  take(): string | undefined;
}

function buildShuffledMemberSlots(rng: () => number, members: Member[], slotsPerMember: number): MemberSlotQueue {
  const slots: string[] = [];
  members.forEach((member) => {
    for (let i = 0; i < slotsPerMember; i += 1) slots.push(member.memberId);
  });
  // Fisher-Yates shuffle using the seeded RNG for deterministic but varied assignment.
  for (let i = slots.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  let cursor = 0;
  return {
    take: () => (cursor < slots.length ? slots[cursor++] : undefined),
  };
}

/** Picks a book from the pool that still has a free copy for a new active loan (redraws a few times, then skips). */
function pickBookWithRoom(rng: () => number, pool: Book[], issuedCountByAccession: Map<string, number>): Book | undefined {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const book = pickFrom(rng, pool);
    const issued = issuedCountByAccession.get(book.accessionNumber) ?? 0;
    if (issued < book.totalCopies) return book;
  }
  return undefined;
}

export function buildLoans(
  books: Book[],
  members: Member[],
): { loans: Loan[]; issuedCountByAccession: Map<string, number> } {
  const rng = createSeededRandom(123);
  const today = todayISO();
  const loans: Loan[] = [];
  const issuedCountByAccession = new Map<string, number>();

  const bump = (accessionNumber: string) => {
    issuedCountByAccession.set(accessionNumber, (issuedCountByAccession.get(accessionNumber) ?? 0) + 1);
  };

  const fixedBooks = books.filter((b) => FIXED_ACCESSION_TARGETS[b.accessionNumber]);
  const generalPool = books.filter((b) => !FIXED_ACCESSION_TARGETS[b.accessionNumber] && !b.libraryUseOnly);

  const activeSlots = buildShuffledMemberSlots(rng, members, DEFAULT_SETTINGS.maxConcurrentLoans);

  function pushLoan(book: Book, memberId: string | undefined, opts: {
    issueDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'Active' | 'Returned';
    renewalCount?: 0 | 1;
  }) {
    if (!memberId) return;
    loans.push({
      id: generateId('loan'),
      memberId,
      accessionNumber: book.accessionNumber,
      bookId: book.id,
      bookTitle: book.title,
      copyBarcode: '', // assigned by buildCopies() once every book's copy records exist
      issueDate: opts.issueDate,
      dueDate: opts.dueDate,
      returnDate: opts.returnDate,
      status: opts.status,
      renewalCount: opts.renewalCount ?? 0,
    });
    if (opts.status === 'Active') bump(book.accessionNumber);
  }

  // Category A: fixed-book active loans matching the spec's stated available-copy counts.
  fixedBooks.forEach((book) => {
    const target = FIXED_ACCESSION_TARGETS[book.accessionNumber];
    for (let i = 0; i < target; i += 1) {
      const issueDate = addDaysISO(today, -randomInt(rng, 1, 10));
      pushLoan(book, activeSlots.take(), {
        issueDate,
        dueDate: addDaysISO(issueDate, DEFAULT_SETTINGS.loanPeriodDays),
        status: 'Active',
      });
    }
  });

  // Category B: overdue active loans (drives the "Overdue Books" dashboard stat).
  for (let i = 0; i < SEED_COUNTS.overdueActiveLoans; i += 1) {
    const book = pickBookWithRoom(rng, generalPool, issuedCountByAccession);
    if (!book) continue;
    const overdueBy = randomInt(rng, 1, 99);
    const dueDate = addDaysISO(today, -overdueBy);
    const issueDate = addDaysISO(dueDate, -DEFAULT_SETTINGS.loanPeriodDays);
    pushLoan(book, activeSlots.take(), { issueDate, dueDate, status: 'Active' });
  }

  // Category C: issued today (drives the "Books Issued Today" dashboard stat).
  for (let i = 0; i < SEED_COUNTS.issuedTodayLoans; i += 1) {
    const book = pickBookWithRoom(rng, generalPool, issuedCountByAccession);
    if (!book) continue;
    pushLoan(book, activeSlots.take(), {
      issueDate: today,
      dueDate: addDaysISO(today, DEFAULT_SETTINGS.loanPeriodDays),
      status: 'Active',
    });
  }

  // Category D: additional on-time active loans, a few marked as already renewed once.
  for (let i = 0; i < SEED_COUNTS.extraOnTimeActiveLoans; i += 1) {
    const book = pickBookWithRoom(rng, generalPool, issuedCountByAccession);
    if (!book) continue;
    const renewed = i < 5;
    const issueDate = addDaysISO(today, -randomInt(rng, 1, 10));
    const baseDue = addDaysISO(issueDate, DEFAULT_SETTINGS.loanPeriodDays);
    pushLoan(book, activeSlots.take(), {
      issueDate,
      dueDate: renewed ? addDaysISO(baseDue, DEFAULT_SETTINGS.loanPeriodDays) : baseDue,
      status: 'Active',
      renewalCount: renewed ? 1 : 0,
    });
  }

  // Category E: returned loans over the past year, for chart/report realism.
  const allPool = [...generalPool, ...fixedBooks];
  for (let i = 0; i < SEED_COUNTS.returnedLoans; i += 1) {
    const book = pickFrom(rng, allPool);
    const member = pickFrom(rng, members);
    const issueDate = addDaysISO(today, -randomInt(rng, 20, 365));
    const dueDate = addDaysISO(issueDate, DEFAULT_SETTINGS.loanPeriodDays);
    const returnOffset = randomInt(rng, -5, 12); // negative = returned early, positive = returned late
    const returnDate = addDaysISO(dueDate, returnOffset);
    pushLoan(book, member.memberId, { issueDate, dueDate, returnDate, status: 'Returned' });
  }

  return { loans, issuedCountByAccession };
}
