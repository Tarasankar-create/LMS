import { useEffect, useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  BookOpen,
  Users,
  Calendar,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  X,
} from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ChartCard } from '@/components/common/ChartCard';
import { CategoryDistributionChart } from '@/components/charts/CategoryDistributionChart';
import { MonthlyCirculationChart } from '@/components/charts/MonthlyCirculationChart';
import { CategoryUsageChart } from '@/components/charts/DepartmentUsageChart';
import { useBooksStore } from '@/store/booksStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useFinesStore } from '@/store/finesStore';
import { useCopiesStore } from '@/store/copiesStore';
import { BOOK_CATEGORIES } from '@/types';
import { buildCategoryDistribution, buildMonthlyCirculation } from '@/utils/circulationStats';
import { exportToExcel } from '@/utils/excelExport';
import { formatCurrency } from '@/utils/currency';
import { formatDate, overdueDays, todayISO, addDaysISO } from '@/utils/date';
import { cn } from '@/utils/cn';

export const OFFICIAL_CLASSIFICATIONS = [
  'Science',
  'Commerce',
  'Arts',
  'Journals & Magazines',
] as const;

export type OfficialClassification = (typeof OFFICIAL_CLASSIFICATIONS)[number];

export function resolveBookClassification(book: {
  category?: string;
  classification?: string;
  department?: string;
}): OfficialClassification {
  if (
    book.category === 'Journals and Magazines' ||
    book.classification === 'Journals' ||
    book.classification === 'Current Affairs'
  ) {
    return 'Journals & Magazines';
  }
  if (book.category === 'Science' || book.classification === 'Stream - Science') return 'Science';
  if (book.category === 'Commerce') return 'Commerce';
  if (book.category === 'Arts' || book.classification === 'Stream - Arts') return 'Arts';

  const dept = (book.department ?? '').toLowerCase();
  if (['physics', 'chemistry', 'mathematics', 'botany', 'zoology'].some((d) => dept.includes(d))) return 'Science';
  if (['commerce', 'computer science', 'accounting', 'finance'].some((d) => dept.includes(d))) return 'Commerce';
  if (
    ['history', 'political science', 'odia', 'english', 'philosophy', 'sanskrit', 'sociology', 'education'].some(
      (d) => dept.includes(d),
    )
  ) {
    return 'Arts';
  }

  return 'Science';
}

export const CATALOG_TABS = [
  'Total Holdings',
  'Books by Category',
  'Department Holdings',
  'Available Books',
  'Asset Valuation',
  'Lost / Damaged / Withdrawn',
] as const;

export const ASSIGNMENT_TABS = [
  'Issue & Return Summary',
  'Daily Circulation',
  'Usage Report',
  'Currently Assigned Books',
  'Overdue Books',
  'Category-wise Usage',
  'Fine Collection',
  'Circulation Trends',
] as const;

export const USAGE_PRESET_OPTIONS = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last 180 Days', days: 180 },
  { label: 'Last 1 Year', days: 365 },
  { label: 'Last 3 Years', days: 1095 },
  { label: 'Last 5 Years', days: 1825 },
] as const;

