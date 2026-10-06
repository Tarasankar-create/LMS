import { useMemo, useState } from 'react';
import { FileSpreadsheet, Printer, BookOpen, Users } from 'lucide-react';
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
import { BOOK_CATEGORIES } from '@/types';
import { buildCategoryDistribution, buildDepartmentUsage, buildMonthlyCirculation } from '@/utils/circulationStats';
import { exportToExcel } from '@/utils/excelExport';
import { formatCurrency } from '@/utils/currency';
import { formatDate, overdueDays } from '@/utils/date';
import { cn } from '@/utils/cn';

export const CATALOG_TABS = [
  'Total Holdings',
  'Books by Category',
  'Department Holdings',
  'Available Books',
  'Asset Valuation',
] as const;

export const ASSIGNMENT_TABS = [
  'Issue & Return Summary',
  'Currently Assigned Books',
  'Overdue Books',
  'Department-wise Usage',
  'Fine Collection',
  'Circulation Trends',
] as const;

export type CatalogTab = (typeof CATALOG_TABS)[number];
export type AssignmentTab = (typeof ASSIGNMENT_TABS)[number];
export type ReportTab = CatalogTab | AssignmentTab;

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Total Holdings');
  const books = useBooksStore((s) => s.books);
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const fines = useFinesStore((s) => s.fines);

  // --- CATALOG VIEW DATA ---
  const holdingsByCategory = useMemo(
    () =>
      BOOK_CATEGORIES.map((category) => {
        const inCategory = books.filter((b) => b.category === category && b.status !== 'Retired');
        return {
          category,
          titles: inCategory.length,
          totalCopies: inCategory.reduce((sum, b) => sum + b.totalCopies, 0),
          availableCopies: inCategory.reduce((sum, b) => sum + b.availableCopies, 0),
        };
      }),
    [books],
  );

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

  const departmentUsage = useMemo(() => buildDepartmentUsage(loans, members), [loans, members]);
  const monthly12 = useMemo(() => buildMonthlyCirculation(loans, 12), [loans]);

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
          'total-holdings',
          [
            { header: 'Category', accessor: (r: (typeof holdingsByCategory)[number]) => r.category },
            { header: 'Titles', accessor: (r) => r.titles },
            { header: 'Total Copies', accessor: (r) => r.totalCopies },
            { header: 'Available Copies', accessor: (r) => r.availableCopies },
          ],
          holdingsByCategory,
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
        <ChartCard title="Total Library Holdings by Category">
          <SimpleTable
            columns={['Category', 'Titles', 'Total Copies', 'Available Copies']}
            rows={holdingsByCategory.map((r) => [r.category, r.titles, r.totalCopies, r.availableCopies])}
          />
        </ChartCard>
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
