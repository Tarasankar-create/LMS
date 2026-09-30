import { describe, expect, it } from 'vitest';
import type { Fine, Loan, Member, Reservation } from '@/types';
import {
  buildFinesBreakdown,
  buildOverdueWatchlist,
  buildTopBorrowed,
  countDueToday,
  countReservationsByStatus,
  countReturnedToday,
} from './dashboardStats';

const TODAY = '2026-06-15';
const settings = { finePerDay: 5, maxFinePerBook: 100 };

const loan = (o: Partial<Loan>): Loan => ({
  id: 'l',
  memberId: 'MEM-1',
  accessionNumber: 'A1',
  bookId: 'b1',
  bookTitle: 'Book One',
  copyBarcode: 'A1-01',
  issueDate: '2026-06-01',
  dueDate: '2026-06-15',
  status: 'Active',
  renewalCount: 0,
  ...o,
});

describe('loan counters', () => {
  it('counts only active loans due today and only returns made today', () => {
    const loans = [
      loan({ id: '1', dueDate: TODAY }),
      loan({ id: '2', dueDate: TODAY, status: 'Returned', returnDate: TODAY }),
      loan({ id: '3', dueDate: '2026-06-16' }),
    ];
    expect(countDueToday(loans, TODAY)).toBe(1);
    expect(countReturnedToday(loans, TODAY)).toBe(1);
  });
});

describe('buildTopBorrowed', () => {
  it('ranks titles by loans inside the window and ignores older or future loans', () => {
    const loans = [
      loan({ id: '1', bookId: 'a', bookTitle: 'Alpha', issueDate: '2026-06-10' }),
      loan({ id: '2', bookId: 'a', bookTitle: 'Alpha', issueDate: '2026-06-12' }),
      loan({ id: '3', bookId: 'b', bookTitle: 'Beta', issueDate: '2026-06-11' }),
      loan({ id: '4', bookId: 'c', bookTitle: 'Old', issueDate: '2026-01-01' }),
      loan({ id: '5', bookId: 'd', bookTitle: 'Future', issueDate: '2026-07-01' }),
    ];
    const top = buildTopBorrowed(loans, 30, 5, TODAY);
    expect(top.map((t) => [t.title, t.count])).toEqual([
      ['Alpha', 2],
      ['Beta', 1],
    ]);
  });

  it('breaks ties alphabetically and respects the limit', () => {
    const loans = ['Zed', 'Ant', 'Bee'].map((t, i) => loan({ id: String(i), bookId: t, bookTitle: t, issueDate: TODAY }));
    expect(buildTopBorrowed(loans, 30, 2, TODAY).map((t) => t.title)).toEqual(['Ant', 'Bee']);
  });
});

describe('buildOverdueWatchlist', () => {
  const members = [{ memberId: 'MEM-1', name: 'Asha Das' }] as Member[];

  it('lists the most overdue active loans first with member names and capped fines', () => {
    const loans = [
      loan({ id: 'a', dueDate: '2026-06-10' }), // 5 days
      loan({ id: 'b', dueDate: '2026-04-01', memberId: 'MEM-9', bookTitle: 'Zeta' }), // 75 days → capped
      loan({ id: 'c', dueDate: '2026-06-20' }), // not overdue
      loan({ id: 'd', dueDate: '2026-05-01', status: 'Returned', returnDate: '2026-05-02' }), // returned
    ];
    const list = buildOverdueWatchlist(loans, members, settings, 5, TODAY);
    expect(list.map((x) => x.loanId)).toEqual(['b', 'a']);
    expect(list[0]).toMatchObject({ days: 75, fine: 100, memberName: 'MEM-9' }); // unknown member falls back to id
    expect(list[1]).toMatchObject({ days: 5, fine: 25, memberName: 'Asha Das' });
  });

  it('honours the limit', () => {
    const loans = [1, 2, 3].map((n) => loan({ id: String(n), dueDate: `2026-06-0${n}` }));
    expect(buildOverdueWatchlist(loans, [], settings, 2, TODAY)).toHaveLength(2);
  });
});

describe('buildFinesBreakdown', () => {
  const fine = (o: Partial<Fine>): Fine => ({
    id: 'f',
    loanId: 'l',
    memberId: 'm',
    memberName: 'M',
    bookTitle: 'B',
    overdueDays: 1,
    amount: 10,
    status: 'Pending',
    createdDate: '2026-06-01',
    ...o,
  });

  it('sums each status and this month’s collections', () => {
    const b = buildFinesBreakdown(
      [
        fine({ amount: 50 }),
        fine({ amount: 30, status: 'Collected', collectedDate: '2026-06-02' }),
        fine({ amount: 20, status: 'Collected', collectedDate: '2026-05-28' }),
        fine({ amount: 10, status: 'Waived' }),
      ],
      TODAY,
    );
    expect(b.pending).toEqual({ amount: 50, count: 1 });
    expect(b.collected).toEqual({ amount: 50, count: 2 });
    expect(b.waived).toEqual({ amount: 10, count: 1 });
    expect(b.total).toBe(110);
    expect(b.collectedThisMonth).toBe(30);
  });

  it('is all zeros with no fines', () => {
    expect(buildFinesBreakdown([], TODAY).total).toBe(0);
  });
});

describe('countReservationsByStatus', () => {
  it('counts ready and waiting only', () => {
    const r = (status: Reservation['status']) => ({ status }) as Reservation;
    expect(countReservationsByStatus([r('Ready'), r('Waiting'), r('Waiting'), r('Cancelled'), r('Expired')])).toEqual({ ready: 1, waiting: 2 });
  });
});
