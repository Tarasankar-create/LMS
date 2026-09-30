import { describe, it, expect, beforeEach } from 'vitest';
import { ensureDemoDataSeeded } from '@/store/seedManager';
import { useBooksStore } from '@/store/booksStore';
import { useCopiesStore } from '@/store/copiesStore';
import { useRequestsStore } from '@/store/requestsStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  localStorage.clear();
  ensureDemoDataSeeded();
  // The seeded demo data intentionally fills nearly every member's loan slots (a tight,
  // realistic dataset) — raise the cap for these tests so picking "any active member" works.
  useSettingsStore.getState().updateSettings({ maxConcurrentLoans: 50 });
});

describe('student request -> librarian approve -> scan issue -> return', () => {
  it('moves a copy through Available -> Held -> Issued -> Available, keeping counts correct', () => {
    const books = useBooksStore.getState();
    const requests = useRequestsStore.getState();
    const loans = useLoansStore.getState();
    const members = useMembersStore.getState().members;

    const book = books.books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly);
    expect(book).toBeTruthy();
    if (!book) return;
    const maxLoans = useSettingsStore.getState().settings.maxConcurrentLoans;
    const member = members.find(
      (m) => m.status === 'Active' && loans.getActiveByMember(m.memberId).length < maxLoans,
    );
    expect(member).toBeTruthy();
    if (!member) return;

    const availableBefore = books.getByAccession(book.accessionNumber)!.availableCopies;

    // 1. Student requests
    const reqResult = requests.request(member.memberId, book.accessionNumber, book.id, book.title);
    expect(reqResult.success).toBe(true);
    if (!reqResult.success) return;
    expect(reqResult.request.status).toBe('Pending');
    // requesting doesn't touch availability yet
    expect(books.getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);

    // duplicate request blocked
    const dup = useRequestsStore.getState().request(member.memberId, book.accessionNumber, book.id, book.title);
    expect(dup.success).toBe(false);

    // 2. Librarian approves -> holds a specific copy
    const approveResult = useRequestsStore.getState().approve(reqResult.request.id);
    expect(approveResult.success).toBe(true);
    if (!approveResult.success) return;
    const heldBarcode = approveResult.request.heldCopyBarcode!;
    expect(heldBarcode).toBeTruthy();
    expect(useCopiesStore.getState().getByBarcode(heldBarcode)?.status).toBe('Held');
    // a held copy is no longer counted as available
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore - 1);

    // approving again fails (already actioned)
    const reapprove = useRequestsStore.getState().approve(reqResult.request.id);
    expect(reapprove.success).toBe(false);

    // a different member cannot walk up and take the held copy
    const otherMember = members.find(
      (m) => m.status === 'Active' && m.memberId !== member.memberId && loans.getActiveByMember(m.memberId).length < maxLoans,
    )!;
    const wrongIssue = useLoansStore.getState().issueBook(otherMember.memberId, book.accessionNumber, heldBarcode);
    expect(wrongIssue.success).toBe(false);

    // 3. Librarian scans the held copy's barcode for the right member -> issues it
    const issueResult = useLoansStore.getState().issueBook(member.memberId, book.accessionNumber, heldBarcode);
    expect(issueResult.success).toBe(true);
    if (!issueResult.success) return;
    expect(issueResult.loan.copyBarcode).toBe(heldBarcode);
    expect(useCopiesStore.getState().getByBarcode(heldBarcode)?.status).toBe('Issued');
    // the request is marked fulfilled
    const fulfilledRequest = useRequestsStore.getState().requests.find((r) => r.id === reqResult.request.id);
    expect(fulfilledRequest?.status).toBe('Issued');
    expect(fulfilledRequest?.loanId).toBe(issueResult.loan.id);
    // availableCopies did not change again (copy was already excluded while Held)
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore - 1);

    // 4. Returning releases the copy back to Available
    const returnResult = useLoansStore.getState().returnBook(issueResult.loan.id);
    expect(returnResult.success).toBe(true);
    expect(useCopiesStore.getState().getByBarcode(heldBarcode)?.status).toBe('Available');
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);
  });

  it('rejects a request without holding any copy', () => {
    const books = useBooksStore.getState();
    const book = books.books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    const availableBefore = books.getByAccession(book.accessionNumber)!.availableCopies;

    const req = useRequestsStore.getState().request(member.memberId, book.accessionNumber, book.id, book.title);
    expect(req.success).toBe(true);
    if (!req.success) return;

    useRequestsStore.getState().reject(req.request.id, 'Testing rejection');
    const updated = useRequestsStore.getState().requests.find((r) => r.id === req.request.id);
    expect(updated?.status).toBe('Rejected');
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);
  });

  it('walk-up scan issue works without any request', () => {
    const books = useBooksStore.getState();
    const maxLoans = useSettingsStore.getState().settings.maxConcurrentLoans;
    const book = books.books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const member = useMembersStore
      .getState()
      .members.find((m) => m.status === 'Active' && useLoansStore.getState().getActiveByMember(m.memberId).length < maxLoans)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    const issueResult = useLoansStore.getState().issueBook(member.memberId, book.accessionNumber, copy.barcode);
    expect(issueResult.success).toBe(true);
    if (!issueResult.success) return;
    expect(issueResult.loan.copyBarcode).toBe(copy.barcode);
    expect(useCopiesStore.getState().getByBarcode(copy.barcode)?.status).toBe('Issued');
  });

  it('cancelling an approved request releases the held copy', () => {
    const books = useBooksStore.getState();
    const book = books.books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    const availableBefore = books.getByAccession(book.accessionNumber)!.availableCopies;

    const req = useRequestsStore.getState().request(member.memberId, book.accessionNumber, book.id, book.title);
    if (!req.success) throw new Error('setup failed');
    const approved = useRequestsStore.getState().approve(req.request.id);
    if (!approved.success) throw new Error('setup failed');
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore - 1);

    useRequestsStore.getState().cancel(req.request.id);
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);
    expect(useCopiesStore.getState().getByBarcode(approved.request.heldCopyBarcode!)?.status).toBe('Available');
  });
});