export type CatalogTab = (typeof CATALOG_TABS)[number];
export type AssignmentTab = (typeof ASSIGNMENT_TABS)[number];
export type ReportTab = CatalogTab | AssignmentTab;

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Total Holdings');
  const [dailyFromDate, setDailyFromDate] = useState(() => addDaysISO(todayISO(), -30));
  const [dailyToDate, setDailyToDate] = useState(() => todayISO());
  const [dailySortOrder, setDailySortOrder] = useState<'desc' | 'asc'>('desc');
  const [usageFromDate, setUsageFromDate] = useState(() => addDaysISO(todayISO(), -365));
  const [usageToDate, setUsageToDate] = useState(() => todayISO());
  const [selectedClassificationDrilldown, setSelectedClassificationDrilldown] = useState<string>('All');

  const books = useBooksStore((s) => s.books);
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const fines = useFinesStore((s) => s.fines);
  const copies = useCopiesStore((s) => s.copies);

  // --- CATALOG VIEW DATA ---
  const holdingsByClassification = useMemo(() => {
    const lostDamagedByBookId = new Map<string, number>();
    copies.forEach((c) => {
      if (c.status === 'Lost' || c.status === 'Damaged' || c.status === 'Withdrawn') {
        lostDamagedByBookId.set(c.bookId, (lostDamagedByBookId.get(c.bookId) ?? 0) + 1);
      }
    });

    return OFFICIAL_CLASSIFICATIONS.map((classification) => {
      const matching = books.filter(
        (b) => b.status !== 'Retired' && resolveBookClassification(b) === classification,
      );

      const titles = matching.length;
      const totalCopies = matching.reduce((sum, b) => sum + b.totalCopies, 0);
      const availableCopies = matching.reduce((sum, b) => sum + b.availableCopies, 0);
      const issuedCopies = Math.max(0, totalCopies - availableCopies);
      const refTitles = matching.filter((b) => b.libraryUseOnly).length;
      const refCopies = matching
        .filter((b) => b.libraryUseOnly)
        .reduce((sum, b) => sum + b.totalCopies, 0);

      const lostDamagedCount = matching.reduce(
        (sum, b) => sum + (lostDamagedByBookId.get(b.id) ?? 0),
        0,
      );

      const totalValuation = matching.reduce((sum, b) => sum + (b.price ?? 0) * b.totalCopies, 0);
      const avgPrice = totalCopies > 0 ? Math.round(totalValuation / totalCopies) : 0;
      const utilizationRate = totalCopies > 0 ? ((issuedCopies / totalCopies) * 100).toFixed(1) : '0.0';

      const departments = Array.from(
        new Set(matching.map((b) => b.department).filter(Boolean)),
      ) as string[];

      return {
        classification,
        titles,
        totalCopies,
        availableCopies,
        issuedCopies,
        refTitles,
        refCopies,
        lostDamagedCount,
        totalValuation,
        avgPrice,
        utilizationRate,
        departments,
        books: matching,
      };
    });
  }, [books, copies]);

  const classificationTotals = useMemo(() => {
    const titles = holdingsByClassification.reduce((sum, r) => sum + r.titles, 0);
    const totalCopies = holdingsByClassification.reduce((sum, r) => sum + r.totalCopies, 0);
    const availableCopies = holdingsByClassification.reduce((sum, r) => sum + r.availableCopies, 0);
    const issuedCopies = holdingsByClassification.reduce((sum, r) => sum + r.issuedCopies, 0);
    const refTitles = holdingsByClassification.reduce((sum, r) => sum + r.refTitles, 0);
    const refCopies = holdingsByClassification.reduce((sum, r) => sum + r.refCopies, 0);
    const lostDamagedCount = holdingsByClassification.reduce((sum, r) => sum + r.lostDamagedCount, 0);
    const totalValuation = holdingsByClassification.reduce((sum, r) => sum + r.totalValuation, 0);
    const avgPrice = totalCopies > 0 ? Math.round(totalValuation / totalCopies) : 0;
    const utilizationRate = totalCopies > 0 ? ((issuedCopies / totalCopies) * 100).toFixed(1) : '0.0';

    return {
      titles,
      totalCopies,
      availableCopies,
      issuedCopies,
      refTitles,
      refCopies,
      lostDamagedCount,
      totalValuation,
      avgPrice,
      utilizationRate,
    };
  }, [holdingsByClassification]);

  const drilldownBooks = useMemo(() => {
    const active = books.filter((b) => b.status !== 'Retired');
    if (selectedClassificationDrilldown === 'All') return active;
    return active.filter((b) => resolveBookClassification(b) === selectedClassificationDrilldown);
  }, [books, selectedClassificationDrilldown]);

  const categoryDistribution = useMemo(() => buildCategoryDistribution(books), [books]);

  const departmentHoldings = useMemo(() => {
    const depts = ['Science', 'Commerce', 'Arts', 'Journals and Magazines'];
    return depts.map((d) => {
      const matching = books.filter(
        (b) =>
          b.status !== 'Retired' &&
          (b.category === d ||
            (b.department && b.department.toLowerCase().includes(d.toLowerCase())) ||
            (d === 'Science' && ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology'].includes(b.department ?? '')) ||
            (d === 'Arts' && ['History', 'Political Science', 'Odia', 'English'].includes(b.department ?? ''))),
      );
      const totalCopies = matching.reduce((sum, b) => sum + b.totalCopies, 0);
      const availableCopies = matching.reduce((sum, b) => sum + b.availableCopies, 0);
      return {
        department: d,
        titles: matching.length,
        totalCopies,
        availableCopies,
        issuedCopies: Math.max(0, totalCopies - availableCopies),
      };
    });
  }, [books]);

  const availableBooksList = useMemo(
    () => books.filter((b) => b.status !== 'Retired' && b.availableCopies > 0),
    [books],
  );

  const assetValuation = useMemo(() => {
    return BOOK_CATEGORIES.map((cat) => {
      const catBooks = books.filter((b) => b.category === cat && b.status !== 'Retired');
      const totalCopies = catBooks.reduce((sum, b) => sum + b.totalCopies, 0);
      const totalValue = catBooks.reduce((sum, b) => sum + (b.price ?? 0) * b.totalCopies, 0);
      const avgPrice = totalCopies > 0 ? Math.round(totalValue / totalCopies) : 0;
      return {
        category: cat,
        titles: catBooks.length,
        totalCopies,
        totalValue,
        avgPrice,
      };
    });
  }, [books]);

  const totalAssetValue = useMemo(
    () => assetValuation.reduce((sum, r) => sum + r.totalValue, 0),
    [assetValuation],
  );

  const lostDamagedWithdrawnCopies = useMemo(() => {
    const bookMap = new Map(books.map((b) => [b.accessionNumber, b.title]));
    const bookIdMap = new Map(books.map((b) => [b.id, b.title]));
    return copies
      .filter((c) => c.status === 'Lost' || c.status === 'Damaged' || c.status === 'Withdrawn')
      .map((c) => ({
        barcode: c.barcode,
        accessionNumber: c.accessionNumber,
        bookTitle: bookMap.get(c.accessionNumber) ?? bookIdMap.get(c.bookId) ?? 'Unknown Title',
        status: c.status,
        statusChangedDate: c.statusChangedDate ?? '-',
        reason: c.statusReason ?? '-',
      }));
  }, [copies, books]);

  // --- ASSIGNMENT VIEW DATA ---
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === 'Active'),
    [loans],
  );

  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === 'Active' && overdueDays(l.dueDate) > 0),
    [loans],
  );

  const collectedFines = useMemo(() => {
    const memberMap = new Map(members.map((m) => [m.memberId, m]));
    const loanMap = new Map(loans.map((l) => [l.id, l.bookTitle]));
    return fines
      .filter((f) => f.status === 'Collected')
      .map((f) => {
        const mem = memberMap.get(f.memberId);
        return {
          ...f,
          memberName: mem?.name ?? f.memberId,
          department: mem?.department ?? '-',
          bookTitle: loanMap.get(f.loanId) ?? '-',
        };
      });
  }, [fines, members, loans]);

  const collectedTotal = useMemo(
    () => collectedFines.reduce((sum, f) => sum + f.amount, 0),
    [collectedFines],
  );

  const issueReturnSummary = useMemo(() => {
    const issued = loans.length;
    const returned = loans.filter((l) => l.status === 'Returned').length;
    const renewed = loans.filter((l) => l.renewalCount > 0).length;
    const active = loans.filter((l) => l.status === 'Active').length;
    return { issued, returned, renewed, active };
  }, [loans]);

  const dailyCirculationData = useMemo(() => {
    if (!dailyFromDate || !dailyToDate) return [];
    const start = dailyFromDate <= dailyToDate ? dailyFromDate : dailyToDate;
    const end = dailyFromDate <= dailyToDate ? dailyToDate : dailyFromDate;

    const startDate = parseISO(start);
    const endDate = parseISO(end);
    if (!isValid(startDate) || !isValid(endDate)) return [];

    const totalDays = differenceInCalendarDays(endDate, startDate);
    const maxDays = Math.min(Math.max(0, totalDays), 365);

    const issueMap = new Map<string, number>();
    const returnMap = new Map<string, number>();
    const renewalMap = new Map<string, number>();

    loans.forEach((loan) => {
      const issueDay = loan.issueDate ? loan.issueDate.slice(0, 10) : '';
      if (issueDay >= start && issueDay <= end) {
        issueMap.set(issueDay, (issueMap.get(issueDay) ?? 0) + 1);
        if (loan.renewalCount > 0) {
          renewalMap.set(issueDay, (renewalMap.get(issueDay) ?? 0) + 1);
        }
      }
      if (loan.returnDate) {
        const returnDay = loan.returnDate.slice(0, 10);
        if (returnDay >= start && returnDay <= end) {
          returnMap.set(returnDay, (returnMap.get(returnDay) ?? 0) + 1);
        }
      }
    });

    const rows: {
      date: string;
      issued: number;
      returned: number;
      renewals: number;
      total: number;
    }[] = [];

    for (let i = 0; i <= maxDays; i += 1) {
      const dayISO = format(addDays(startDate, i), 'yyyy-MM-dd');
      const issued = issueMap.get(dayISO) ?? 0;
      const returned = returnMap.get(dayISO) ?? 0;
      const renewals = renewalMap.get(dayISO) ?? 0;
      rows.push({
        date: dayISO,
        issued,
        returned,
        renewals,
        total: issued + returned,
      });
    }

    rows.sort((a, b) => {
      return dailySortOrder === 'asc'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });

    return rows;
  }, [loans, dailyFromDate, dailyToDate, dailySortOrder]);

  const dailyTotals = useMemo(() => {
    return dailyCirculationData.reduce(
      (acc, r) => ({
        issued: acc.issued + r.issued,
        returned: acc.returned + r.returned,
        renewals: acc.renewals + r.renewals,
        total: acc.total + r.total,
      }),
      { issued: 0, returned: 0, renewals: 0, total: 0 },
    );
  }, [dailyCirculationData]);

  const categoryUsage = useMemo(() => {
    const bookMap = new Map(books.map((b) => [b.id, b]));
    const bookAccMap = new Map(books.map((b) => [b.accessionNumber, b]));

    const counts: Record<'Science' | 'Commerce' | 'Arts' | 'Journals', number> = {
      Science: 0,
      Commerce: 0,
      Arts: 0,
      Journals: 0,
    };

    loans.forEach((loan) => {
      const book = bookMap.get(loan.bookId) ?? bookAccMap.get(loan.accessionNumber);
      if (book) {
        const cls = resolveBookClassification(book);
        if (cls === 'Science') counts.Science += 1;
        else if (cls === 'Commerce') counts.Commerce += 1;
        else if (cls === 'Arts') counts.Arts += 1;
        else if (
          cls === 'Journals & Magazines' ||
          book.category === 'Journals and Magazines' ||
          book.classification === 'Journals'
        ) {
          counts.Journals += 1;
        } else {
          counts.Science += 1;
        }
      } else {
        const mem = members.find((m) => m.memberId === loan.memberId);
        const dept = (mem?.department ?? '').toLowerCase();
        if (dept.includes('commerce')) counts.Commerce += 1;
        else if (dept.includes('art') || dept.includes('history') || dept.includes('polity')) counts.Arts += 1;
        else counts.Science += 1;
      }
    });

    return (['Science', 'Commerce', 'Arts', 'Journals'] as const).map((cat) => ({
      category: cat,
      department: cat,
      loans: counts[cat],
    }));
  }, [loans, books, members]);
  const monthly12 = useMemo(() => buildMonthlyCirculation(loans, 12), [loans]);

  const usageStats = useMemo(() => {
    const from = usageFromDate || todayISO();
    const to = usageToDate || todayISO();
    const start = from <= to ? from : to;
    const end = from <= to ? to : from;

    const issueCounts = new Map<string, number>();
    let totalIssuesInWindow = 0;

    loans.forEach((loan) => {
      const issueDay = loan.issueDate ? loan.issueDate.slice(0, 10) : '';
      if (issueDay >= start && issueDay <= end) {
        totalIssuesInWindow += 1;
        issueCounts.set(loan.bookId, (issueCounts.get(loan.bookId) ?? 0) + 1);
      }
    });

    const activeBooks = books.filter((b) => b.status !== 'Retired');

    const mappedBooks = activeBooks.map((b) => ({
      bookId: b.id,
      accessionNumber: b.accessionNumber,
      title: b.title,
      author: b.author,
      category: b.category,
      department: b.department ?? '-',
      shelfLocation: b.shelfLocation,
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
      issueCount: issueCounts.get(b.id) ?? 0,
    }));

    // Most-issued: descending by issueCount, ties broken by title
    const mostIssued = [...mappedBooks].sort((a, b) => b.issueCount - a.issueCount || a.title.localeCompare(b.title));

    // Least-issued: ascending by issueCount, ties broken by title
    const leastIssued = [...mappedBooks].sort((a, b) => a.issueCount - b.issueCount || a.title.localeCompare(b.title));

    const circulatingCount = mappedBooks.filter((b) => b.issueCount > 0).length;
    const zeroCirculationCount = mappedBooks.filter((b) => b.issueCount === 0).length;

    return {
      start,
      end,
      totalTitles: activeBooks.length,
      circulatingCount,
      zeroCirculationCount,
      totalIssuesInWindow,
      mostIssued,
      leastIssued,
    };
  }, [books, loans, usageFromDate, usageToDate]);

  function memberInfo(memberId: string) {
    const m = members.find((mem) => mem.memberId === memberId);
    return {
      name: m?.name ?? memberId,
      roll: m?.rollNumber ?? '-',
      department: m?.department ?? '-',
    };
  }

  function handlePrint() {
    window.print();
  }

  function handleExportExcel() {
    switch (activeTab) {
      case 'Total Holdings':
        exportToExcel(
          'holdings-by-classification',
          [
            { header: 'Classification', accessor: (r: (typeof holdingsByClassification)[number]) => r.classification },
            { header: 'Unique Titles', accessor: (r) => r.titles },
            { header: 'Total Physical Copies', accessor: (r) => r.totalCopies },
            { header: 'Available on Shelf', accessor: (r) => r.availableCopies },
            { header: 'Currently Issued', accessor: (r) => r.issuedCopies },
            { header: 'Reference Only Copies', accessor: (r) => r.refCopies },
            { header: 'Lost / Damaged / Withdrawn', accessor: (r) => r.lostDamagedCount },
            { header: 'Total Valuation (INR)', accessor: (r) => r.totalValuation },
            { header: 'Average Price (INR)', accessor: (r) => r.avgPrice },
            { header: 'Utilization Rate (%)', accessor: (r) => `${r.utilizationRate}%` },
            { header: 'Departments Covered', accessor: (r) => r.departments.join(', ') || '-' },
          ],
          holdingsByClassification,
        );
        break;
      case 'Department Holdings':
        exportToExcel(
          'department-holdings',
          [
            { header: 'Department', accessor: (r: (typeof departmentHoldings)[number]) => r.department },
            { header: 'Titles', accessor: (r) => r.titles },
            { header: 'Total Copies', accessor: (r) => r.totalCopies },
            { header: 'Available Copies', accessor: (r) => r.availableCopies },
            { header: 'Issued Copies', accessor: (r) => r.issuedCopies },
          ],
          departmentHoldings,
        );
        break;
      case 'Available Books':
        exportToExcel(
          'available-books',
          [
            { header: 'Accession No.', accessor: (b) => b.accessionNumber },
            { header: 'Title', accessor: (b) => b.title },
            { header: 'Author', accessor: (b) => b.author },
            { header: 'Category', accessor: (b) => b.category },
            { header: 'Department', accessor: (b) => b.department ?? '-' },
            { header: 'Shelf', accessor: (b) => b.shelfLocation },
            { header: 'Available', accessor: (b) => b.availableCopies },
          ],
          availableBooksList,
        );
        break;
      case 'Asset Valuation':
        exportToExcel(
          'asset-valuation',
          [
            { header: 'Category', accessor: (r) => r.category },
            { header: 'Titles', accessor: (r) => r.titles },
            { header: 'Total Copies', accessor: (r) => r.totalCopies },
            { header: 'Average Price', accessor: (r) => r.avgPrice },
            { header: 'Total Value', accessor: (r) => r.totalValue },
          ],
          assetValuation,
        );
        break;
      case 'Lost / Damaged / Withdrawn':
        exportToExcel(
          'lost-damaged-withdrawn-copies',
          [
            { header: 'Barcode', accessor: (r: (typeof lostDamagedWithdrawnCopies)[number]) => r.barcode },
            { header: 'Accession No.', accessor: (r) => r.accessionNumber },
            { header: 'Book Title', accessor: (r) => r.bookTitle },
            { header: 'Status', accessor: (r) => r.status },
            { header: 'Status Changed Date', accessor: (r) => (r.statusChangedDate !== '-' ? formatDate(r.statusChangedDate) : '-') },
            { header: 'Reason / Remarks', accessor: (r) => r.reason },
          ],
          lostDamagedWithdrawnCopies,
        );
        break;
      case 'Daily Circulation':
        exportToExcel(
          `daily-circulation-${dailyFromDate}-to-${dailyToDate}`,
          [
            { header: 'Date', accessor: (r: (typeof dailyCirculationData)[number]) => formatDate(r.date) },
            { header: 'Date (YYYY-MM-DD)', accessor: (r) => r.date },
            { header: 'Books Issued', accessor: (r) => r.issued },
            { header: 'Books Returned', accessor: (r) => r.returned },
            { header: 'Renewals', accessor: (r) => r.renewals },
            { header: 'Total Transactions', accessor: (r) => r.total },
          ],
          dailyCirculationData,
        );
        break;
      case 'Usage Report':
        exportToExcel(
          `usage-report-${usageFromDate}-to-${usageToDate}`,
          [
            { header: 'Accession No.', accessor: (b: (typeof usageStats.mostIssued)[number]) => b.accessionNumber },
            { header: 'Book Title', accessor: (b) => b.title },
            { header: 'Author', accessor: (b) => b.author },
            { header: 'Category', accessor: (b) => b.category },
            { header: 'Department', accessor: (b) => b.department },
            { header: 'Shelf Location', accessor: (b) => b.shelfLocation },
            { header: 'Total Copies', accessor: (b) => b.totalCopies },
            { header: 'Available Copies', accessor: (b) => b.availableCopies },
            { header: 'Times Issued (In Period)', accessor: (b) => b.issueCount },
          ],
          usageStats.mostIssued,
        );
        break;
      case 'Currently Assigned Books':
        exportToExcel(
          'assigned-books',
          [
            { header: 'Member', accessor: (l) => memberInfo(l.memberId).name },
            { header: 'Roll No.', accessor: (l) => memberInfo(l.memberId).roll },
            { header: 'Department', accessor: (l) => memberInfo(l.memberId).department },
            { header: 'Book Title', accessor: (l) => l.bookTitle },
            { header: 'Accession No.', accessor: (l) => l.accessionNumber },
            { header: 'Issue Date', accessor: (l) => l.issueDate },
            { header: 'Due Date', accessor: (l) => l.dueDate },
          ],
          activeLoans,
        );
        break;
      case 'Overdue Books':
        exportToExcel(
          'overdue-books',
          [
            { header: 'Member', accessor: (l: (typeof overdueLoans)[number]) => memberInfo(l.memberId).name },
            { header: 'Roll No.', accessor: (l) => memberInfo(l.memberId).roll },
            { header: 'Department', accessor: (l) => memberInfo(l.memberId).department },
            { header: 'Book Title', accessor: (l) => l.bookTitle },
            { header: 'Accession No.', accessor: (l) => l.accessionNumber },
            { header: 'Due Date', accessor: (l) => l.dueDate },
            { header: 'Days Overdue', accessor: (l) => overdueDays(l.dueDate) },
          ],
          overdueLoans,
        );
        break;
      case 'Fine Collection':
        exportToExcel(
          'fine-collection',
          [
            { header: 'Member', accessor: (f: (typeof collectedFines)[number]) => f.memberName },
            { header: 'Department', accessor: (f: (typeof collectedFines)[number]) => f.department },
            { header: 'Book Title', accessor: (f) => f.bookTitle },
            { header: 'Amount', accessor: (f) => f.amount },
            { header: 'Collected Date', accessor: (f) => f.collectedDate ?? '' },
          ],
          collectedFines,
        );
        break;
      case 'Category-wise Usage':
        exportToExcel(
          'category-usage',
          [
            { header: 'Category', accessor: (d: (typeof categoryUsage)[number]) => d.category },
            { header: 'Books Borrowed', accessor: (d) => d.loans },
          ],
          categoryUsage,
        );
        break;
      default:
        exportToExcel(
          'circulation-summary',
          [
            { header: 'Month', accessor: (m: (typeof monthly12)[number]) => m.month },
            { header: 'Issued', accessor: (m) => m.issued },
            { header: 'Returned', accessor: (m) => m.returned },
            { header: 'Renewals', accessor: (m) => m.renewals },
          ],
          monthly12,
        );
    }
  }

  return (
    <div className="print-area">
      <PageHeader
        title="Reports"
        description="Compliance-ready reports for college administration."
        actions={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-4" /> Export Excel
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" /> Print / Export PDF
            </Button>
          </div>
        }
      />

      {/* TWO ROWS OF REPORT CATEGORIES */}
      <div className="no-print mb-6 space-y-3 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
        {/* ROW 1: CATALOG VIEW */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 lg:w-44 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
              <BookOpen className="size-3.5" />
              Catalog View
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATALOG_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'border border-secondary-200 bg-secondary-50/70 text-secondary-700 hover:bg-secondary-100 hover:text-ink',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-secondary-100" />

        {/* ROW 2: ASSIGNMENT VIEW */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 lg:w-44 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              <Users className="size-3.5" />
              Assignment View
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ASSIGNMENT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors',
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-secondary-200 bg-secondary-50/70 text-secondary-700 hover:bg-secondary-100 hover:text-ink',
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 className="mb-3 hidden text-lg font-semibold text-ink print:block">{activeTab}</h2>

      {/* --- CATALOG VIEW TAB CONTENTS --- */}
      {activeTab === 'Total Holdings' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Unique Titles</p>
              <p className="mt-1 text-xl font-bold text-ink">{classificationTotals.titles}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Physical Copies</p>
              <p className="mt-1 text-xl font-bold text-primary-700">{classificationTotals.totalCopies}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Available on Shelf</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{classificationTotals.availableCopies}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Currently Issued</p>
              <p className="mt-1 text-xl font-bold text-blue-600">{classificationTotals.issuedCopies}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Reference Copies</p>
              <p className="mt-1 text-xl font-bold text-purple-600">{classificationTotals.refCopies}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-3.5 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Total Asset Value</p>
              <p className="mt-1 text-xl font-bold text-ink">{formatCurrency(classificationTotals.totalValuation)}</p>
            </div>
          </div>

          {/* Comprehensive Holdings by Classification Table */}
          <ChartCard
            title="Library Holdings by Classification (Official Scheme)"
            description="Comprehensive breakdown across streams: Science, Commerce, Arts, and Journals & Magazines."
          >
            <SimpleTable
              columns={[
                'Classification',
                'Unique Titles',
                'Total Copies',
                'Available on Shelf',
                'Currently Issued',
                'Reference Only',
                'Lost / Damaged',
                'Total Valuation',
                'Avg Price',
                'Circulation %',
              ]}
              rows={[
                ...holdingsByClassification.map((r) => [
                  r.classification,
                  r.titles,
                  r.totalCopies,
                  r.availableCopies,
                  r.issuedCopies,
                  r.refCopies > 0 ? `${r.refCopies} (${r.refTitles} tit.)` : '0',
                  r.lostDamagedCount,
                  formatCurrency(r.totalValuation),
                  formatCurrency(r.avgPrice),
                  `${r.utilizationRate}%`,
                ]),
                [
                  'Total/Overall',
                  classificationTotals.titles,
                  classificationTotals.totalCopies,
                  classificationTotals.availableCopies,
                  classificationTotals.issuedCopies,
                  classificationTotals.refCopies > 0
                    ? `${classificationTotals.refCopies} (${classificationTotals.refTitles} tit.)`
                    : '0',
                  classificationTotals.lostDamagedCount,
                  formatCurrency(classificationTotals.totalValuation),
                  formatCurrency(classificationTotals.avgPrice),
                  `${classificationTotals.utilizationRate}%`,
                ],
              ]}
              showPagination={false}
              enableFilters={false}
            />
          </ChartCard>

          {/* Classification Title Explorer Drill-Down */}
          <ChartCard
            title="Title-Level Catalogue Explorer by Classification"
            description="Inspect individual books, shelf locations, and copies assigned to each classification (10 titles per page)."
            actions={
              <div className="no-print flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedClassificationDrilldown('All')}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    selectedClassificationDrilldown === 'All'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'border border-secondary-200 bg-secondary-50 text-secondary-700 hover:bg-secondary-100',
                  )}
                >
                  All ({books.filter((b) => b.status !== 'Retired').length})
                </button>
                {OFFICIAL_CLASSIFICATIONS.map((c) => {
                  const count = books.filter(
                    (b) => b.status !== 'Retired' && resolveBookClassification(b) === c,
                  ).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedClassificationDrilldown(c)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        selectedClassificationDrilldown === c
                          ? 'bg-primary-600 text-white shadow-2xs'
                          : 'border border-secondary-200 bg-secondary-50 text-secondary-700 hover:bg-secondary-100',
                      )}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
            }
          >
            <SimpleTable
              columns={[
                'Accession No.',
                'Book Title',
                'Author',
                'Classification',
                'Department',
                'Shelf Location',
                'Circulation Type',
                'Available / Total',
                'Price',
              ]}
              rows={drilldownBooks.map((b) => [
                b.accessionNumber,
                b.title,
                b.author,
                resolveBookClassification(b),
                b.department ?? '-',
                b.shelfLocation,
                b.libraryUseOnly ? 'Reference Only' : 'Circulating',
                `${b.availableCopies} / ${b.totalCopies}`,
                b.price ? formatCurrency(b.price) : '-',
              ])}
            />
          </ChartCard>
        </div>
      )}

      {activeTab === 'Books by Category' && (
        <ChartCard title="Books Distribution by Category">
          <CategoryDistributionChart data={categoryDistribution} />
        </ChartCard>
      )}

      {activeTab === 'Department Holdings' && (
        <ChartCard title="Holdings by Stream & Department">
          <SimpleTable
            columns={['Stream / Department', 'Titles', 'Total Copies', 'Available Copies', 'Issued Out']}
            rows={departmentHoldings.map((r) => [
              r.department,
              r.titles,
              r.totalCopies,
              r.availableCopies,
              r.issuedCopies,
            ])}
          />
        </ChartCard>
      )}

      {activeTab === 'Available Books' && (
        <ChartCard title={`Available Books on Shelf (${availableBooksList.length} shown)`}>
          <SimpleTable
            columns={['Accession No.', 'Title', 'Author', 'Category', 'Department', 'Shelf Location', 'Available Copies']}
            rows={availableBooksList.map((b) => [
              b.accessionNumber,
              b.title,
              b.author,
              b.category,
              b.department ?? '-',
              b.shelfLocation,
              b.availableCopies,
            ])}
          />
        </ChartCard>
      )}

      {activeTab === 'Asset Valuation' && (
        <ChartCard title={`Library Asset Valuation — Total ${formatCurrency(totalAssetValue)}`}>
          <SimpleTable
            columns={['Category', 'Titles', 'Total Copies', 'Avg Price', 'Total Asset Value']}
            rows={assetValuation.map((r) => [
              r.category,
              r.titles,
              r.totalCopies,
              formatCurrency(r.avgPrice),
              formatCurrency(r.totalValue),
            ])}
          />
        </ChartCard>
      )}

      {activeTab === 'Lost / Damaged / Withdrawn' && (
        <ChartCard title={`Lost, Damaged & Withdrawn Copies (${lostDamagedWithdrawnCopies.length} items)`}>
          <SimpleTable
            columns={['Barcode', 'Accession No.', 'Book Title', 'Status', 'Status Changed Date', 'Reason / Remarks']}
            rows={lostDamagedWithdrawnCopies.map((c) => [
              c.barcode,
              c.accessionNumber,
              c.bookTitle,
              c.status,
              c.statusChangedDate !== '-' ? formatDate(c.statusChangedDate) : '-',
              c.reason,
            ])}
          />
        </ChartCard>
      )}

      {/* --- ASSIGNMENT VIEW TAB CONTENTS --- */}
      {activeTab === 'Issue & Return Summary' && (
        <ChartCard title="Issue & Return Summary (All Time)">
          <SimpleTable
            columns={['Metric', 'Count']}
            rows={[
              ['Total Books Issued', issueReturnSummary.issued],
              ['Total Books Returned', issueReturnSummary.returned],
              ['Currently Active Loans', issueReturnSummary.active],
              ['Loans Renewed', issueReturnSummary.renewed],
            ]}
          />
        </ChartCard>
      )}

      {activeTab === 'Daily Circulation' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="size-4 text-primary-600" />
              <span className="text-xs font-semibold text-ink">
                Active Date Range: <span className="font-bold text-primary-700">{formatDate(dailyFromDate)} — {formatDate(dailyToDate)}</span>
              </span>
              <span className="text-xs text-secondary-500">
                · Sorted: {dailySortOrder === 'desc' ? 'Newest First (Descending)' : 'Oldest First (Ascending)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-secondary-500 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => {
                  setDailyFromDate(addDaysISO(todayISO(), -7));
                  setDailyToDate(todayISO());
                }}
                className="rounded-md border border-secondary-200 bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setDailyFromDate(addDaysISO(todayISO(), -30));
                  setDailyToDate(todayISO());
                }}
                className="rounded-md border border-secondary-200 bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setDailyFromDate(addDaysISO(todayISO(), -90));
                  setDailyToDate(todayISO());
                }}
                className="rounded-md border border-secondary-200 bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
              >
                Last 90 Days
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Books Issued</p>
              <p className="mt-1 text-xl font-bold text-ink">{dailyTotals.issued}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Books Returned</p>
              <p className="mt-1 text-xl font-bold text-ink">{dailyTotals.returned}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Renewals</p>
              <p className="mt-1 text-xl font-bold text-ink">{dailyTotals.renewals}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Total Transactions</p>
              <p className="mt-1 text-xl font-bold text-primary-700">{dailyTotals.total}</p>
            </div>
          </div>

          <ChartCard
            title={`Daily Circulation Log (${formatDate(dailyFromDate)} — ${formatDate(dailyToDate)}) · ${dailySortOrder === 'desc' ? 'Newest to Oldest (Descending)' : 'Oldest to Newest (Ascending)'}`}
          >
            <SimpleTable
              columns={['Date', 'Books Issued', 'Books Returned', 'Renewals', 'Total Transactions']}
              rows={dailyCirculationData.map((d) => [
                formatDate(d.date),
                d.issued,
                d.returned,
                d.renewals,
                d.total,
              ])}
              dateConfig={{
                fromDate: dailyFromDate,
                toDate: dailyToDate,
                onApplyDateRange: (from, to) => {
                  setDailyFromDate(from);
                  setDailyToDate(to);
                },
                presets: [
                  { label: 'Last 7 Days', days: 7 },
                  { label: 'Last 30 Days', days: 30 },
                  { label: 'Last 90 Days', days: 90 },
                ],
              }}
              defaultSortColumn="Date"
              defaultSortOrder={dailySortOrder}
              onSortChange={(_col, order) => setDailySortOrder(order)}
            />
          </ChartCard>
        </div>
      )}

      {activeTab === 'Usage Report' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="size-4 text-primary-600" />
              <span className="text-xs font-semibold text-ink">
                Active Calendar Window: <span className="font-bold text-primary-700">{formatDate(usageStats.start)} — {formatDate(usageStats.end)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-secondary-500 mr-1">Quick:</span>
              {USAGE_PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setUsageFromDate(addDaysISO(todayISO(), -opt.days));
                    setUsageToDate(todayISO());
                  }}
                  className="rounded-md border border-secondary-200 bg-secondary-50 px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Catalog Titles</p>
              <p className="mt-1 text-xl font-bold text-ink">{usageStats.totalTitles}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Total Issues in Window</p>
              <p className="mt-1 text-xl font-bold text-primary-700">{usageStats.totalIssuesInWindow}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Circulating Titles</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{usageStats.circulatingCount}</p>
            </div>
            <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-2xs">
              <p className="text-xs font-medium text-secondary-500">Zero Circulation</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{usageStats.zeroCirculationCount}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title={`Most-Issued Titles (${formatDate(usageStats.start)} — ${formatDate(usageStats.end)})`}
              description="Top borrowed books ranked by issues during the selected date range."
            >
              <SimpleTable
                columns={['Rank', 'Accession No.', 'Book Title', 'Author', 'Category', 'Department', 'Total Copies', 'Times Issued']}
                rows={usageStats.mostIssued.map((b, idx) => [
                  `#${idx + 1}`,
                  b.accessionNumber,
                  b.title,
                  b.author,
                  b.category,
                  b.department,
                  b.totalCopies,
                  b.issueCount,
                ])}
                dateConfig={{
                  fromDate: usageFromDate,
                  toDate: usageToDate,
                  onApplyDateRange: (from, to) => {
                    setUsageFromDate(from);
                    setUsageToDate(to);
                  },
                  presets: USAGE_PRESET_OPTIONS.map((p) => ({ label: p.label, days: p.days })),
                }}
              />
            </ChartCard>

            <ChartCard
              title={`Least-Issued Titles (${formatDate(usageStats.start)} — ${formatDate(usageStats.end)})`}
              description="Books with lowest or zero circulation during the date range (useful for collection evaluation & weed-out decisions)."
            >
              <SimpleTable
                columns={['Accession No.', 'Book Title', 'Author', 'Category', 'Department', 'Shelf Location', 'Available Copies', 'Times Issued']}
                rows={usageStats.leastIssued.map((b) => [
                  b.accessionNumber,
                  b.title,
                  b.author,
                  b.category,
                  b.department,
                  b.shelfLocation,
                  b.availableCopies,
                  b.issueCount,
                ])}
                dateConfig={{
                  fromDate: usageFromDate,
                  toDate: usageToDate,
                  onApplyDateRange: (from, to) => {
                    setUsageFromDate(from);
                    setUsageToDate(to);
                  },
                  presets: USAGE_PRESET_OPTIONS.map((p) => ({ label: p.label, days: p.days })),
                }}
              />
            </ChartCard>
          </div>
        </div>
      )}

      {activeTab === 'Currently Assigned Books' && (
        <ChartCard title={`Currently Assigned Books (${activeLoans.length} active loans)`}>
          <SimpleTable
            columns={['Member Name', 'Roll No.', 'Department', 'Book Title', 'Accession No.', 'Issued Date', 'Due Date']}
            rows={activeLoans.map((l) => {
              const info = memberInfo(l.memberId);
              return [
                info.name,
                info.roll,
                info.department,
                l.bookTitle,
                l.accessionNumber,
                formatDate(l.issueDate),
                formatDate(l.dueDate),
              ];
            })}
          />
        </ChartCard>
      )}

      {activeTab === 'Overdue Books' && (
        <ChartCard title={`Overdue Books Report (${overdueLoans.length})`}>
          <SimpleTable
            columns={['Member Name', 'Roll No.', 'Department', 'Book Title', 'Accession No.', 'Due Date', 'Days Overdue']}
            rows={overdueLoans.map((l) => {
              const info = memberInfo(l.memberId);
              return [
                info.name,
                info.roll,
                info.department,
                l.bookTitle,
                l.accessionNumber,
                formatDate(l.dueDate),
                `${overdueDays(l.dueDate)} days`,
              ];
            })}
          />
        </ChartCard>
      )}

      {activeTab === 'Category-wise Usage' && (
        <ChartCard
          title="Category-wise Student Library Usage"
          description="Total books borrowed across Science, Commerce, Arts, and Journals."
        >
          <CategoryUsageChart data={categoryUsage} />
        </ChartCard>
      )}

      {activeTab === 'Fine Collection' && (
        <ChartCard title={`Fine Collection Report — Total ${formatCurrency(collectedTotal)}`}>
          <SimpleTable
            columns={['Member', 'Department', 'Book Title', 'Amount', 'Collected Date']}
            rows={collectedFines.map((f) => [
              f.memberName,
              f.department,
              f.bookTitle,
              formatCurrency(f.amount),
              formatDate(f.collectedDate),
            ])}
          />
        </ChartCard>
      )}

      {activeTab === 'Circulation Trends' && (
        <ChartCard title="Circulation Trends (Last 12 Months)">
          <MonthlyCirculationChart data={monthly12} />
        </ChartCard>
      )}
    </div>
  );
}

