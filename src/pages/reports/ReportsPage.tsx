import { useMemo, useState } from 'react';
import { FileSpreadsheet, Printer, BookOpen, Users, Calendar, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { ChartCard } from '@/components/common/ChartCard';
import { CategoryDistributionChart } from '@/components/charts/CategoryDistributionChart';
import { MonthlyCirculationChart } from '@/components/charts/MonthlyCirculationChart';
import { DepartmentUsageChart } from '@/components/charts/DepartmentUsageChart';
import { useBooksStore } from '@/store/booksStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useFinesStore } from '@/store/finesStore';
import { useCopiesStore } from '@/store/copiesStore';
import { BOOK_CATEGORIES } from '@/types';
import { buildCategoryDistribution, buildDepartmentUsage, buildMonthlyCirculation } from '@/utils/circulationStats';
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
  'Department-wise Usage',
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
  const [drilldownPage, setDrilldownPage] = useState<number>(1);

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

  const drilldownPageSize = 10;
  const totalDrilldownRows = drilldownBooks.length;
  const totalDrilldownPages = Math.max(1, Math.ceil(totalDrilldownRows / drilldownPageSize));
  const safeDrilldownPage = Math.min(Math.max(1, drilldownPage), totalDrilldownPages);
  const drilldownStartIdx = (safeDrilldownPage - 1) * drilldownPageSize;
  const paginatedDrilldownBooks = useMemo(
    () => drilldownBooks.slice(drilldownStartIdx, drilldownStartIdx + drilldownPageSize),
    [drilldownBooks, drilldownStartIdx],
  );
  const drilldownFromRow = totalDrilldownRows === 0 ? 0 : drilldownStartIdx + 1;
  const drilldownToRow = Math.min(totalDrilldownRows, drilldownStartIdx + drilldownPageSize);

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
    () => books.filter((b) => b.status !== 'Retired' && b.availableCopies > 0).slice(0, 50),
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
    const memberMap = new Map(members.map((m) => [m.memberId, m.name]));
    const loanMap = new Map(loans.map((l) => [l.id, l.bookTitle]));
    return fines
      .filter((f) => f.status === 'Collected')
      .map((f) => ({
        ...f,
        memberName: memberMap.get(f.memberId) ?? f.memberId,
        bookTitle: loanMap.get(f.loanId) ?? '-',
      }));
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

  const departmentUsage = useMemo(() => buildDepartmentUsage(loans, members), [loans, members]);
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
            { header: 'Book Title', accessor: (l) => l.bookTitle },
            { header: 'Accession No.', accessor: (l) => l.accessionNumber },
            { header: 'Due Date', accessor: (l) => l.dueDate },
          ],
          overdueLoans,
        );
        break;
      case 'Fine Collection':
        exportToExcel(
          'fine-collection',
          [
            { header: 'Member', accessor: (f: (typeof collectedFines)[number]) => f.memberName },
            { header: 'Book Title', accessor: (f) => f.bookTitle },
            { header: 'Amount', accessor: (f) => f.amount },
            { header: 'Collected Date', accessor: (f) => f.collectedDate ?? '' },
          ],
          collectedFines,
        );
        break;
      case 'Department-wise Usage':
        exportToExcel(
          'department-usage',
          [
            { header: 'Department', accessor: (d: (typeof departmentUsage)[number]) => d.department },
            { header: 'Books Borrowed', accessor: (d) => d.loans },
          ],
          departmentUsage,
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
                  onClick={() => {
                    setSelectedClassificationDrilldown('All');
                    setDrilldownPage(1);
                  }}
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
                      onClick={() => {
                        setSelectedClassificationDrilldown(c);
                        setDrilldownPage(1);
                      }}
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
              rows={paginatedDrilldownBooks.map((b) => [
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

            {totalDrilldownRows > 0 && (
              <div className="flex flex-col gap-3 border-t border-secondary-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-secondary-500">
                  Showing <span className="font-medium text-ink">{drilldownFromRow}</span>–
                  <span className="font-medium text-ink">{drilldownToRow}</span> of{' '}
                  <span className="font-medium text-ink">{totalDrilldownRows}</span> titles
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage(1)}
                    disabled={safeDrilldownPage <= 1}
                    aria-label="First page"
                  >
                    <ChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage((p) => Math.max(1, p - 1))}
                    disabled={safeDrilldownPage <= 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="px-2 text-xs text-secondary-600">
                    Page {safeDrilldownPage} of {totalDrilldownPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage((p) => Math.min(totalDrilldownPages, p + 1))}
                    disabled={safeDrilldownPage >= totalDrilldownPages}
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage(totalDrilldownPages)}
                    disabled={safeDrilldownPage >= totalDrilldownPages}
                    aria-label="Last page"
                  >
                    <ChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
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
            columns={['Accession No.', 'Title', 'Author', 'Category', 'Shelf Location', 'Available Copies']}
            rows={availableBooksList.map((b) => [
              b.accessionNumber,
              b.title,
              b.author,
              b.category,
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
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-600">
                <Calendar className="size-3.5 text-primary-600" />
                Date Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-secondary-600">From:</label>
                <input
                  type="date"
                  value={dailyFromDate}
                  onChange={(e) => setDailyFromDate(e.target.value)}
                  className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-secondary-600">To:</label>
                <input
                  type="date"
                  value={dailyToDate}
                  onChange={(e) => setDailyToDate(e.target.value)}
                  className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-secondary-600">Sort Date:</label>
                <div className="inline-flex rounded-lg border border-secondary-200 bg-secondary-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDailySortOrder('desc')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      dailySortOrder === 'desc'
                        ? 'bg-white font-semibold text-primary-700 shadow-2xs'
                        : 'text-secondary-600 hover:text-ink',
                    )}
                    title="Sort Newest First (Descending)"
                  >
                    <ArrowDown className="size-3" />
                    Descending
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailySortOrder('asc')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      dailySortOrder === 'asc'
                        ? 'bg-white font-semibold text-primary-700 shadow-2xs'
                        : 'text-secondary-600 hover:text-ink',
                    )}
                    title="Sort Oldest First (Ascending)"
                  >
                    <ArrowUp className="size-3" />
                    Ascending
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
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
            />
          </ChartCard>
        </div>
      )}

      {activeTab === 'Usage Report' && (
        <div className="space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-600">
                <Calendar className="size-3.5 text-primary-600" />
                Calendar Range:
              </span>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-secondary-600">From:</label>
                <input
                  type="date"
                  value={usageFromDate}
                  onChange={(e) => setUsageFromDate(e.target.value)}
                  className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-secondary-600">To:</label>
                <input
                  type="date"
                  value={usageToDate}
                  onChange={(e) => setUsageToDate(e.target.value)}
                  className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-medium text-ink shadow-2xs focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
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
                columns={['Rank', 'Accession No.', 'Book Title', 'Author', 'Category', 'Total Copies', 'Times Issued']}
                rows={usageStats.mostIssued.slice(0, 25).map((b, idx) => [
                  `#${idx + 1}`,
                  b.accessionNumber,
                  b.title,
                  b.author,
                  b.category,
                  b.totalCopies,
                  b.issueCount,
                ])}
              />
            </ChartCard>

            <ChartCard
              title={`Least-Issued Titles (${formatDate(usageStats.start)} — ${formatDate(usageStats.end)})`}
              description="Books with lowest or zero circulation during the date range (useful for collection evaluation & weed-out decisions)."
            >
              <SimpleTable
                columns={['Accession No.', 'Book Title', 'Author', 'Category', 'Shelf Location', 'Available Copies', 'Times Issued']}
                rows={usageStats.leastIssued.slice(0, 25).map((b) => [
                  b.accessionNumber,
                  b.title,
                  b.author,
                  b.category,
                  b.shelfLocation,
                  b.availableCopies,
                  b.issueCount,
                ])}
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
            columns={['Member Name', 'Roll No.', 'Book Title', 'Accession No.', 'Due Date', 'Days Overdue']}
            rows={overdueLoans.map((l) => {
              const info = memberInfo(l.memberId);
              return [
                info.name,
                info.roll,
                l.bookTitle,
                l.accessionNumber,
                formatDate(l.dueDate),
                `${overdueDays(l.dueDate)} days`,
              ];
            })}
          />
        </ChartCard>
      )}

      {activeTab === 'Department-wise Usage' && (
        <ChartCard title="Department-wise Student Library Usage">
          <DepartmentUsageChart data={departmentUsage} />
        </ChartCard>
      )}

      {activeTab === 'Fine Collection' && (
        <ChartCard title={`Fine Collection Report — Total ${formatCurrency(collectedTotal)}`}>
          <SimpleTable
            columns={['Member', 'Book Title', 'Amount', 'Collected Date']}
            rows={collectedFines.map((f) => [
              f.memberName,
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

function SimpleTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-secondary-500">No data available for this report.</p>;
  }
  return (
    <div className="relative overflow-x-auto" role="region" aria-label="Report data" tabIndex={0}>
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-secondary-100 text-xs uppercase text-secondary-500">
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
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
  );
}