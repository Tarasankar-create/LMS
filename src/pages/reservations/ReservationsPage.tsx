import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/tables/DataTable';
import { createReservationColumns, type ReservationRow } from '@/components/tables/columns/reservationColumns';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useReservationsStore } from '@/store/reservationsStore';
import { useMembersStore } from '@/store/membersStore';
import { useCan } from '@/access/useCan';

export function ReservationsPage() {
  const reservations = useReservationsStore((s) => s.reservations);
  const cancel = useReservationsStore((s) => s.cancel);
  const members = useMembersStore((s) => s.members);
  const confirm = useConfirm();

  const rows: ReservationRow[] = useMemo(() => {
    const memberName = (id: string) => members.find((m) => m.memberId === id)?.name ?? id;
    return [...reservations]
      .sort((a, b) => (a.reservedDate < b.reservedDate ? 1 : -1))
      .map((r) => ({ ...r, memberName: memberName(r.memberId) }));
  }, [reservations, members]);

  async function handleCancel(reservation: ReservationRow) {
    const ok = await confirm({
      title: 'Cancel this reservation?',
      description: `${reservation.memberName}'s reservation for "${reservation.bookTitle}" will be cancelled.`,
      confirmLabel: 'Cancel Reservation',
      tone: 'danger',
    });
    if (ok) {
      cancel(reservation.id);
      toast.success('Reservation cancelled.');
    }
  }

  const canEdit = useCan()('reservations', 'edit');
  const columns = useMemo(() => createReservationColumns({ onCancel: canEdit ? handleCancel : undefined }), [canEdit]);

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Members waiting for currently unavailable titles. A reserved copy is held for 2 days once it becomes available."
      />
      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by member or book title..."
        emptyState={{ title: 'No reservations', description: 'No members currently have books on hold.' }}
      />
    </div>
  );
}
