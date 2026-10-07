import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { createMemberColumns, type MemberRow } from '@/components/tables/columns/memberColumns';
import { MemberFormModal } from '@/components/modals/MemberFormModal';
import { MemberBulkImportModal } from '@/components/modals/MemberBulkImportModal';
import { useCan } from '@/access/useCan';
import { useMembersStore } from '@/store/membersStore';
import { useLoansStore } from '@/store/loansStore';
import { useFinesStore } from '@/store/finesStore';
import { useAccessStore } from '@/access/accessStore';
import { DEPARTMENTS } from '@/constants/departments';
import { ROUTES } from '@/routes/routePaths';
import type { Member, MemberStatus } from '@/types';
import type { MemberFormValues } from '@/utils/validators/memberSchema';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

export function MembersPage() {
  const navigate = useNavigate();
  const members = useMembersStore((s) => s.members);
  const addMember = useMembersStore((s) => s.addMember);
  const updateMember = useMembersStore((s) => s.updateMember);
  const loans = useLoansStore((s) => s.loans);
  const fines = useFinesStore((s) => s.fines);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>(undefined);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | MemberStatus>('All');

  const rows: MemberRow[] = useMemo(
    () =>
      members
        .filter((m) => departmentFilter === 'All' || m.department === departmentFilter)
        .filter((m) => statusFilter === 'All' || m.status === statusFilter)
        .map((m) => ({
          ...m,
          totalBooksIssued: loans.filter((l) => l.memberId === m.memberId && l.status === 'Active').length,
          outstandingFine: fines
            .filter((f) => f.memberId === m.memberId && f.status === 'Pending')
            .reduce((sum, f) => sum + f.amount, 0),
        })),
    [members, loans, fines, departmentFilter, statusFilter],
  );

  function openAddForm() {
    setEditingMember(undefined);
    setFormOpen(true);
  }

  function openEditForm(member: Member) {
    setEditingMember(member);
    setFormOpen(true);
  }

  function handleFormSubmit(values: MemberFormValues) {
    if (editingMember) {
      updateMember(editingMember.id, values);
      toast.success('Member updated.');
    } else {
      const nextNumber = members.length + 1001;
      const newMember: Member = {
        id: generateId('member'),
        memberId: `MEM-${nextNumber}`,
        ...values,
        joinDate: todayISO(),
      };
      addMember(newMember);
      useAccessStore.getState().ensureStudentUserForMember(newMember);
      toast.success('Member added.');
    }
    setFormOpen(false);
  }

  const can = useCan();
  const canCreate = can('members', 'create');
  const canEdit = can('members', 'edit');
  const columns = useMemo(
    () =>
      createMemberColumns({
        onView: (member) => navigate(ROUTES.memberDetails(member.id)),
        onEdit: canEdit ? openEditForm : undefined,
      }),
    [navigate, canEdit],
  );

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.length} members shown below.`}
        actions={
          canCreate && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                <FileSpreadsheet className="size-4" /> Upload (Excel/CSV)
              </Button>
              <Button onClick={openAddForm}>
                <Plus className="size-4" /> Add Member
              </Button>
            </div>
          )
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search by name, roll number, member ID..."
        onRowClick={(member) => navigate(ROUTES.memberDetails(member.id))}
        toolbarActions={
          <>
            <select
              aria-label="Filter by department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | MemberStatus)}
              className="rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </>
        }
        emptyState={{
          title: 'No members found',
          description: 'Try adjusting your filters or add a new member.',
          action: canCreate ? { label: 'Add Member', onClick: openAddForm } : undefined,
        }}
      />

      <MemberFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        existingMember={editingMember}
      />

      <MemberBulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
      />
    </div>
  );
}
