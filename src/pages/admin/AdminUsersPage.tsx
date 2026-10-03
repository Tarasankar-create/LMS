import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, UserPlus, Shield, ShieldCheck, GraduationCap, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { DataTable } from '@/components/tables/DataTable';
import { createUserColumns } from '@/components/tables/columns/userColumns';
import { UserFormModal } from '@/components/modals/UserFormModal';
import { ResetPasswordModal } from '@/components/modals/ResetPasswordModal';
import { useConfirm } from '@/components/common/ConfirmDialogProvider';
import { useAccessStore } from '@/access/accessStore';
import { useAuthStore } from '@/store/authStore';
import type { User, Role, UserStatus } from '@/types';
import type { UserFormValues } from '@/utils/validators/userSchema';

export function AdminUsersPage() {
  const users = useAccessStore((s) => s.users);
  const addUser = useAccessStore((s) => s.addUser);
  const updateUser = useAccessStore((s) => s.updateUser);
  const deleteUser = useAccessStore((s) => s.deleteUser);
  const toggleUserStatus = useAccessStore((s) => s.toggleUserStatus);
  const resetUserPassword = useAccessStore((s) => s.resetUserPassword);

  const currentUser = useAuthStore((s) => s.currentUser);
  const confirm = useConfirm();

  const [roleFilter, setRoleFilter] = useState<'All' | Role>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | UserStatus>('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [passwordResetUser, setPasswordResetUser] = useState<User | undefined>();

  // Filter out student accounts (which are managed under the Members module)
  const staffAndAdminUsers = useMemo(
    () => users.filter((u) => u.role !== 'student'),
    [users],
  );

  const filteredUsers = useMemo(() => {
    return staffAndAdminUsers.filter((u) => {
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;
      return true;
    });
  }, [staffAndAdminUsers, roleFilter, statusFilter]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = staffAndAdminUsers.length;
    const librarians = staffAndAdminUsers.filter((u) => u.role === 'librarian').length;
    const staff = staffAndAdminUsers.filter((u) => u.role === 'staff').length;
    const principals = staffAndAdminUsers.filter((u) => u.role === 'principal').length;
    return { total, librarians, staff, principals };
  }, [staffAndAdminUsers]);

  // Handle User Creation
  function handleAddUser(values: UserFormValues) {
    const result = addUser({
      name: values.name,
      role: values.role,
      username: values.username,
      password: values.password,
      email: values.email,
      phone: values.phone,
      status: values.status,
    });

    if (result.ok) {
      toast.success(
        `Added ${result.user.name} as ${result.user.role.toUpperCase()} (Username: @${result.user.username})`,
      );
      setIsAddModalOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  // Handle User Edit
  function handleEditUser(values: UserFormValues) {
    if (!editingUser) return;
    const result = updateUser(editingUser.id, {
      name: values.name,
      role: values.role,
      email: values.email,
      phone: values.phone,
      status: values.status,
    });

    if (result.ok) {
      toast.success(`Updated details for ${values.name}.`);
      setEditingUser(undefined);
    } else {
      toast.error(result.error);
    }
  }

  // Handle Status Toggle (Active / Suspend)
  async function handleToggleStatus(user: User) {
    const willSuspend = user.status === 'active';
    const ok = await confirm({
      title: willSuspend ? `Suspend ${user.name}?` : `Reactivate ${user.name}?`,
      description: willSuspend
        ? `Suspending @${user.username} will immediately prevent them from logging in to the Library Management System.`
        : `Reactivating @${user.username} will restore their login access with role: ${user.role}.`,
      confirmLabel: willSuspend ? 'Suspend Account' : 'Reactivate Account',
      tone: willSuspend ? 'danger' : 'primary',
    });

    if (ok) {
      const res = toggleUserStatus(user.id, currentUser?.id);
      if (res.ok) {
        toast.success(`Account @${user.username} is now ${willSuspend ? 'suspended' : 'active'}.`);
      } else {
        toast.error(res.error);
      }
    }
  }

  // Handle User Deletion
  async function handleDeleteUser(user: User) {
    const ok = await confirm({
      title: `Delete user ${user.name}?`,
      description: `Are you sure you want to permanently remove @${user.username} (${user.role})? This cannot be undone.`,
      confirmLabel: 'Delete User',
      tone: 'danger',
    });

    if (ok) {
      const res = deleteUser(user.id, currentUser?.id);
      if (res.ok) {
        toast.success(`User @${user.username} deleted.`);
      } else {
        toast.error(res.error);
      }
    }
  }

  // Handle Password Reset
  function handleResetPasswordConfirm(newPassword: string) {
    if (!passwordResetUser) return;
    const res = resetUserPassword(passwordResetUser.id, newPassword);
    if (res.ok) {
      toast.success(`Password reset successfully for @${passwordResetUser.username}.`);
      setPasswordResetUser(undefined);
    } else {
      toast.error(res.error);
    }
  }

  const columns = useMemo(
    () =>
      createUserColumns({
        currentUserId: currentUser?.id,
        onEdit: (u) => setEditingUser(u),
        onResetPassword: (u) => setPasswordResetUser(u),
        onToggleStatus: handleToggleStatus,
        onDelete: handleDeleteUser,
      }),
    [currentUser?.id],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & User Management"
        description="Add staff, librarians, principals, and configure institutional access credentials."
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <UserPlus className="size-4" />
            Add Staff, Librarian or Principal
          </Button>
        }
      />

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Staff Users"
          value={stats.total}
          icon={Users}
          accent="primary"
          note={`${stats.librarians + stats.staff} circulation operators`}
        />
        <StatCard
          title="Librarians"
          value={stats.librarians}
          icon={BookOpen}
          accent="accent"
          note="Full catalogue & circulation"
        />
        <StatCard
          title="Staff (College Staff)"
          value={stats.staff}
          icon={ShieldCheck}
          accent="primary"
          note="Desk & circulation duties"
        />
        <StatCard
          title="Principal Accounts"
          value={stats.principals}
          icon={GraduationCap}
          accent="warning"
          note="Executive reports oversight"
        />
      </div>

      {/* Instructional helper card */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/60 p-4 text-xs text-primary-900">
        <div className="flex items-start gap-2.5">
          <Shield className="mt-0.5 size-4 shrink-0 text-primary-600" />
          <div className="space-y-1">
            <p className="font-semibold text-primary-950">How Staff User Access Works</p>
            <p className="text-primary-800">
              When an Administrator creates a new user and selects their role from the dropdown (
              <span className="font-medium">Admin</span>, <span className="font-medium">Librarian</span>, <span className="font-medium">Staff (College Staff)</span>, or{' '}
              <span className="font-medium">Principal</span>), the user can immediately log in on the login page via the{' '}
              <span className="font-medium">Staff Login</span> tab using their assigned username and password.
            </p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredUsers}
        columns={columns}
        searchPlaceholder="Search by name, username, or email..."
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'All' | Role)}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-xs font-medium text-ink focus:border-primary-400 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="librarian">Librarians</option>
              <option value="staff">Staff (College Staff)</option>
              <option value="principal">Principals</option>
              <option value="admin">Administrators</option>
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | UserStatus)}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-xs font-medium text-ink focus:border-primary-400 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        }
        emptyState={{
          title: 'No staff users found',
          description: 'Try adjusting your search query or role filter, or add a new user.',
          action: {
            label: 'Add New User',
            onClick: () => setIsAddModalOpen(true),
          },
        }}
      />

      {/* Add User Modal */}
      <UserFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={!!editingUser}
        existingUser={editingUser}
        onClose={() => setEditingUser(undefined)}
        onSubmit={handleEditUser}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        user={passwordResetUser}
        isOpen={!!passwordResetUser}
        onClose={() => setPasswordResetUser(undefined)}
        onConfirm={handleResetPasswordConfirm}
      />
    </div>
  );
}
