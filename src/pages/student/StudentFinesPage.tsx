import { useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Wallet } from 'lucide-react';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useFinesStore } from '@/store/finesStore';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';

export function StudentFinesPage() {
  const member = useCurrentMember();
  const fines = useFinesStore((s) => s.fines);

  const myFines = useMemo(
    () => (member ? fines.filter((f) => f.memberId === member.memberId) : []),
    [fines, member],
  );
  const outstanding = useMemo(
    () => myFines.filter((f) => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0),
    [myFines],
  );

  if (!member) return <EmptyState title="Member record not found" />;

  return (
    <div>
      <PageHeader title="My Fines" description="Fine history and outstanding balance." />

      <div className="mb-6 max-w-xs">
        <StatCard title="Outstanding Fine" value={formatCurrency(outstanding)} icon={Wallet} accent={outstanding > 0 ? 'danger' : 'success'} />
      </div>

      <div className="rounded-xl border border-secondary-100 bg-white shadow-sm">
        {myFines.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No fines on record" description="Keep returning books on time to stay fine-free." />
          </div>
        ) : (
          <ul className="divide-y divide-secondary-50">
            {myFines.map((fine) => (
              <li key={fine.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium text-ink">{fine.bookTitle}</p>
                  <p className="text-xs text-secondary-500">
                    {fine.overdueDays} day(s) overdue · {formatDate(fine.createdDate)}
                  </p>
                  {fine.reason && <p className="text-xs text-secondary-500">Reason: {fine.reason}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{formatCurrency(fine.amount)}</p>
                  <Badge tone={fine.status === 'Pending' ? 'warning' : fine.status === 'Collected' ? 'success' : 'neutral'}>
                    {fine.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {outstanding > 0 && (
        <p className="mt-3 text-xs text-secondary-500">
          Please pay outstanding fines at the library desk. Online payment is not available in this demo.
        </p>
      )}
    </div>
  );
}
