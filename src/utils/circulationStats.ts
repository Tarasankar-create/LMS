import { format, parseISO, subMonths, startOfMonth } from 'date-fns';
import type { Book, Loan } from '@/types';
import { BOOK_CATEGORIES } from '@/types';

export interface MonthlyCirculationPoint {
  month: string;
  issued: number;
  returned: number;
  renewals: number;
}

export function buildMonthlyCirculation(loans: Loan[], monthsBack = 6): MonthlyCirculationPoint[] {
  const now = new Date();
  const buckets: MonthlyCirculationPoint[] = Array.from({ length: monthsBack }, (_, i) => {
    const date = startOfMonth(subMonths(now, monthsBack - 1 - i));
    return { month: format(date, 'MMM'), issued: 0, returned: 0, renewals: 0 };
  });

  const monthKeys = Array.from({ length: monthsBack }, (_, i) =>
    format(startOfMonth(subMonths(now, monthsBack - 1 - i)), 'yyyy-MM'),
  );

  loans.forEach((loan) => {
    const issueKey = format(parseISO(loan.issueDate), 'yyyy-MM');
    const issueIndex = monthKeys.indexOf(issueKey);
    if (issueIndex !== -1) {
      buckets[issueIndex].issued += 1;
      if (loan.renewalCount > 0) buckets[issueIndex].renewals += 1;
    }
    if (loan.returnDate) {
      const returnKey = format(parseISO(loan.returnDate), 'yyyy-MM');
      const returnIndex = monthKeys.indexOf(returnKey);
      if (returnIndex !== -1) buckets[returnIndex].returned += 1;
    }
  });

  return buckets;
}

export interface CategoryDistributionPoint {
  category: string;
  count: number;
}

export function buildCategoryDistribution(books: Book[]): CategoryDistributionPoint[] {
  return BOOK_CATEGORIES.map((category) => ({
    category,
    count: books.filter((b) => b.category === category && b.status !== 'Retired').length,
  }));
}

export interface DepartmentUsagePoint {
  department: string;
  loans: number;
}

export function buildDepartmentUsage(
  loans: Loan[],
  members: { memberId: string; department: string }[],
): DepartmentUsagePoint[] {
  const deptByMember = new Map(members.map((m) => [m.memberId, m.department]));
  const counts = new Map<string, number>();

  loans.forEach((loan) => {
    const dept = deptByMember.get(loan.memberId);
    if (!dept) return;
    counts.set(dept, (counts.get(dept) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([department, count]) => ({ department, loans: count }))
    .sort((a, b) => b.loans - a.loans);
}
