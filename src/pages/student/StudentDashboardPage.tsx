import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Clock3, Megaphone, Wallet } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useLoansStore } from '@/store/loansStore';
import { useFinesStore } from '@/store/finesStore';
import { selectLiveNotices, useNoticesStore } from '@/store/noticesStore';
import { formatCurrency } from '@/utils/currency';
import { formatDate, overdueDays } from '@/utils/date';
import { ROUTES } from '@/routes/routePaths';

export function StudentDashboardPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const member = useCurrentMember();
  const loans = useLoansStore((s) => s.loans);
  const fines = useFinesStore((s) => s.fines);
  const allNotices = useNoticesStore((s) => s.notices);

  const activeLoans = useMemo(
    () => (member ? loans.filter((l) => l.memberId === member.memberId && l.status === 'Active') : []),
    [loans, member],
  );
  const outstandingFine = useMemo(
    () => (member ? fines.filter((f) => f.memberId === member.memberId && f.status === 'Pending').reduce((s, f) => s + f.amount, 0) : 0),
    [fines, member],
  );
  const recentNotices = useMemo(() => selectLiveNotices(allNotices).slice(0, 4), [allNotices]);

  if (!member) {
    return (
      <EmptyState
        title="Member record not found"
        description="Your student membership record could not be located. Please contact the library desk."
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Welcome back, {currentUser?.name.split(' ')[0]} 👋</h1>
        <p className="mt-1 text-sm text-secondary-500">Here's what's happening with your library account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Books Issued" value={activeLoans.length} icon={BookMarked} accent="primary" />
        <StatCard
          title="Next Due Date"
          value={activeLoans.length > 0 ? formatDate([...activeLoans].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))[0].dueDate) : 'None'}
          icon={Clock3}
          accent="accent"
        />
        <StatCard title="Outstanding Fine" value={formatCurrency(outstandingFine)} icon={Wallet} accent={outstandingFine > 0 ? 'danger' : 'success'} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Books Currently Issued</h3>
            <Link to={ROUTES.studentMyBooks} className="text-xs font-medium text-primary-500 hover:text-primary-600">
              View all
            </Link>
          </div>
          {activeLoans.length === 0 ? (
            <p className="text-sm text-secondary-500">You have no books issued right now.</p>
          ) : (
            <ul className="space-y-2">
              {activeLoans.map((loan) => {
                const days = overdueDays(loan.dueDate);
                return (
                  <li key={loan.id} className="flex items-center justify-between rounded-lg border border-secondary-100 p-2.5 text-sm">
                    <span className="font-medium text-ink">{loan.bookTitle}</span>
                    {days > 0 ? (
                      <Badge tone="danger">Overdue {days}d</Badge>
                    ) : (
                      <span className="text-xs text-secondary-500">Due {formatDate(loan.dueDate)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-secondary-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              <Megaphone className="mr-1.5 inline size-4 text-accent-500" />
              Recent Notices
            </h3>
            <Link to={ROUTES.studentNotices} className="text-xs font-medium text-primary-500 hover:text-primary-600">
              View all
            </Link>
          </div>
          {recentNotices.length === 0 ? (
            <p className="text-sm text-secondary-500">No notices at the moment.</p>
          ) : (
            <ul className="space-y-3">
              {recentNotices.map((notice) => (
                <li key={notice.id} className="border-b border-secondary-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{notice.title}</p>
                    {notice.isDefault && (
                      <Badge tone="accent" withDot={false}>
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-secondary-500">
                    {notice.isDefault ? 'Standing Notice' : formatDate(notice.publishDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
