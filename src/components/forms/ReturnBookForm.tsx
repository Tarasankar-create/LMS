import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useSettingsStore } from '@/store/settingsStore';
import { calculateFine } from '@/utils/fineCalculator';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Loan } from '@/types';

export function ReturnBookForm({ onReturned }: { onReturned?: () => void }) {
  const loans = useLoansStore((s) => s.loans);
  const returnBook = useLoansStore((s) => s.returnBook);
  const members = useMembersStore((s) => s.members);
  const settings = useSettingsStore((s) => s.settings);

  const [query, setQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | undefined>();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'Active'), [loans]);

  const matches = useMemo(() => {
    if (!query.trim() || selectedLoan) return [];
    const q = query.trim().toLowerCase();
    return activeLoans
      .filter(
        (l) =>
          l.memberId.toLowerCase().includes(q) ||
          l.accessionNumber.toLowerCase().includes(q) ||
          l.copyBarcode.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, activeLoans, selectedLoan]);

  function memberName(memberId: string) {
    return members.find((m) => m.memberId === memberId)?.name ?? memberId;
  }

  const finePreview = selectedLoan ? calculateFine(selectedLoan.dueDate, settings) : null;

  function handleReturn() {
    if (!selectedLoan) return;
    const result = returnBook(selectedLoan.id);
    if (result.success) {
      setFeedback({
        type: 'success',
        message:
          result.fineAmount > 0
            ? `Book returned. A fine of ${formatCurrency(result.fineAmount)} has been recorded.`
            : 'Book returned on time — no fine due.',
      });
      setSelectedLoan(undefined);
      setQuery('');
      onReturned?.();
    } else {
      setFeedback({ type: 'error', message: result.error });
    }
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            feedback.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Scan Copy Barcode, or Search</label>
        {selectedLoan ? (
          <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2">
            <div className="text-sm">
              <p className="font-medium text-ink">{selectedLoan.bookTitle}</p>
              <p className="text-xs text-secondary-500">
                {memberName(selectedLoan.memberId)} · <span className="font-mono">{selectedLoan.copyBarcode}</span>
              </p>
            </div>
            <button
              onClick={() => setSelectedLoan(undefined)}
              className="rounded p-1 text-secondary-500 hover:bg-secondary-200"
              aria-label="Change loan"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              aria-label="Search active loan"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matches.length === 1) {
                  e.preventDefault();
                  setSelectedLoan(matches[0]);
                  setQuery('');
                }
              }}
              placeholder="Scan a copy barcode, or type a member/accession number"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {matches.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-secondary-100 bg-white shadow-lg">
                {matches.map((loan) => (
                  <li key={loan.id}>
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setQuery('');
                      }}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary-50"
                    >
                      <span className="font-medium text-ink">{loan.bookTitle}</span>
                      <span className="text-xs text-secondary-500">
                        {memberName(loan.memberId)} · <span className="font-mono">{loan.copyBarcode}</span> · Due {formatDate(loan.dueDate)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && matches.length === 0 && (
              <p className="mt-1.5 text-xs text-secondary-500">No active loan matches that search.</p>
            )}
          </div>
        )}
      </div>

      {selectedLoan && finePreview && (
        <div className="space-y-2 rounded-lg border border-dashed border-secondary-200 p-3 text-sm">
          <div className="flex justify-between text-secondary-600">
            <span>Due Date</span>
            <span className="font-medium text-ink">{formatDate(selectedLoan.dueDate)}</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Overdue Days</span>
            <span className={`font-medium ${finePreview.days > 0 ? 'text-danger-600' : 'text-ink'}`}>{finePreview.days}</span>
          </div>
          <div className="flex justify-between text-secondary-600">
            <span>Fine Amount</span>
            {finePreview.amount > 0 ? (
              <Badge tone="danger">{formatCurrency(finePreview.amount)}</Badge>
            ) : (
              <Badge tone="success">No Fine</Badge>
            )}
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!selectedLoan} onClick={handleReturn}>
        Confirm Return
      </Button>
    </div>
  );
}
