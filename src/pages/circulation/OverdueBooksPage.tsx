import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { createLoanColumns, type LoanRow } from '@/components/tables/columns/loanColumns';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { formatCurrency } from '@/utils/currency';
import { overdueDays } from '@/utils/date';
import { useCan } from '@/access/useCan';

export function OverdueBooksPage() {
  const loans = useLoansStore((s) => s.loans);
  const returnBook = useLoansStore((s) => s.returnBook);
  const members = useMembersStore((s) => s.members);
  const confirm = useConfirm();

  const rows: LoanRow[] = useMemo(() => {
    const memberName = (id: string) => members.find((m) => m.memberId === id)?.name ?? id;
    return loans
      .filter((l) => l.status === 'Active' && overdueDays(l.dueDate) > 0)
      .map((l) => ({ ...l, memberName: memberName(l.memberId) }));
  }, [loans, members]);

  async function handleReturn(loan: LoanRow) {
    const ok = await confirm({
      title: 'Return this overdue book?',
      description: `Confirm return of "${loan.bookTitle}" from ${loan.memberName}. A fine will be recorded.`,
      confirmLabel: 'Return',
    });
    if (!ok) return;
    const result = returnBook(loan.id);
    if (result.success) {
      toast.success(`Returned. Fine: ${formatCurrency(result.fineAmount)}`);
    } else {
      toast.error(result.error);
    }
  }

  const canReturn = useCan()('circulation', 'edit');
  const columns = useMemo(() => createLoanColumns({ members, onReturn: canReturn ? handleReturn : undefined }), [members, loans, canReturn]);

  return (
    <div>
      <PageHeader title="Overdue Books" description={`${rows.length} books currently overdue.`} />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member, book, accession no..."
        emptyState={{ title: 'No overdue books', description: 'All active loans are within their due date.' }}
      />
    </div>
  );
}
