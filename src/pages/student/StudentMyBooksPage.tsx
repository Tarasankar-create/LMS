import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useLoansStore } from '@/store/loansStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { formatDate, overdueDays } from '@/utils/date';

export function StudentMyBooksPage() {
  const member = useCurrentMember();
  const loans = useLoansStore((s) => s.loans);
  const renewLoan = useLoansStore((s) => s.renewLoan);
  const hasPendingReservation = useReservationsStore((s) => s.hasPendingReservation);

  const activeLoans = useMemo(
    () => (member ? loans.filter((l) => l.memberId === member.memberId && l.status === 'Active') : []),
    [loans, member],
  );
  const history = useMemo(
    () =>
      member
        ? [...loans].filter((l) => l.memberId === member.memberId).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
        : [],
    [loans, member],
  );

  function handleRenew(loanId: string) {
    const result = renewLoan(loanId);
    if (result.success) {
      toast.success(`Renewed. New due date: ${formatDate(result.loan.dueDate)}`);
    } else {
      toast.error(result.error);
    }
  }

  if (!member) return <EmptyState title="Member record not found" />;

  return (
    <div>
      <PageHeader title="My Books" description="Books currently issued to you and your borrowing history." />

      <div className="mb-6 rounded-xl border border-secondary-100 bg-white shadow-sm">
        <div className="border-b border-secondary-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Currently Issued ({activeLoans.length})</h3>
        </div>
        {activeLoans.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No books currently issued" description="Visit the catalogue to find something to read." />
          </div>
        ) : (
          <ul className="divide-y divide-secondary-50">
            {activeLoans.map((loan) => {
              const days = overdueDays(loan.dueDate);
              const reservedByOthers = hasPendingReservation(loan.accessionNumber);
              const canRenew = loan.renewalCount === 0 && !reservedByOthers;
              return (
                <li key={loan.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{loan.bookTitle}</p>
                    <p className="text-xs text-secondary-500">
                      Issued {formatDate(loan.issueDate)} · Due {formatDate(loan.dueDate)}
                      {loan.renewalCount > 0 && ' · Renewed once'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {days > 0 && <Badge tone="danger">Overdue {days}d</Badge>}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canRenew}
                      title={
                        loan.renewalCount > 0
                          ? 'Already renewed once'
                          : reservedByOthers
                            ? 'Blocked — another member has reserved this title'
                            : undefined
                      }
                      onClick={() => handleRenew(loan.id)}
                    >
                      Renew
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-secondary-100 bg-white shadow-sm">
        <div className="border-b border-secondary-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink">Loan History</h3>
        </div>
        {history.length === 0 ? (
          <p className="p-5 text-sm text-secondary-500">No loan history yet.</p>
        ) : (
          <ul className="divide-y divide-secondary-50">
            {history.map((loan) => (
              <li key={loan.id} className="flex items-center justify-between p-4 text-sm">
                <span className="font-medium text-ink">{loan.bookTitle}</span>
                <span className="text-xs text-secondary-500">
                  {formatDate(loan.issueDate)} → {loan.returnDate ? formatDate(loan.returnDate) : 'Active'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
