import { useMemo, useState } from 'react';
import { ScanLine, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useMembersStore } from '@/store/membersStore';
import { useBooksStore } from '@/store/booksStore';
import { useCopiesStore } from '@/store/copiesStore';
import { useRequestsStore } from '@/store/requestsStore';
import { useLoansStore } from '@/store/loansStore';
import { useSettingsStore } from '@/store/settingsStore';
import { calculateDueDate, canIssueMoreBooks } from '@/utils/loanCalculator';
import { formatDate, todayISO } from '@/utils/date';
import type { Book, BookCopy, Member } from '@/types';

interface IssueBookFormProps {
  onIssued?: () => void;
  lockMember?: Member;
}

export function IssueBookForm({ onIssued, lockMember }: IssueBookFormProps) {
  const members = useMembersStore((s) => s.members);
  const getByMemberId = useMembersStore((s) => s.getByMemberId);
  const books = useBooksStore((s) => s.books);
  const getByBarcode = useCopiesStore((s) => s.getByBarcode);
  const findApprovedByCopy = useRequestsStore((s) => s.findApprovedByCopy);
  const issueBook = useLoansStore((s) => s.issueBook);
  const getActiveByMember = useLoansStore((s) => s.getActiveByMember);
  const settings = useSettingsStore((s) => s.settings);

  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | undefined>(lockMember);
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | undefined>();
  const [scannedCopy, setScannedCopy] = useState<BookCopy | undefined>();
  const [scanValue, setScanValue] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const memberMatches = useMemo(() => {
    if (!memberQuery.trim() || selectedMember) return [];
    const q = memberQuery.trim().toLowerCase();
    return members
      .filter((m) => m.status === 'Active')
      .filter((m) => m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q) || m.rollNumber.includes(q))
      .slice(0, 6);
  }, [memberQuery, members, selectedMember]);

  const bookMatches = useMemo(() => {
    if (!bookQuery.trim() || selectedBook) return [];
    const q = bookQuery.trim().toLowerCase();
    return books
      .filter((b) => b.status !== 'Retired' && !b.libraryUseOnly)
      .filter((b) => b.title.toLowerCase().includes(q) || b.accessionNumber.toLowerCase().includes(q))
      .slice(0, 6);
  }, [bookQuery, books, selectedBook]);

  function clearBookSelection() {
    setSelectedBook(undefined);
    setBookQuery('');
    setScannedCopy(undefined);
    setScanValue('');
    setScanError(null);
  }

  /** A USB/Bluetooth scanner types the barcode then an Enter — this field just reacts to that. */
  function handleScan() {
    const raw = scanValue.trim();
    if (!raw) return;
    const copy = getByBarcode(raw);
    if (!copy) {
      setScanError('No copy found for that barcode.');
      return;
    }
    const book = books.find((b) => b.accessionNumber === copy.accessionNumber);
    if (!book) {
      setScanError('That copy is not linked to a known book.');
      return;
    }

    if (copy.status === 'Held') {
      const heldFor = findApprovedByCopy(copy.barcode);
      if (heldFor) {
        if (selectedMember && selectedMember.memberId !== heldFor.memberId) {
          setScanError(`This copy is held for a different member's approved request, not ${selectedMember.name}.`);
          return;
        }
        if (!selectedMember) {
          const holder = getByMemberId(heldFor.memberId);
          if (holder) {
            setSelectedMember(holder);
            setMemberQuery('');
          }
        }
      }
    }

    setSelectedBook(book);
    setBookQuery('');
    setScannedCopy(copy);
    setScanError(null);
  }

  const copyIssue = useMemo(() => {
    if (!scannedCopy) return null;
    if (scannedCopy.status === 'Issued') return { blocking: true, message: 'This copy is already issued to another member.' };
    if (scannedCopy.status === 'Lost' || scannedCopy.status === 'Damaged') {
      return { blocking: true, message: `This copy is marked ${scannedCopy.status} and cannot be issued.` };
    }
    if (scannedCopy.status === 'Held') {
      const heldFor = findApprovedByCopy(scannedCopy.barcode);
      if (heldFor && selectedMember && heldFor.memberId !== selectedMember.memberId) {
        return { blocking: true, message: `Held for a different member's approved request, not ${selectedMember.name}.` };
      }
      if (heldFor) return { blocking: false, message: `Fulfils ${selectedMember?.name ?? 'their'} approved request — held since ${formatDate(heldFor.readyDate ?? heldFor.requestedDate)}.` };
    }
    return { blocking: false, message: `Copy ${scannedCopy.barcode} — Available.` };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedCopy, selectedMember]);

  const activeLoansForMember = selectedMember ? getActiveByMember(selectedMember.memberId) : [];
  const memberAtLimit = selectedMember ? !canIssueMoreBooks(activeLoansForMember, settings) : false;
  const dueDatePreview = calculateDueDate(todayISO(), settings);

  const noCopyAvailable = !!selectedBook && !scannedCopy && selectedBook.availableCopies <= 0;
  const canSubmit = !!selectedMember && !!selectedBook && !memberAtLimit && !noCopyAvailable && !copyIssue?.blocking;

  function handleSubmit() {
    if (!selectedMember || !selectedBook) return;
    const result = issueBook(selectedMember.memberId, selectedBook.accessionNumber, scannedCopy?.barcode);
    if (result.success) {
      setFeedback({
        type: 'success',
        message: `Issued "${selectedBook.title}" (${result.loan.copyBarcode}) to ${selectedMember.name}. Due ${formatDate(result.loan.dueDate)}.`,
      });
      clearBookSelection();
      if (!lockMember) {
        setSelectedMember(undefined);
        setMemberQuery('');
      }
      onIssued?.();
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
        <label className="mb-1 block text-sm font-medium text-secondary-700">Member</label>
        {selectedMember ? (
          <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2">
            <div className="text-sm">
              <p className="font-medium text-ink">{selectedMember.name}</p>
              <p className="text-xs text-secondary-500">
                {selectedMember.memberId} · {selectedMember.department}
              </p>
            </div>
            {!lockMember && (
              <button
                onClick={() => setSelectedMember(undefined)}
                className="rounded p-1 text-secondary-500 hover:bg-secondary-200"
                aria-label="Change member"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              aria-label="Search member"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="Search by name, roll number, or member ID"
              className="w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            {memberMatches.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-secondary-100 bg-white shadow-lg">
                {memberMatches.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        setSelectedMember(m);
                        setMemberQuery('');
                      }}
                      className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-secondary-50"
                    >
                      <span className="font-medium text-ink">{m.name}</span>
                      <span className="text-xs text-secondary-500">
                        {m.memberId} · {m.rollNumber}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {selectedMember && (
          <p className="mt-1.5 text-xs text-secondary-500">
            Active loans: {activeLoansForMember.length} / {settings.maxConcurrentLoans}
            {memberAtLimit && <span className="ml-1 font-medium text-danger-600">— limit reached</span>}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary-700">Book</label>
        {selectedBook ? (
          <div className="flex items-center justify-between rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2">
            <div className="text-sm">
              <p className="font-medium text-ink">{selectedBook.title}</p>
              <p className="text-xs text-secondary-500">
                {selectedBook.accessionNumber} · {selectedBook.availableCopies} available
                {scannedCopy && <span className="ml-1 font-mono">· scanned {scannedCopy.barcode}</span>}
              </p>
            </div>
            <button onClick={clearBookSelection} className="rounded p-1 text-secondary-500 hover:bg-secondary-200" aria-label="Change book">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-400" />
              <input
                aria-label="Scan copy barcode"
                value={scanValue}
                onChange={(e) => {
                  setScanValue(e.target.value);
                  setScanError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScan();
                  }
                }}
                placeholder="Scan or type a copy barcode, then press Enter"
                className="w-full rounded-lg border border-secondary-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
            {scanError && <p className="text-xs font-medium text-danger-600">{scanError}</p>}
            <div className="relative">
              <div className="flex items-center gap-2 text-xs text-secondary-400">
                <div className="h-px flex-1 bg-secondary-200" />
                or search
                <div className="h-px flex-1 bg-secondary-200" />
              </div>
              <input
                aria-label="Search book"
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                placeholder="Search by title or accession number"
                className="mt-2 w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {bookMatches.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-secondary-100 bg-white shadow-lg">
                  {bookMatches.map((b) => (
                    <li key={b.id}>
                      <button
                        onClick={() => {
                          setSelectedBook(b);
                          setBookQuery('');
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary-50"
                      >
                        <span>
                          <span className="font-medium text-ink">{b.title}</span>
                          <span className="ml-1.5 text-xs text-secondary-500">{b.accessionNumber}</span>
                        </span>
                        <Badge tone={b.availableCopies > 0 ? 'success' : 'warning'}>{b.availableCopies} avail.</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {copyIssue && (
          <p className={`mt-1.5 text-xs font-medium ${copyIssue.blocking ? 'text-danger-600' : 'text-success-700'}`}>{copyIssue.message}</p>
        )}
        {noCopyAvailable && <p className="mt-1.5 text-xs font-medium text-danger-600">No copies currently available.</p>}
      </div>

      {selectedMember && selectedBook && (
        <div className="rounded-lg border border-dashed border-secondary-200 p-3 text-sm text-secondary-600">
          Issue date: <span className="font-medium text-ink">{formatDate(todayISO())}</span> · Due date:{' '}
          <span className="font-medium text-ink">{formatDate(dueDatePreview)}</span> ({settings.loanPeriodDays}-day loan
          period)
        </div>
      )}

      <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
        Confirm Issue
      </Button>
    </div>
  );
}
