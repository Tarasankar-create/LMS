import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { createLoanColumns, type LoanRow } from '@/components/tables/columns/loanColumns';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { ROUTES } from '@/routes/routePaths';
import { formatCurrency } from '@/utils/currency';
import { useCan } from '@/access/useCan';

export function ActiveLoansPage() {
  const loans = useLoansStore((s) => s.loans);
  const returnBook = useLoansStore((s) => s.returnBook);
  const renewLoan = useLoansStore((s) => s.renewLoan);
  const members = useMembersStore((s) => s.members);
  const hasPendingReservation = useReservationsStore((s) => s.hasPendingReservation);
  const confirm = useConfirm();

  const rows: LoanRow[] = useMemo(() => {
    const memberName = (id: string) => members.find((m) => m.memberId === id)?.name ?? id;
    return loans
      .filter((l) => l.status === 'Active')
      .map((l) => ({ ...l, memberName: memberName(l.memberId) }));
  }, [loans, members]);

  async function handleReturn(loan: LoanRow) {
    const ok = await confirm({
      title: 'Return this book?',
      description: `Confirm return of "${loan.bookTitle}" from ${loan.memberName}.`,
      confirmLabel: 'Return',
    });
    if (!ok) return;
    const result = returnBook(loan.id);
    if (result.success) {
      toast.success(result.fineAmount > 0 ? `Returned. Fine: ${formatCurrency(result.fineAmount)}` : 'Returned — no fine due.');
    } else {
      toast.error(result.error);
    }
  }

  function handleRenew(loan: LoanRow) {
    const result = renewLoan(loan.id);
    if (result.success) {
      toast.success('Loan renewed successfully.');
    } else {
      toast.error(result.error);
    }
  }

  const can = useCan();
  const canIssue = can('circulation', 'create');
  const canReturn = can('circulation', 'edit');
  const columns = useMemo(
    () =>
      createLoanColumns({
        members,
        onReturn: canReturn ? handleReturn : undefined,
        onRenew: canReturn
          ? (loan) => {
              if (hasPendingReservation(loan.accessionNumber)) {
                toast.error('Renewal blocked — another member has reserved this title.');
                return;
              }
              handleRenew(loan);
            }
          : undefined,
      }),
    [members, canReturn],
  );

  return (
    <div>
      <PageHeader title="Active Loans" description={`${rows.length} books currently on loan.`} />
      {(canIssue || canReturn) && (
        <div className="mb-4 flex justify-end gap-2">
          {canIssue && (
            <Link to={ROUTES.circulationIssue}>
              <Button variant="outline">Issue a Book</Button>
            </Link>
          )}
          {canReturn && (
            <Link to={ROUTES.circulationReturn}>
              <Button>Return a Book</Button>
            </Link>
          )}
        </div>
      )}
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member, book, accession no..."
        emptyState={{ title: 'No active loans', description: 'All books have been returned.' }}
      />
    </div>
  );
}
