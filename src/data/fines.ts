import type { Fine, Loan, Member } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { SEED_COUNTS, TARGET_PENDING_FINE_TOTAL } from './seedConfig';
import { calculateFine } from '@/utils/fineCalculator';
import { overdueDays as computeOverdueDays } from '@/utils/date';
import { addDaysISO } from '@/utils/date';
import { createSeededRandom, pickFrom } from './seededRandom';
import { generateId } from '@/utils/id';

const WAIVER_REASONS = [
  'Medical emergency — leave documentation on file',
  'Book lost pages found undamaged on inspection',
  'First-time offender, goodwill waiver',
  'College event duty exemption',
];

function memberName(members: Member[], memberId: string): string {
  return members.find((m) => m.memberId === memberId)?.name ?? 'Unknown Member';
}

export function buildFines(loans: Loan[], members: Member[]): Fine[] {
  const rng = createSeededRandom(321);
  const fines: Fine[] = [];

  // Pending fines: one per currently-overdue active loan.
  const overdueActiveLoans = loans.filter((loan) => loan.status === 'Active' && computeOverdueDays(loan.dueDate) > 0);
  overdueActiveLoans.forEach((loan) => {
    const { days, amount } = calculateFine(loan.dueDate, DEFAULT_SETTINGS);
    fines.push({
      id: generateId('fine'),
      loanId: loan.id,
      memberId: loan.memberId,
      memberName: memberName(members, loan.memberId),
      bookTitle: loan.bookTitle,
      overdueDays: days,
      amount,
      status: 'Pending',
      createdDate: loan.dueDate,
    });
  });

  // Nudge the pending total to land exactly on the spec's ₹12,450 headline figure.
  // Spread the correction as a small overdueDays adjustment across every fine
  // (rather than draining a few fines to ₹0) so amounts stay internally consistent
  // with overdueDays * finePerDay and every fine still looks realistic.
  if (fines.length > 0) {
    const targetTotalDays = TARGET_PENDING_FINE_TOTAL / DEFAULT_SETTINGS.finePerDay;
    const totalDays = fines.reduce((sum, f) => sum + f.overdueDays, 0);
    let dayDiff = Math.round(targetTotalDays - totalDays);
    const base = Math.trunc(dayDiff / fines.length);
    let remainder = dayDiff - base * fines.length;

    fines.forEach((fine) => {
      let delta = base;
      if (remainder !== 0) {
        delta += Math.sign(remainder);
        remainder -= Math.sign(remainder);
      }
      fine.overdueDays = Math.max(1, fine.overdueDays + delta);
      fine.amount = Math.min(fine.overdueDays * DEFAULT_SETTINGS.finePerDay, DEFAULT_SETTINGS.maxFinePerBook);
    });

    // The max(1, ...) floor above can leave a small residual on very-low-day fines; absorb it on one fine.
    const finalDiff = TARGET_PENDING_FINE_TOTAL - fines.reduce((sum, f) => sum + f.amount, 0);
    if (finalDiff !== 0) {
      const extraDays = Math.round(finalDiff / DEFAULT_SETTINGS.finePerDay);
      const target = fines[0];
      target.overdueDays = Math.max(1, target.overdueDays + extraDays);
      target.amount = Math.min(target.overdueDays * DEFAULT_SETTINGS.finePerDay, DEFAULT_SETTINGS.maxFinePerBook);
    }
  }

  // Collected + waived fines, drawn from historically returned-late loans.
  const returnedLateLoans = loans.filter(
    (loan) => loan.status === 'Returned' && loan.returnDate && loan.returnDate > loan.dueDate,
  );

  const collectedCount = Math.min(SEED_COUNTS.collectedFines, returnedLateLoans.length);
  for (let i = 0; i < collectedCount; i += 1) {
    const loan = returnedLateLoans[i];
    const days = computeOverdueDays(loan.dueDate, loan.returnDate);
    const amount = Math.min(days * DEFAULT_SETTINGS.finePerDay, DEFAULT_SETTINGS.maxFinePerBook);
    fines.push({
      id: generateId('fine'),
      loanId: loan.id,
      memberId: loan.memberId,
      memberName: memberName(members, loan.memberId),
      bookTitle: loan.bookTitle,
      overdueDays: days,
      amount,
      status: 'Collected',
      createdDate: loan.dueDate,
      collectedDate: addDaysISO(loan.returnDate!, 0),
    });
  }

  const waivedPool = returnedLateLoans.slice(collectedCount);
  const waivedCount = Math.min(SEED_COUNTS.waivedFines, waivedPool.length);
  for (let i = 0; i < waivedCount; i += 1) {
    const loan = waivedPool[i];
    const days = computeOverdueDays(loan.dueDate, loan.returnDate);
    const amount = Math.min(days * DEFAULT_SETTINGS.finePerDay, DEFAULT_SETTINGS.maxFinePerBook);
    fines.push({
      id: generateId('fine'),
      loanId: loan.id,
      memberId: loan.memberId,
      memberName: memberName(members, loan.memberId),
      bookTitle: loan.bookTitle,
      overdueDays: days,
      amount,
      reason: pickFrom(rng, WAIVER_REASONS),
      status: 'Waived',
      createdDate: loan.dueDate,
    });
  }

  return fines;
}
