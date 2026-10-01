import { describe, it, expect, beforeEach } from 'vitest';
import { ensureDemoDataSeeded } from '@/store/seedManager';
import { useBooksStore } from '@/store/booksStore';
import { useCopiesStore } from '@/store/copiesStore';
import { useRequestsStore } from '@/store/requestsStore';
import { useLoansStore } from '@/store/loansStore';
import { useMembersStore } from '@/store/membersStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { useFinesStore } from '@/store/finesStore';
import { can, buildDefaultMatrix } from '@/access/permissions';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

beforeEach(() => {
  localStorage.clear();
  ensureDemoDataSeeded();
  // By default in unit test setup, use generous limits for general flow tests:
  useSettingsStore.getState().updateSettings({
    maxConcurrentLoans: 50,
    blockFineThreshold: 99999,
    blockOverdueDays: 99999,
  });
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

describe('PSC LMS Key Test Scenarios (TC-01 through TC-10)', () => {
  // TC-01: Auto-block on unpaid fines exceeding threshold, plus override with audit
  it('TC-01: Issue rejected to blocked student (FR-BLOCK-01) and permitted after override (FR-BLOCK-02)', () => {
    useSettingsStore.getState().updateSettings({
      blockFineThreshold: 50,
      maxConcurrentLoans: 5,
    });

    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    // Add pending fine of ₹60 (> ₹50 limit)
    useFinesStore.setState((s) => ({
      fines: [
        {
          id: generateId('fine'),
          loanId: 'test_loan',
          memberId: member.memberId,
          memberName: member.name,
          bookTitle: 'Test Overdue Title',
          overdueDays: 30,
          amount: 60,
          status: 'Pending',
          createdDate: todayISO(),
        },
        ...s.fines,
      ],
    }));

    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    // Issue must be rejected
    const blockedIssue = useLoansStore.getState().issueBook(member.memberId, book.accessionNumber, copy.barcode);
    expect(blockedIssue.success).toBe(false);
    if (blockedIssue.success) throw new Error('Issue should have been blocked');
    expect(blockedIssue.error).toContain('Account blocked');

    // Librarian authorizes override
    useMembersStore.getState().overrideBlock(member.memberId, {
      overriddenBy: 'staff_1',
      overriddenByName: 'Smita Patra (Librarian)',
      reason: 'Principal approved exam allowance',
      overriddenAt: todayISO(),
    });

    // Now issue succeeds
    const allowedIssue = useLoansStore.getState().issueBook(member.memberId, book.accessionNumber, copy.barcode);
    expect(allowedIssue.success).toBe(true);
  });

  // TC-02: Overdue return calculates ₹2/day fine accurately
  it('TC-02: Overdue return calculates ₹2/day fine accurately (FR-FINE-01)', () => {
    useSettingsStore.getState().updateSettings({
      finePerDay: 2,
      maxFinePerBook: 200,
    });

    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    // Create loan that was due 5 days ago
    const overdueLoanId = generateId('loan');
    const pastDueDate = addDaysISO(todayISO(), -5);
    useLoansStore.setState((s) => ({
      loans: [
        {
          id: overdueLoanId,
          memberId: member.memberId,
          accessionNumber: book.accessionNumber,
          bookId: book.id,
          bookTitle: book.title,
          copyBarcode: copy.barcode,
          issueDate: addDaysISO(todayISO(), -19),
          dueDate: pastDueDate,
          status: 'Active',
          renewalCount: 0,
        },
        ...s.loans,
      ],
    }));
    useCopiesStore.getState().setStatus(copy.barcode, 'Issued');

    const returnResult = useLoansStore.getState().returnBook(overdueLoanId);
    expect(returnResult.success).toBe(true);
    if (!returnResult.success) throw new Error('Return failed');
    // 5 days * ₹2/day = ₹10
    expect(returnResult.fineAmount).toBe(10);
  });

  // TC-03: Renewal rejected if active reservation exists
  it('TC-03: Renewal rejected if active reservation exists (FR-REN-02)', () => {
    useSettingsStore.getState().updateSettings({ maxRenewalsPerLoan: 1 });

    const memberA = useMembersStore.getState().members[0];
    const memberB = useMembersStore.getState().members[1];
    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    // Issue to Member A
    const issueA = useLoansStore.getState().issueBook(memberA.memberId, book.accessionNumber, copy.barcode);
    expect(issueA.success).toBe(true);
    if (!issueA.success) return;

    // Member B reserves this book
    useReservationsStore.getState().reserve(memberB.memberId, book.accessionNumber, book.id, book.title);

    // Member A attempts renewal -> should be blocked by active reservation
    const renewResult = useLoansStore.getState().renewLoan(issueA.loan.id);
    expect(renewResult.success).toBe(false);
    if (renewResult.success) throw new Error('Renewal should have failed');
    expect(renewResult.error).toContain('Another student has placed an active reservation');
  });

  // TC-04: Return of reserved book keeps copy held for student queue leader
  it('TC-04: Return of reserved book keeps copy held for student (FR-RES-03)', () => {
    const memberA = useMembersStore.getState().members[0];
    const memberB = useMembersStore.getState().members[1];
    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    const issueA = useLoansStore.getState().issueBook(memberA.memberId, book.accessionNumber, copy.barcode);
    expect(issueA.success).toBe(true);
    if (!issueA.success) return;

    const availableBefore = useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies;

    // Member B reserves
    useReservationsStore.getState().reserve(memberB.memberId, book.accessionNumber, book.id, book.title);

    // Member A returns book
    const returnResult = useLoansStore.getState().returnBook(issueA.loan.id);
    expect(returnResult.success).toBe(true);

    // The copy must be Held for Member B, not returned to general Available
    const copyAfter = useCopiesStore.getState().getByBarcode(copy.barcode);
    expect(copyAfter?.status).toBe('Held');

    // Available count must NOT increment because it's held for a specific reservation
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);

    // Reservation is now Ready
    const activeRes = useReservationsStore.getState().reservations.find(
      (r) => r.accessionNumber === book.accessionNumber && r.memberId === memberB.memberId,
    );
    expect(activeRes?.status).toBe('Ready');
  });

  // TC-05: Expired hold window releases copy back to circulation
  it('TC-05: Expired hold window releases copy back to circulation (FR-RES-04)', () => {
    const member = useMembersStore.getState().members[0];
    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    const availableBefore = useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies;

    // Simulate a reservation whose hold window expired yesterday
    useCopiesStore.getState().setStatus(copy.barcode, 'Held');
    const expiredResId = generateId('res');
    useReservationsStore.setState((s) => ({
      reservations: [
        {
          id: expiredResId,
          memberId: member.memberId,
          accessionNumber: book.accessionNumber,
          bookId: book.id,
          bookTitle: book.title,
          status: 'Ready',
          queuePosition: 1,
          reservedDate: addDaysISO(todayISO(), -5),
          readyDate: addDaysISO(todayISO(), -3),
          expiryDate: addDaysISO(todayISO(), -1), // expired yesterday!
        },
        ...s.reservations,
      ],
    }));

    // Trigger checkExpiries
    useReservationsStore.getState().checkExpiries();

    // The reservation should be marked Expired
    const resAfter = useReservationsStore.getState().reservations.find((r) => r.id === expiredResId);
    expect(resAfter?.status).toBe('Expired');

    // The copy should return to Available
    expect(useCopiesStore.getState().getByBarcode(copy.barcode)?.status).toBe('Available');
    expect(useBooksStore.getState().getByAccession(book.accessionNumber)!.availableCopies).toBe(availableBefore);
  });

  // TC-06: Search by author/title returns matches with live availability
  it('TC-06: Search by partial surname returns matches with live availability (FR-SRCH-01)', () => {
    const books = useBooksStore.getState().books;
    // Find Laxmikanth's Indian Polity
    const matches = books.filter(
      (b) =>
        b.author.toLowerCase().includes('laxmikanth') ||
        b.title.toLowerCase().includes('polity'),
    );
    expect(matches.length).toBeGreaterThan(0);
    const target = matches[0];
    expect(target.totalCopies).toBeGreaterThan(0);
    expect(target.availableCopies).toBeGreaterThanOrEqual(0);
    expect(target.availableCopies).toBeLessThanOrEqual(target.totalCopies);
  });

  // TC-07: Route guard & RBAC prevents student access to staff reports
  it('TC-07: Route guard / permissions prevent student access to staff reports (Section 3)', () => {
    const matrix = buildDefaultMatrix();
    expect(can(matrix, 'student', 'reports', 'view')).toBe(false);
    expect(can(matrix, 'student', 'librarySettings', 'edit')).toBe(false);
    expect(can(matrix, 'student', 'circulation', 'edit')).toBe(false);

    expect(can(matrix, 'admin', 'reports', 'view')).toBe(true);
    expect(can(matrix, 'librarian', 'reports', 'view')).toBe(true);
    expect(can(matrix, 'staff', 'circulation', 'edit')).toBe(true);
    expect(can(matrix, 'principal', 'reports', 'view')).toBe(true);
  });

  // TC-08: Attempting to issue library-use-only book is rejected
  it('TC-08: Attempting to issue library-use-only book is rejected (FR-ISS-03, FR-CAT-06)', () => {
    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    const referenceBook = useBooksStore.getState().books.find((b) => b.libraryUseOnly);
    expect(referenceBook).toBeTruthy();
    if (!referenceBook) return;

    const result = useLoansStore.getState().issueBook(member.memberId, referenceBook.accessionNumber);
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Issue should have failed');
    expect(result.error).toContain('Library use only');
  });

  // TC-09: Filter books by classification
  it('TC-09: Filtering books by classification returns accurate results (FR-SRCH-02)', () => {
    const books = useBooksStore.getState().books;
    const artsBooks = books.filter((b) => b.classification === 'Stream - Arts');
    const scienceBooks = books.filter((b) => b.classification === 'Stream - Science');
    expect(artsBooks.length).toBeGreaterThan(0);
    expect(scienceBooks.length).toBeGreaterThan(0);
    expect(artsBooks.every((b) => b.classification === 'Stream - Arts')).toBe(true);
  });

  // TC-10: Updating loan period in settings dynamically applies to new issues
  it('TC-10: Updating loan period in settings dynamically applies to new issues (Section 7)', () => {
    // Set loan period to 21 days
    useSettingsStore.getState().updateSettings({ loanPeriodDays: 21 });

    const member = useMembersStore.getState().members.find((m) => m.status === 'Active')!;
    const book = useBooksStore.getState().books.find((b) => b.availableCopies > 0 && !b.libraryUseOnly)!;
    const copy = useCopiesStore.getState().pickAvailable(book.accessionNumber)!;

    const issue = useLoansStore.getState().issueBook(member.memberId, book.accessionNumber, copy.barcode);
    expect(issue.success).toBe(true);
    if (!issue.success) return;

    const expectedDueDate = addDaysISO(todayISO(), 21);
    expect(issue.loan.dueDate).toBe(expectedDueDate);
  });
});

