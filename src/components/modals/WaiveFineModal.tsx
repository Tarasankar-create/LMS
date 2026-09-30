import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { Fine } from '@/types';
import { formatCurrency } from '@/utils/currency';

interface WaiveFineModalProps {
  isOpen: boolean;
  onClose: () => void;
  fine?: Fine;
  onConfirm: (reason: string) => void;
}

export function WaiveFineModal({ isOpen, onClose, fine, onConfirm }: WaiveFineModalProps) {
  const [reason, setReason] = useState('');

  function handleClose() {
    setReason('');
    onClose();
  }

  function handleConfirm() {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Waive Fine"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()}>
            Waive Fine
          </Button>
        </>
      }
    >
      {fine && (
        <div className="mb-4 rounded-lg bg-secondary-50 p-3 text-sm">
          <p className="font-medium text-ink">{fine.bookTitle}</p>
          <p className="text-secondary-500">
            {fine.memberName} · {formatCurrency(fine.amount)}
          </p>
        </div>
      )}
      <label htmlFor="waive-reason" className="mb-1 block text-sm font-medium text-secondary-700">
        Reason for waiver (required)
      </label>
      <textarea
        id="waive-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="e.g. Medical emergency, goodwill waiver for first-time case..."
        className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
    </Modal>
  );
}
