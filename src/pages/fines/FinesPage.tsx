import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wallet, CircleCheck, CircleSlash } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/tables/DataTable';
import { createFineColumns } from '@/components/tables/columns/fineColumns';
import { WaiveFineModal } from '@/components/modals/WaiveFineModal';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useFinesStore } from '@/store/finesStore';
import { ROUTES } from '@/routes/routePaths';
import type { Fine, FineStatus } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useCan } from '@/access/useCan';

export function FinesPage() {
  const navigate = useNavigate();
  const fines = useFinesStore((s) => s.fines);
  const collectPayment = useFinesStore((s) => s.collectPayment);
  const waiveFine = useFinesStore((s) => s.waiveFine);
  const confirm = useConfirm();

  const [statusFilter, setStatusFilter] = useState<'All' | FineStatus>('All');
  const [waiveTarget, setWaiveTarget] = useState<Fine | undefined>();

  const rows = useMemo(
    () => fines.filter((f) => statusFilter === 'All' || f.status === statusFilter),
    [fines, statusFilter],
  );

  const totals = useMemo(
    () => ({
      pending: fines.filter((f) => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0),
      collected: fines.filter((f) => f.status === 'Collected').reduce((sum, f) => sum + f.amount, 0),
      waived: fines.filter((f) => f.status === 'Waived').reduce((sum, f) => sum + f.amount, 0),
    }),
    [fines],
  );

  async function handleCollect(fine: Fine) {
    const ok = await confirm({
      title: 'Record fine payment?',
      description: `Confirm collection of ${formatCurrency(fine.amount)} from ${fine.memberName}.`,
      confirmLabel: 'Mark as Collected',
    });
    if (ok) {
      collectPayment(fine.id);
      toast.success('Payment recorded.');
    }
  }

  function handleWaiveConfirm(reason: string) {
    if (!waiveTarget) return;
    waiveFine(waiveTarget.id, reason);
    toast.success('Fine waived.');
    setWaiveTarget(undefined);
  }

  const canEdit = useCan()('fines', 'edit');
  const columns = useMemo(
    () =>
      createFineColumns({
        onView: (fine) => navigate(ROUTES.fineDetails(fine.id)),
        onCollect: canEdit ? handleCollect : undefined,
        onWaive: canEdit ? (fine) => setWaiveTarget(fine) : undefined,
      }),
    [navigate, canEdit],
  );

  return (
    <div>
      <PageHeader title="Fines" description="Track pending, collected, and waived library fines." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Pending Fines" value={formatCurrency(totals.pending)} icon={Wallet} accent="warning" />
        <StatCard title="Collected Fines" value={formatCurrency(totals.collected)} icon={CircleCheck} accent="success" />
        <StatCard title="Waived Fines" value={formatCurrency(totals.waived)} icon={CircleSlash} accent="primary" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member or book title..."
        toolbarActions={
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | FineStatus)}
            className="rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Collected">Collected</option>
            <option value="Waived">Waived</option>
          </select>
        }
        emptyState={{ title: 'No fines found' }}
      />

      <WaiveFineModal
        isOpen={!!waiveTarget}
        onClose={() => setWaiveTarget(undefined)}
        fine={waiveTarget}
        onConfirm={handleWaiveConfirm}
      />
    </div>
  );
}
