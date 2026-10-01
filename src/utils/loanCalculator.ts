import { addDaysISO, todayISO } from './date';
import type { Loan, LibrarySettings } from '@/types';

export function calculateDueDate(issueDateISO: string, settings: Pick<LibrarySettings, 'loanPeriodDays'>): string {
  return addDaysISO(issueDateISO, settings.loanPeriodDays);
}

export function canIssueMoreBooks(
  activeLoansForMember: Loan[],
  settings: Pick<LibrarySettings, 'maxConcurrentLoans'>,
): boolean {
  return activeLoansForMember.length < settings.maxConcurrentLoans;
}

export function canRenew(
  loan: Loan,
  hasPendingReservation: boolean,
  maxRenewals: number = 1,
): { allowed: boolean; reason?: string } {
  if (loan.status !== 'Active') {
    return { allowed: false, reason: 'This loan is already closed.' };
  }
  if (hasPendingReservation) {
    return {
      allowed: false,
      reason: 'Renewal rejected: Another student has placed an active reservation on this title (FR-REN-02).',
    };
  }
  if (loan.renewalCount >= maxRenewals) {
    return {
      allowed: false,
      reason: `Renewal rejected: Maximum renewal limit (${maxRenewals}) reached for this book (FR-REN-01).`,
    };
  }
  return { allowed: true };
}

export function calculateRenewedDueDate(loan: Loan, settings: Pick<LibrarySettings, 'loanPeriodDays'>): string {
  return addDaysISO(loan.dueDate, settings.loanPeriodDays);
}

export function issuedToday(loans: Loan[], asOfISO: string = todayISO()): Loan[] {
  return loans.filter((loan) => loan.issueDate === asOfISO);
}

