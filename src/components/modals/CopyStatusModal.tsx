import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { useCopiesStore } from '@/store/copiesStore';
import type { BookCopy, CopyStatus } from '@/types';

interface CopyStatusModalProps {
  copy: BookCopy | null;
  onClose: () => void;
}

export function CopyStatusModal({ copy, onClose }: CopyStatusModalProps) {
  const [status, setStatus] = useState<CopyStatus>(copy?.status ?? 'Available');
  const [reason, setReason] = useState<string>(copy?.statusReason ?? '');

  const updateCopyStatus = useCopiesStore((s) => s.updateCopyStatus);

  if (!copy) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!copy) return;

    if (['Lost', 'Damaged', 'Withdrawn'].includes(status) && !reason.trim()) {
      toast.error('Please enter a reason or remarks for audit records (FR-CAT-05).');
      return;
    }

    updateCopyStatus(copy.barcode, status, reason.trim() || undefined);
    toast.success(`Copy ${copy.barcode} status updated to ${status}.`);
    onClose();
  }

  return (
    <Modal isOpen={Boolean(copy)} onClose={onClose} title={`Manage Physical Copy: ${copy.barcode}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-secondary-200 bg-secondary-50/70 p-3 text-xs text-secondary-600">
          <p>
            <strong>Copy Number:</strong> #{copy.copyNumber} · <strong>Accession No:</strong> {copy.accessionNumber}
          </p>
          <p className="mt-1">
            <strong>Current Status:</strong> {copy.status}
          </p>
          {copy.statusReason && (
            <p className="mt-1 text-danger-700">
              <strong>Previous Reason:</strong> {copy.statusReason}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-secondary-700">Update Inventory Status (FR-CAT-05)</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CopyStatus)}
            className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="Available">Available (In circulation)</option>
            <option value="Lost">Lost (Missing from inventory)</option>
            <option value="Damaged">Damaged (Needs repair or rebinding)</option>
            <option value="Withdrawn">Withdrawn (Permanently removed from collection)</option>
          </select>
        </div>

        {['Lost', 'Damaged', 'Withdrawn'].includes(status) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary-700">Reason / Audit Remarks *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Lost in transit, Water damaged during monsoon, Discarded per annual committee resolution..."
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-secondary-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Status</Button>
        </div>
      </form>
    </Modal>
  );
}
