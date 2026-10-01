import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useMembersStore } from '@/store/membersStore';
import { useAuthStore } from '@/store/authStore';
import { todayISO } from '@/utils/date';
import type { Member } from '@/types';

interface BlockOverrideModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BlockOverrideModal({ member, isOpen, onClose }: BlockOverrideModalProps) {
  const [reason, setReason] = useState('');
  const overrideBlock = useMembersStore((s) => s.overrideBlock);
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!member) return null;
  const currentMember = member;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter a mandatory override justification (FR-BLOCK-02).');
      return;
    }

    overrideBlock(currentMember.memberId, {
      overriddenBy: currentUser?.id ?? 'staff',
      overriddenByName: `${currentUser?.name ?? 'Librarian'} (${currentUser?.role ?? 'Staff'})`,
      reason: reason.trim(),
      overriddenAt: todayISO(),
    });

    toast.success(`Block override applied for ${currentMember.name}. Audit trail updated.`);
    setReason('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Override Circulation Block: ${member.name} (FR-BLOCK-02)`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-warning-200 bg-warning-50/70 p-3 text-xs text-warning-800">
          <p className="font-semibold">Circulation Block Override Authorization</p>
          <p className="mt-1">
            Permits temporary book issue to a student exceeding overdue days or fine limits. This override does not
            waive the underlying fine and records an immutable audit entry per institutional compliance rules.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">
            Override Justification / Reason *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Principal's special exam permission, Hardship extension granted, Fee payment receipt verified..."
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="text-xs text-secondary-500">
          Authorizing Officer: <strong>{currentUser?.name ?? 'Librarian'}</strong> ({currentUser?.role})
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-secondary-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Apply Block Override</Button>
        </div>
      </form>
    </Modal>
  );
}
