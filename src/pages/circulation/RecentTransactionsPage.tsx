import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { createLoanColumns, type LoanRow } from '@/components/tables/columns/loanColumns';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';

export function RecentTransactionsPage() {
  const loans = useLoansStore((s) => s.loans);
  const members = useMembersStore((s) => s.members);

  const rows: LoanRow[] = useMemo(() => {
    const memberName = (id: string) => members.find((m) => m.memberId === id)?.name ?? id;
    return [...loans]
      .sort((a, b) => {
        const aDate = a.returnDate ?? a.issueDate;
        const bDate = b.returnDate ?? b.issueDate;
        return aDate < bDate ? 1 : -1;
      })
      .map((l) => ({ ...l, memberName: memberName(l.memberId) }));
  }, [loans, members]);

  const columns = useMemo(() => createLoanColumns({ members }), [members]);

  return (
    <div>
      <PageHeader title="Recent Transactions" description="All issue and return activity, most recent first." />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member, book, accession no..."
        emptyState={{ title: 'No transactions yet' }}
      />
    </div>
  );
}
