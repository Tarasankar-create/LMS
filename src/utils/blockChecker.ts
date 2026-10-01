import type { Member, Loan, LibrarySettings, Fine } from '@/types';
import { overdueDays } from './date';

export interface BlockStatusResult {
  isBlocked: boolean;
  reasons: string[];
  primaryReason?: string;
  isOverridden: boolean;
  overrideDetails?: Member['blockOverride'];
}

export function evaluateMemberBlockStatus(
  member: Member,
  loans: Loan[],
  fines: Fine[],
  settings: LibrarySettings,
): BlockStatusResult {
  const reasons: string[] = [];

  // 1. Manual explicit block flag
  if (member.isBlocked && member.blockReason) {
    reasons.push(`Account blocked: ${member.blockReason}`);
  }

  // 2. Outstanding fine threshold (FR-BLOCK-01)
  const unpaidFineAmount = fines
    .filter((f) => f.memberId === member.memberId && f.status === 'Pending')
    .reduce((sum, f) => sum + f.amount, 0);

  if (unpaidFineAmount > settings.blockFineThreshold) {
    reasons.push(
      `Account blocked: Outstanding fine of ₹${unpaidFineAmount} exceeds the ₹${settings.blockFineThreshold} limit (FR-BLOCK-01).`
    );
  }

  // 3. Overdue days threshold (FR-BLOCK-01)
  const memberActiveLoans = loans.filter((l) => l.memberId === member.memberId && l.status === 'Active');
  for (const loan of memberActiveLoans) {
    const daysLate = overdueDays(loan.dueDate);
    if (daysLate > settings.blockOverdueDays) {
      reasons.push(
        `Account blocked: Book "${loan.bookTitle}" is overdue by ${daysLate} days (exceeds ${settings.blockOverdueDays}-day limit) (FR-BLOCK-01).`
      );
      break;
    }
  }

  const isOverridden = Boolean(member.blockOverride);
  const isBlocked = reasons.length > 0;

  return {
    isBlocked,
    reasons,
    primaryReason: reasons[0],
    isOverridden,
    overrideDetails: member.blockOverride,
  };
}
