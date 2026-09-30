import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
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
import { exportToCsv } from '@/utils/csvExport';
import { formatCurrency } from '@/utils/currency';
import { formatDate, overdueDays } from '@/utils/date';
import { cn } from '@/utils/cn';

const REPORT_TABS = [
  'Total Holdings',
  'Books by Category',
  'Monthly Circulation',
  'Issue & Return Summary',
  'Overdue Books',
  'Fine Collection',
  'Department-wise Usage',
  'Annual Usage',
] as const;
type ReportTab = (typeof REPORT_TABS)[number];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('Total Holdings');
  const books = useBooksStore((s) => s.books);
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);
  const fines = useFinesStore((s) => s.fines);

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
  const monthly6 = useMemo(() => buildMonthlyCirculation(loans, 6), [loans]);
  const monthly12 = useMemo(() => buildMonthlyCirculation(loans, 12), [loans]);
  const departmentUsage = useMemo(() => buildDepartmentUsage(loans, members), [loans, members]);

  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === 'Active' && overdueDays(l.dueDate) > 0),
    [loans],
  );
  const collectedFines = useMemo(() => fines.filter((f) => f.status === 'Collected'), [fines]);
  const collectedTotal = useMemo(() => collectedFines.reduce((sum, f) => sum + f.amount, 0), [collectedFines]);

  const issueReturnSummary = useMemo(() => {
    const issued = loans.length;
    const returned = loans.filter((l) => l.status === 'Returned').length;
    const renewed = loans.filter((l) => l.renewalCount > 0).length;
    const active = loans.filter((l) => l.status === 'Active').length;
    return { issued, returned, renewed, active };
  }, [loans]);

  function memberName(memberId: string) {
    return members.find((m) => m.memberId === memberId)?.name ?? memberId;
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCsv() {
    switch (activeTab) {
      case 'Total Holdings':
        exportToCsv(
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
      case 'Overdue Books':
        exportToCsv(
          'overdue-books',
          [
            { header: 'Member', accessor: (l: (typeof overdueLoans)[number]) => memberName(l.memberId) },
            { header: 'Book Title', accessor: (l) => l.bookTitle },
            { header: 'Accession No.', accessor: (l) => l.accessionNumber },
            { header: 'Due Date', accessor: (l) => l.dueDate },
          ],
          overdueLoans,
        );
        break;
      case 'Fine Collection':
        exportToCsv(
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
        exportToCsv(
          'department-usage',
          [
            { header: 'Department', accessor: (d: (typeof departmentUsage)[number]) => d.department },
            { header: 'Books Borrowed', accessor: (d) => d.loans },
          ],
          departmentUsage,
        );
        break;
      default:
        exportToCsv(
          'monthly-circulation',
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
        title="Reports & Analytics"
        description="Compliance-ready reports for college administration."
        actions={
          <div className="no-print flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="size-4" /> Print / Export PDF
            </Button>
          </div>
        }
      />

      <div className="no-print mb-6 flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-100',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <h2 className="mb-3 hidden text-lg font-semibold text-ink print:block">{activeTab}</h2>

      {activeTab === 'Total Holdings' && (
        <ChartCard title="Total Library Holdings by Category">
          <SimpleTable
            columns={['Category', 'Titles', 'Total Copies', 'Available Copies']}
            rows={holdingsByCategory.map((r) => [r.category, r.titles, r.totalCopies, r.availableCopies])}
          />
        </ChartCard>
      )}

      {activeTab === 'Books by Category' && (
        <ChartCard title="Books by Category">
          <CategoryDistributionChart data={categoryDistribution} />
        </ChartCard>
      )}

      {activeTab === 'Monthly Circulation' && (
        <ChartCard title="Monthly Circulation (Last 6 Months)">
          <MonthlyCirculationChart data={monthly6} />
        </ChartCard>
      )}

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

      {activeTab === 'Overdue Books' && (
        <ChartCard title={`Overdue Books Report (${overdueLoans.length})`}>
          <SimpleTable
            columns={['Member', 'Book Title', 'Accession No.', 'Due Date']}
            rows={overdueLoans.map((l) => [memberName(l.memberId), l.bookTitle, l.accessionNumber, formatDate(l.dueDate)])}
          />
        </ChartCard>
      )}

      {activeTab === 'Fine Collection' && (
        <ChartCard title={`Fine Collection Report — Total ${formatCurrency(collectedTotal)}`}>
          <SimpleTable
            columns={['Member', 'Book Title', 'Amount', 'Collected Date']}
            rows={collectedFines.map((f) => [f.memberName, f.bookTitle, formatCurrency(f.amount), formatDate(f.collectedDate)])}
          />
        </ChartCard>
      )}

      {activeTab === 'Department-wise Usage' && (
        <ChartCard title="Department-wise Library Usage">
          <DepartmentUsageChart data={departmentUsage} />
        </ChartCard>
      )}

      {activeTab === 'Annual Usage' && (
        <ChartCard title="Annual Library Usage (Last 12 Months)">
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
              <th key={col} className="px-3 py-2">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-secondary-50 last:border-0">
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