interface TableDateConfig {
  fromDate?: string;
  toDate?: string;
  onApplyDateRange?: (from: string, to: string) => void;
  presets?: { label: string; days: number }[];
}

interface SimpleTableProps {
  columns: string[];
  rows: (string | number)[][];
  pageSize?: number;
  showPagination?: boolean;
  enableFilters?: boolean;
  dateConfig?: TableDateConfig;
  defaultSortColumn?: string;
  defaultSortOrder?: 'asc' | 'desc';
  onSortChange?: (column: string, order: 'asc' | 'desc') => void;
}

function extractDateISO(val: unknown): string | null {
  if (typeof val !== 'string' || !val.trim() || val === '-') return null;
  const str = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function compareCells(a: string | number, b: string | number, order: 'asc' | 'desc'): number {
  if (a === b) return 0;
  if (a === '-' || a === null || a === undefined) return 1;
  if (b === '-' || b === null || b === undefined) return -1;

  if (typeof a === 'number' && typeof b === 'number') {
    return order === 'asc' ? a - b : b - a;
  }

  const strA = String(a).trim();
  const strB = String(b).trim();

  // Strip ranking hashes like #1, currency like ₹450, commas, percentages
  const cleanA = strA.replace(/^[#]/, '').replace(/[₹$,%]/g, '').trim();
  const cleanB = strB.replace(/^[#]/, '').replace(/[₹$,%]/g, '').trim();
  const numA = Number(cleanA);
  const numB = Number(cleanB);
  if (!isNaN(numA) && !isNaN(numB) && cleanA !== '' && cleanB !== '') {
    return order === 'asc' ? numA - numB : numB - numA;
  }

  // Dates
  const dateA = extractDateISO(strA);
  const dateB = extractDateISO(strB);
  if (dateA && dateB) {
    return order === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  }

  // Strings
  const cmp = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
  return order === 'asc' ? cmp : -cmp;
}

function SimpleTable({
  columns,
  rows,
  pageSize = 10,
  showPagination = true,
  enableFilters = true,
  dateConfig,
  defaultSortColumn,
  defaultSortOrder = 'asc',
  onSortChange,
}: SimpleTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Applied Filter states
  const [department, setDepartment] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [targetDateColName, setTargetDateColName] = useState('');
  const [fromDate, setFromDate] = useState(dateConfig?.fromDate ?? '');
  const [toDate, setToDate] = useState(dateConfig?.toDate ?? '');
  const [sortColumn, setSortColumn] = useState(defaultSortColumn ?? (columns[0] || ''));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultSortOrder);

  // Sync external dateConfig
  useEffect(() => {
    if (dateConfig?.fromDate !== undefined) setFromDate(dateConfig.fromDate);
  }, [dateConfig?.fromDate]);

  useEffect(() => {
    if (dateConfig?.toDate !== undefined) setToDate(dateConfig.toDate);
  }, [dateConfig?.toDate]);

  useEffect(() => {
    if (defaultSortColumn !== undefined) setSortColumn(defaultSortColumn);
  }, [defaultSortColumn]);

  useEffect(() => {
    if (defaultSortOrder !== undefined) setSortOrder(defaultSortOrder);
  }, [defaultSortOrder]);

  // Modal temporary states
  const [tempDepartment, setTempDepartment] = useState('');
  const [tempAuthor, setTempAuthor] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [tempDateColName, setTempDateColName] = useState('');
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');
  const [tempSortColumn, setTempSortColumn] = useState('');
  const [tempSortOrder, setTempSortOrder] = useState<'asc' | 'desc'>('asc');

  // Detect column indices
  const deptColIdx = useMemo(() => columns.findIndex((c) => /department|stream/i.test(c)), [columns]);
  const authorColIdx = useMemo(() => columns.findIndex((c) => /author/i.test(c)), [columns]);
  const catColIdx = useMemo(() => columns.findIndex((c) => /category|classification/i.test(c)), [columns]);
  const statusColIdx = useMemo(() => columns.findIndex((c) => /status|circulation type/i.test(c)), [columns]);
  const dateColOptions = useMemo(() => columns.filter((c) => /date/i.test(c)), [columns]);

  useEffect(() => {
    if (!targetDateColName && dateColOptions.length > 0) {
      setTargetDateColName(dateColOptions[0]);
    }
  }, [dateColOptions, targetDateColName]);

  // Extract unique filter options from rows
  const uniqueDepts = useMemo(() => {
    if (deptColIdx === -1) return [];
    return Array.from(new Set(rows.map((r) => String(r[deptColIdx] ?? '').trim())))
      .filter((v) => v && v !== '-')
      .sort();
  }, [rows, deptColIdx]);

  const uniqueAuthors = useMemo(() => {
    if (authorColIdx === -1) return [];
    return Array.from(new Set(rows.map((r) => String(r[authorColIdx] ?? '').trim())))
      .filter((v) => v && v !== '-')
      .sort();
  }, [rows, authorColIdx]);

  const uniqueCategories = useMemo(() => {
    if (catColIdx === -1) return [];
    return Array.from(new Set(rows.map((r) => String(r[catColIdx] ?? '').trim())))
      .filter((v) => v && v !== '-')
      .sort();
  }, [rows, catColIdx]);

  const uniqueStatuses = useMemo(() => {
    if (statusColIdx === -1) return [];
    return Array.from(new Set(rows.map((r) => String(r[statusColIdx] ?? '').trim())))
      .filter((v) => v && v !== '-')
      .sort();
  }, [rows, statusColIdx]);

  function handleOpenFilterModal() {
    setTempDepartment(department);
    setTempAuthor(author);
    setTempCategory(category);
    setTempStatus(status);
    setTempDateColName(targetDateColName || (dateColOptions[0] ?? ''));
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setTempSortColumn(sortColumn || (columns[0] ?? ''));
    setTempSortOrder(sortOrder);
    setIsFilterModalOpen(true);
  }

  function handleResetTempFilters() {
    setTempDepartment('');
    setTempAuthor('');
    setTempCategory('');
    setTempStatus('');
    setTempFromDate(dateConfig ? (dateConfig.fromDate ?? '') : '');
    setTempToDate(dateConfig ? (dateConfig.toDate ?? '') : '');
    setTempSortColumn(defaultSortColumn ?? (columns[0] || ''));
    setTempSortOrder(defaultSortOrder);
  }

  function handleApplyFilters() {
    setDepartment(tempDepartment);
    setAuthor(tempAuthor);
    setCategory(tempCategory);
    setStatus(tempStatus);
    setTargetDateColName(tempDateColName);
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setSortColumn(tempSortColumn);
    setSortOrder(tempSortOrder);

    if (dateConfig?.onApplyDateRange) {
      dateConfig.onApplyDateRange(tempFromDate, tempToDate);
    }
    if (onSortChange && tempSortColumn) {
      onSortChange(tempSortColumn, tempSortOrder);
    }

    setCurrentPage(1);
    setIsFilterModalOpen(false);
  }

  function handleResetAllFilters() {
    setDepartment('');
    setAuthor('');
    setCategory('');
    setStatus('');
    setFromDate(dateConfig ? (dateConfig.fromDate ?? '') : '');
    setToDate(dateConfig ? (dateConfig.toDate ?? '') : '');
    setSortColumn(defaultSortColumn ?? (columns[0] || ''));
    setSortOrder(defaultSortOrder);

    if (dateConfig?.onApplyDateRange && dateConfig.fromDate && dateConfig.toDate) {
      dateConfig.onApplyDateRange(dateConfig.fromDate, dateConfig.toDate);
    }
    if (onSortChange && defaultSortColumn) {
      onSortChange(defaultSortColumn, defaultSortOrder);
    }
    setCurrentPage(1);
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (department) count++;
    if (author) count++;
    if (category) count++;
    if (status) count++;
    if (!dateConfig && (fromDate || toDate)) count++;
    if (sortColumn && sortColumn !== (defaultSortColumn ?? columns[0])) count++;
    if (sortOrder !== defaultSortOrder) count++;
    return count;
  }, [
    department,
    author,
    category,
    status,
    fromDate,
    toDate,
    dateConfig,
    sortColumn,
    sortOrder,
    defaultSortColumn,
    defaultSortOrder,
    columns,
  ]);

  const activeDateColIdx = useMemo(() => {
    if (!targetDateColName) return dateColOptions.length > 0 ? columns.indexOf(dateColOptions[0]) : -1;
    return columns.indexOf(targetDateColName);
  }, [columns, targetDateColName, dateColOptions]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // 1. Department filter
      if (department && deptColIdx !== -1) {
        if (String(row[deptColIdx]).toLowerCase() !== department.toLowerCase()) {
          return false;
        }
      }
      // 2. Author filter
      if (author && authorColIdx !== -1) {
        if (String(row[authorColIdx]).toLowerCase() !== author.toLowerCase()) {
          return false;
        }
      }
      // 3. Category filter
      if (category && catColIdx !== -1) {
        if (String(row[catColIdx]).toLowerCase() !== category.toLowerCase()) {
          return false;
        }
      }
      // 4. Status filter
      if (status && statusColIdx !== -1) {
        if (String(row[statusColIdx]).toLowerCase() !== status.toLowerCase()) {
          return false;
        }
      }
      // 5. Row-level date filtering
      if (!dateConfig?.onApplyDateRange && (fromDate || toDate) && activeDateColIdx !== -1) {
        const cellDateISO = extractDateISO(row[activeDateColIdx]);
        if (cellDateISO) {
          if (fromDate && cellDateISO < fromDate) return false;
          if (toDate && cellDateISO > toDate) return false;
        }
      }
      return true;
    });
  }, [
    rows,
    department,
    author,
    category,
    status,
    deptColIdx,
    authorColIdx,
    catColIdx,
    statusColIdx,
    dateConfig,
    fromDate,
    toDate,
    activeDateColIdx,
  ]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const colIdx = columns.indexOf(sortColumn);
    if (colIdx === -1) return filteredRows;

    return [...filteredRows].sort((rowA, rowB) => {
      return compareCells(rowA[colIdx], rowB[colIdx], sortOrder);
    });
  }, [filteredRows, sortColumn, sortOrder, columns]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rows, department, author, category, status, fromDate, toDate, sortColumn, sortOrder]);

  if (rows.length === 0) {
    return <p className="text-sm text-secondary-500">No data available for this report.</p>;
  }

  const isPaginated = showPagination && sortedRows.length > pageSize;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const displayRows = isPaginated ? sortedRows.slice(startIdx, startIdx + pageSize) : sortedRows;
  const fromRow = sortedRows.length === 0 ? 0 : startIdx + 1;
  const toRow = Math.min(sortedRows.length, startIdx + pageSize);

  const showDateFilterSection = Boolean(dateConfig || dateColOptions.length > 0);
  const activePresets = dateConfig?.presets ?? [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 1 Year', days: 365 },
  ];

  return (
    <div className="space-y-3">
      {/* Table Toolbar: Active Filters and Filter & Sort Trigger */}
      {enableFilters && (
        <div className="no-print flex flex-col gap-2 border-b border-secondary-100 pb-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {activeFilterCount > 0 ? (
              <>
                <span className="font-semibold text-secondary-600">Filters:</span>
                {department && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-0.5 font-medium text-primary-700">
                    Dept: {department}
                    <button
                      type="button"
                      onClick={() => setDepartment('')}
                      className="text-primary-400 hover:text-rose-600"
                      aria-label="Remove department filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {author && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-700">
                    Author: {author}
                    <button
                      type="button"
                      onClick={() => setAuthor('')}
                      className="text-purple-400 hover:text-rose-600"
                      aria-label="Remove author filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    Category: {category}
                    <button
                      type="button"
                      onClick={() => setCategory('')}
                      className="text-emerald-400 hover:text-rose-600"
                      aria-label="Remove category filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {status && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    Status: {status}
                    <button
                      type="button"
                      onClick={() => setStatus('')}
                      className="text-amber-400 hover:text-rose-600"
                      aria-label="Remove status filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {(fromDate || toDate) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                    Date: {fromDate ? formatDate(fromDate) : 'Start'} – {toDate ? formatDate(toDate) : 'End'}
                    <button
                      type="button"
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                        if (dateConfig?.onApplyDateRange) dateConfig.onApplyDateRange('', '');
                      }}
                      className="text-blue-400 hover:text-rose-600"
                      aria-label="Remove date filter"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                {sortColumn && (sortColumn !== (defaultSortColumn ?? columns[0]) || sortOrder !== defaultSortOrder) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary-100 px-2 py-0.5 font-medium text-secondary-700">
                    Sorted: {sortColumn} ({sortOrder === 'asc' ? 'Asc' : 'Desc'})
                    <button
                      type="button"
                      onClick={() => {
                        setSortColumn(defaultSortColumn ?? (columns[0] || ''));
                        setSortOrder(defaultSortOrder);
                        if (onSortChange && defaultSortColumn) onSortChange(defaultSortColumn, defaultSortOrder);
                      }}
                      className="text-secondary-400 hover:text-rose-600"
                      aria-label="Reset sort"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="ml-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                >
                  Clear all
                </button>
              </>
            ) : (
              <span className="text-secondary-500">
                Showing all <span className="font-semibold text-ink">{sortedRows.length}</span> records
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenFilterModal}
              className="gap-1.5 text-xs font-medium shadow-2xs"
            >
              <SlidersHorizontal className="size-3.5 text-primary-600" />
              Filter & Sort
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table or Empty State */}
      {sortedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-secondary-200 p-8 text-center">
          <p className="text-sm font-semibold text-secondary-700">No records match the current filters.</p>
          <p className="mt-1 text-xs text-secondary-500">Try adjusting your date range, department, author, or category filters.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetAllFilters}
            className="mt-3 text-xs"
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="relative overflow-x-auto" role="region" aria-label="Report data" tabIndex={0}>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-secondary-100 text-xs uppercase text-secondary-500">
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-semibold">
                    <span className="inline-flex items-center gap-1">
                      {col}
                      {sortColumn === col && (
                        <span className="text-primary-600">
                          {sortOrder === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr key={i} className="border-b border-secondary-50 last:border-0 hover:bg-secondary-50/50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-secondary-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {isPaginated && (
        <div className="no-print flex flex-col gap-3 border-t border-secondary-100 px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-secondary-500">
            Showing <span className="font-medium text-ink">{fromRow}</span>–
            <span className="font-medium text-ink">{toRow}</span> of{' '}
            <span className="font-medium text-ink">{sortedRows.length}</span> rows
            {sortedRows.length !== rows.length && (
              <span className="text-secondary-400"> (filtered from {rows.length})</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2 text-xs text-secondary-600">
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter & Sort Popup Modal */}
      {enableFilters && (
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter & Sort Data"
          size="lg"
          footer={
            <div className="flex w-full items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetTempFilters}
                className="text-secondary-600 hover:text-rose-600"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Reset All
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* 1. Calendar Date Range */}
            {showDateFilterSection && (
              <div className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50/60 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                    <Calendar className="size-4 text-primary-600" />
                    Calendar Date Range
                  </span>
                  {dateColOptions.length > 1 && !dateConfig?.onApplyDateRange && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-secondary-600">Field:</span>
                      <select
                        value={tempDateColName}
                        onChange={(e) => setTempDateColName(e.target.value)}
                        className="rounded-md border border-secondary-300 bg-white px-2 py-1 text-xs text-ink"
                      >
                        {dateColOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium text-secondary-500">Presets:</span>
                  {activePresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTempFromDate(addDaysISO(todayISO(), -preset.days));
                        setTempToDate(todayISO());
                      }}
                      className="rounded-md border border-secondary-200 bg-white px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-100 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTempFromDate('');
                      setTempToDate('');
                    }}
                    className="rounded-md border border-secondary-200 bg-white px-2.5 py-1 text-xs font-medium text-secondary-500 hover:text-rose-600 transition-colors"
                  >
                    Clear Dates
                  </button>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-secondary-600">From Date</label>
                    <input
                      type="date"
                      value={tempFromDate}
                      onChange={(e) => setTempFromDate(e.target.value)}
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-secondary-600">To Date</label>
                    <input
                      type="date"
                      value={tempToDate}
                      onChange={(e) => setTempToDate(e.target.value)}
                      className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Categorical Attribute Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {uniqueDepts.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary-700">Department</label>
                  <select
                    value={tempDepartment}
                    onChange={(e) => setTempDepartment(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-xs text-ink focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">All Departments ({uniqueDepts.length})</option>
                    {uniqueDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {uniqueAuthors.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary-700">Author</label>
                  <select
                    value={tempAuthor}
                    onChange={(e) => setTempAuthor(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-xs text-ink focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">All Authors ({uniqueAuthors.length})</option>
                    {uniqueAuthors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {uniqueCategories.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary-700">Classification / Category</label>
                  <select
                    value={tempCategory}
                    onChange={(e) => setTempCategory(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-xs text-ink focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">All Categories ({uniqueCategories.length})</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {uniqueStatuses.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-secondary-700">Status / Type</label>
                  <select
                    value={tempStatus}
                    onChange={(e) => setTempStatus(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-xs text-ink focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">All Statuses ({uniqueStatuses.length})</option>
                    {uniqueStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 4. Sorting */}
            <div className="space-y-2.5 rounded-xl border border-secondary-200 bg-secondary-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-700">
                <ArrowUpDown className="size-4 text-primary-600" />
                Sorting
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-secondary-600">Sort By Column</label>
                  <select
                    value={tempSortColumn}
                    onChange={(e) => setTempSortColumn(e.target.value)}
                    className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-xs text-ink focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-secondary-600">Order Direction</label>
                  <div className="inline-flex w-full rounded-lg border border-secondary-200 bg-secondary-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setTempSortOrder('asc')}
                      className={cn(
                        'flex-1 rounded-md py-1 text-xs font-medium transition-colors text-center',
                        tempSortOrder === 'asc' ? 'bg-white font-semibold text-primary-700 shadow-2xs' : 'text-secondary-600 hover:text-ink',
                      )}
                    >
                      Ascending (A–Z / 0–9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempSortOrder('desc')}
                      className={cn(
                        'flex-1 rounded-md py-1 text-xs font-medium transition-colors text-center',
                        tempSortOrder === 'desc' ? 'bg-white font-semibold text-primary-700 shadow-2xs' : 'text-secondary-600 hover:text-ink',
                      )}
                    >
                      Descending (Z–A / 9–0)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}