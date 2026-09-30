import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { WaiveFineModal } from '@/components/modals/WaiveFineModal';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useFinesStore } from '@/store/finesStore';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { ROUTES } from '@/routes/routePaths';
import { useCan } from '@/access/useCan';

export function FineDetailsPage() {
  const canEdit = useCan()('fines', 'edit');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fine = useFinesStore((s) => s.fines.find((f) => f.id === id));
  const collectPayment = useFinesStore((s) => s.collectPayment);
  const waiveFine = useFinesStore((s) => s.waiveFine);
  const confirm = useConfirm();
  const [waiveOpen, setWaiveOpen] = useState(false);

  if (!fine) {
    return (
      <div>
        <PageHeader title="Fine Not Found" breadcrumbs={[{ label: 'Fines', href: ROUTES.fines }, { label: 'Not Found' }]} />
        <EmptyState icon={Receipt} title="This fine could not be found" action={{ label: 'Back to Fines', onClick: () => navigate(ROUTES.fines) }} />
      </div>
    );
  }

  async function handleCollect() {
    const ok = await confirm({
      title: 'Record fine payment?',
      description: `Confirm collection of ${formatCurrency(fine!.amount)} from ${fine!.memberName}.`,
      confirmLabel: 'Mark as Collected',
    });
    if (ok) {
      collectPayment(fine!.id);
      toast.success('Payment recorded.');
    }
  }

  return (
    <div>
      <PageHeader
        title={`Fine ${fine.id}`}
        breadcrumbs={[{ label: 'Fines', href: ROUTES.fines }, { label: fine.id }]}
        actions={
          <Button variant="outline" onClick={() => navigate(ROUTES.fines)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />

      <div className="max-w-2xl rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <Badge tone={fine.status === 'Pending' ? 'warning' : fine.status === 'Collected' ? 'success' : 'neutral'}>
            {fine.status}
          </Badge>
          <p className="text-2xl font-semibold text-ink">{formatCurrency(fine.amount)}</p>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-secondary-500">Member</dt>
            <dd className="font-medium text-ink">{fine.memberName}</dd>
          </div>
          <div>
            <dt className="text-sm text-secondary-500">Loan ID</dt>
            <dd className="font-medium text-ink">{fine.loanId}</dd>
          </div>
          <div>
            <dt className="text-sm text-secondary-500">Book Title</dt>
            <dd className="font-medium text-ink">{fine.bookTitle}</dd>
          </div>
          <div>
            <dt className="text-sm text-secondary-500">Overdue Days</dt>
            <dd className="font-medium text-ink">{fine.overdueDays}</dd>
          </div>
          <div>
            <dt className="text-sm text-secondary-500">Created On</dt>
            <dd className="font-medium text-ink">{formatDate(fine.createdDate)}</dd>
          </div>
          {fine.collectedDate && (
            <div>
              <dt className="text-sm text-secondary-500">Collected On</dt>
              <dd className="font-medium text-ink">{formatDate(fine.collectedDate)}</dd>
            </div>
          )}
          {fine.reason && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-secondary-500">Waiver Reason</dt>
              <dd className="font-medium text-ink">{fine.reason}</dd>
            </div>
          )}
        </dl>

        {fine.status === 'Pending' && canEdit && (
          <div className="mt-6 flex gap-2">
            <Button onClick={handleCollect}>Mark as Collected</Button>
            <Button variant="ghost" onClick={() => setWaiveOpen(true)}>
              Waive Fine
            </Button>
          </div>
        )}
      </div>

      <WaiveFineModal
        isOpen={waiveOpen}
        onClose={() => setWaiveOpen(false)}
        fine={fine}
        onConfirm={(reason) => {
          waiveFine(fine.id, reason);
          toast.success('Fine waived.');
          setWaiveOpen(false);
        }}
      />
    </div>
  );
}
