import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { useMembersStore } from '@/store/membersStore';
import { useAccessStore } from '@/access/accessStore';
import { ROLE_META } from '@/access/permissions';

export function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const getByMemberId = useMembersStore((s) => s.getByMemberId);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const changeOwnPassword = useAccessStore((s) => s.changeOwnPassword);

  const member = currentUser?.memberId ? getByMemberId(currentUser.memberId) : undefined;

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    const result = changeOwnPassword(currentUser.id, currentPassword, newPassword);
    if (result.ok) {
      toast.success('Password updated. Use the new password next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      toast.error(result.error);
    }
  }

  if (!currentUser) return null;

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Avatar name={currentUser.name} size="lg" />
            <p className="mt-3 font-semibold text-ink">{currentUser.name}</p>
            <Badge tone="primary" className="mt-2">
              {ROLE_META[currentUser.role].label}
            </Badge>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-secondary-500">Username</dt>
              <dd className="font-medium text-ink">{currentUser.username}</dd>
            </div>
            {currentUser.email && (
              <div>
                <dt className="text-secondary-500">Email</dt>
                <dd className="font-medium text-ink">{currentUser.email}</dd>
              </div>
            )}
            {member && (
              <>
                <div>
                  <dt className="text-secondary-500">Member ID</dt>
                  <dd className="font-medium text-ink">{member.memberId}</dd>
                </div>
                <div>
                  <dt className="text-secondary-500">Department</dt>
                  <dd className="font-medium text-ink">{member.department}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-ink">Change Password</h3>
          <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
            <div>
              <label htmlFor="current-password" className="mb-1 block text-sm font-medium text-secondary-700">
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-secondary-700">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <Button type="submit">Update Password</Button>
            <p className="text-xs text-secondary-500">
              Demo build: the password is stored in this browser only (minimum 6 characters).
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
