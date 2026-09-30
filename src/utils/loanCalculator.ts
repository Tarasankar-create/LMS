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

export function canRenew(loan: Loan, hasPendingReservation: boolean): { allowed: boolean; reason?: string } {
  if (loan.status !== 'Active') {
    return { allowed: false, reason: 'This loan is already closed.' };
  }
  if (loan.renewalCount >= 1) {
    return { allowed: false, reason: 'This loan has already been renewed once.' };
  }
  if (hasPendingReservation) {
    return { allowed: false, reason: 'Renewal is blocked — another member has reserved this title.' };
  }
  return { allowed: true };
}

export function calculateRenewedDueDate(loan: Loan, settings: Pick<LibrarySettings, 'loanPeriodDays'>): string {
  return addDaysISO(loan.dueDate, settings.loanPeriodDays);
}

export function issuedToday(loans: Loan[], asOfISO: string = todayISO()): Loan[] {
  return loans.filter((loan) => loan.issueDate === asOfISO);
}
