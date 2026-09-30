import type { Loan } from '@/types';
import { overdueDays } from './date';

export interface OverdueBucket {
  bucket: string;
  count: number;
}

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '1-7 days', min: 1, max: 7 },
  { label: '8-14 days', min: 8, max: 14 },
  { label: '15-30 days', min: 15, max: 30 },
  { label: '30+ days', min: 31, max: Infinity },
];

export function buildOverdueSummary(loans: Loan[]): OverdueBucket[] {
  const overdueLoans = loans.filter((loan) => loan.status === 'Active' && overdueDays(loan.dueDate) > 0);

  return BUCKETS.map(({ label, min, max }) => ({
    bucket: label,
    count: overdueLoans.filter((loan) => {
      const days = overdueDays(loan.dueDate);
      return days >= min && days <= max;
    }).length,
  }));
}
