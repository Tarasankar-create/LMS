import type { ColumnDef } from '@tanstack/react-table';
import { KeyRound, Edit2, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/date';
import { ASSIGNABLE_ROLES } from '@/utils/validators/userSchema';

interface UserColumnHandlers {
  currentUserId?: string;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDelete: (user: User) => void;
}

export function createUserColumns({
  currentUserId,
  onEdit,
  onResetPassword,
  onToggleStatus,
  onDelete,
}: UserColumnHandlers): ColumnDef<User, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Staff / User',
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();

        const isSelf = currentUserId === user.id;

        return (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 text-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-ink truncate">{user.name}</span>
                {isSelf && (
                  <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 border border-primary-200">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-secondary-500 truncate">{user.email || 'No email provided'}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'username',
      header: 'Login ID',
      cell: ({ row }) => (
        <span className="rounded bg-secondary-100 px-2 py-0.5 font-mono text-xs font-semibold text-secondary-800">
          @{row.original.username}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        const meta = ASSIGNABLE_ROLES.find((r) => r.value === role);
        return <Badge tone={meta?.badgeTone ?? 'neutral'}>{meta?.label ?? role}</Badge>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-xs text-secondary-600 font-mono">
          {row.original.phone || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge tone={status === 'active' ? 'success' : 'danger'}>
            {status === 'active' ? 'Active' : 'Suspended'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => (
        <div className="text-xs text-secondary-600">
          <p>{formatDate(row.original.createdAt)}</p>
          {row.original.lastLoginAt && (
            <p className="text-[11px] text-secondary-400">
              Last: {formatDate(row.original.lastLoginAt.slice(0, 10))}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = currentUserId === user.id;

        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(user)}
              title="Edit User Details"
            >
              <Edit2 className="size-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResetPassword(user)}
              title="Reset Password"
            >
              <KeyRound className="size-3.5" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={isSelf}
              onClick={() => onToggleStatus(user)}
              title={
                isSelf
                  ? 'Cannot suspend yourself'
                  : user.status === 'active'
                  ? 'Suspend Account'
                  : 'Activate Account'
              }
              className={user.status === 'active' ? 'text-secondary-600 hover:text-danger-600' : 'text-success-600 hover:text-success-700'}
            >
              {user.status === 'active' ? (
                <ShieldAlert className="size-3.5 text-warning-600" />
              ) : (
                <ShieldCheck className="size-3.5 text-success-600" />
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={isSelf}
              onClick={() => onDelete(user)}
              title={isSelf ? 'Cannot delete yourself' : 'Delete User'}
              className="text-secondary-400 hover:text-danger-600"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}
