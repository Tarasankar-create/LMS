import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, UserX } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useMembersStore } from '@/store/membersStore';
import { useLoansStore } from '@/store/loansStore';
import { useFinesStore } from '@/store/finesStore';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/currency';
import { ROUTES } from '@/routes/routePaths';

export function MemberDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const member = useMembersStore((s) => s.getById(id ?? ''));
  const loans = useLoansStore((s) => s.loans);
  const fines = useFinesStore((s) => s.fines);

  const memberLoans = useMemo(
    () => (member ? loans.filter((l) => l.memberId === member.memberId) : []),
    [loans, member],
  );
  const activeLoans = useMemo(() => memberLoans.filter((l) => l.status === 'Active'), [memberLoans]);
  const history = useMemo(
    () => [...memberLoans].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [memberLoans],
  );
  const memberFines = useMemo(() => (member ? fines.filter((f) => f.memberId === member.memberId) : []), [fines, member]);
  const outstandingFine = useMemo(
    () => memberFines.filter((f) => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0),
    [memberFines],
  );

  if (!member) {
    return (
      <div>
        <PageHeader title="Member Not Found" breadcrumbs={[{ label: 'Members', href: ROUTES.members }, { label: 'Not Found' }]} />
        <EmptyState
          icon={UserX}
          title="This member could not be found"
          action={{ label: 'Back to Members', onClick: () => navigate(ROUTES.members) }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={member.name}
        breadcrumbs={[{ label: 'Members', href: ROUTES.members }, { label: member.memberId }]}
        actions={
          <Button variant="outline" onClick={() => navigate(ROUTES.members)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={member.name} size="lg" />
            <div>
              <p className="font-semibold text-ink">{member.name}</p>
              <p className="text-sm text-secondary-500">{member.memberId}</p>
            </div>
          </div>
          <Badge tone={member.status === 'Active' ? 'success' : member.status === 'Suspended' ? 'danger' : 'neutral'}>
            {member.status}
          </Badge>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-secondary-500">Roll Number</dt>
              <dd className="font-medium text-ink">{member.rollNumber}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Department</dt>
              <dd className="font-medium text-ink">{member.department}</dd>
            </div>
            <div>
              <dt className="text-secondary-500">Academic Year</dt>
              <dd className="font-medium text-ink">{member.academicYear}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-secondary-500" />
              <dd className="text-secondary-600">{member.email}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-secondary-500" />
              <dd className="text-secondary-600">{member.phone}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-secondary-500">Books Issued</p>
              <p className="text-xl font-semibold text-ink">{activeLoans.length}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Loans (all time)</p>
              <p className="text-xl font-semibold text-ink">{memberLoans.length}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-500">Outstanding Fine</p>
              <p className={`text-xl font-semibold ${outstandingFine > 0 ? 'text-danger-600' : 'text-ink'}`}>
                {formatCurrency(outstandingFine)}
              </p>
            </div>
          </div>

          <h3 className="mb-2 text-sm font-semibold text-ink">Currently Borrowed Books</h3>
          {activeLoans.length === 0 ? (
            <p className="mb-4 text-sm text-secondary-500">No books currently borrowed.</p>
          ) : (
            <ul className="mb-4 space-y-2">
              {activeLoans.map((loan) => (
                <li key={loan.id} className="flex items-center justify-between rounded-lg border border-secondary-100 p-2.5 text-sm">
                  <span className="font-medium text-ink">{loan.bookTitle}</span>
                  <span className="text-xs text-secondary-500">Due {formatDate(loan.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-ink">Borrowing History</h3>
          {history.length === 0 ? (
            <p className="text-sm text-secondary-500">No borrowing history yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {history.map((loan) => (
                <li key={loan.id} className="rounded-lg border border-secondary-100 p-2.5 text-sm">
                  <p className="font-medium text-ink">{loan.bookTitle}</p>
                  <p className="text-xs text-secondary-500">
                    {formatDate(loan.issueDate)} → {loan.returnDate ? formatDate(loan.returnDate) : 'Active'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-ink">Fines</h3>
          {memberFines.length === 0 ? (
            <p className="text-sm text-secondary-500">No fines on record.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {memberFines.map((fine) => (
                <li key={fine.id} className="flex items-center justify-between rounded-lg border border-secondary-100 p-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink">{fine.bookTitle}</p>
                    <p className="text-xs text-secondary-500">{formatDate(fine.createdDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink">{formatCurrency(fine.amount)}</p>
                    <Badge tone={fine.status === 'Pending' ? 'warning' : fine.status === 'Collected' ? 'success' : 'neutral'}>
                      {fine.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
