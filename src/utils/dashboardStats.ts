import type { Fine, Loan, LibrarySettings, Member, Reservation } from '@/types';
import { calculateFine } from './fineCalculator';
import { addDaysISO, overdueDays, todayISO } from './date';

/** Active loans whose due date is exactly today (still on time, but coming back today). */
export function countDueToday(loans: Loan[], today: string = todayISO()): number {
  return loans.filter((l) => l.status === 'Active' && l.dueDate === today).length;
}

export function countReturnedToday(loans: Loan[], today: string = todayISO()): number {
  return loans.filter((l) => l.status === 'Returned' && l.returnDate === today).length;
}

export interface TopBorrowedBook {
  bookId: string;
  title: string;
  count: number;
}

/** Titles issued most often in the last `days` days (ties broken alphabetically so the order is stable). */
export function buildTopBorrowed(loans: Loan[], days = 30, limit = 5, today: string = todayISO()): TopBorrowedBook[] {
  const since = addDaysISO(today, -days);
  const counts = new Map<string, TopBorrowedBook>();
  for (const loan of loans) {
    if (loan.issueDate < since || loan.issueDate > today) continue;
    const entry = counts.get(loan.bookId) ?? { bookId: loan.bookId, title: loan.bookTitle, count: 0 };
    entry.count += 1;
    counts.set(loan.bookId, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)).slice(0, limit);
}

export interface OverdueWatchItem {
  loanId: string;
  title: string;
  memberName: string;
  memberId: string;
  days: number;
  fine: number;
}

/** The loans that are furthest past their due date, with the member's name and the fine accrued so far. */
export function buildOverdueWatchlist(
  loans: Loan[],
  members: Member[],
  settings: Pick<LibrarySettings, 'finePerDay' | 'maxFinePerBook'>,
  limit = 5,
  today: string = todayISO(),
): OverdueWatchItem[] {
  const names = new Map(members.map((m) => [m.memberId, m.name]));
  return loans
    .filter((l) => l.status === 'Active' && overdueDays(l.dueDate, today) > 0)
    .map((l) => ({
      loanId: l.id,
      title: l.bookTitle,
      memberId: l.memberId,
      memberName: names.get(l.memberId) ?? l.memberId,
      days: overdueDays(l.dueDate, today),
      fine: calculateFine(l.dueDate, settings, today).amount,
    }))
    .sort((a, b) => b.days - a.days || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export interface FinesBreakdown {
  pending: { amount: number; count: number };
  collected: { amount: number; count: number };
  waived: { amount: number; count: number };
  /** Sum of every fine ever raised, used as the bar's 100%. */
  total: number;
  /** Collected during the calendar month of `today`. */
  collectedThisMonth: number;
}

export function buildFinesBreakdown(fines: Fine[], today: string = todayISO()): FinesBreakdown {
  const out: FinesBreakdown = {
    pending: { amount: 0, count: 0 },
    collected: { amount: 0, count: 0 },
    waived: { amount: 0, count: 0 },
    total: 0,
    collectedThisMonth: 0,
  };
  const month = today.slice(0, 7);
  for (const f of fines) {
    const bucket = f.status === 'Pending' ? out.pending : f.status === 'Collected' ? out.collected : out.waived;
    bucket.amount += f.amount;
    bucket.count += 1;
    out.total += f.amount;
    if (f.status === 'Collected' && f.collectedDate?.startsWith(month)) out.collectedThisMonth += f.amount;
  }
  return out;
}

export function countReservationsByStatus(reservations: Reservation[]): { ready: number; waiting: number } {
  return {
    ready: reservations.filter((r) => r.status === 'Ready').length,
    waiting: reservations.filter((r) => r.status === 'Waiting').length,
  };
}
