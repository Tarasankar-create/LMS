import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Loan } from '@/types';
import { useSettingsStore } from './settingsStore';
import { useBooksStore } from './booksStore';
import { useFinesStore } from './finesStore';
import { useReservationsStore } from './reservationsStore';
import { useMembersStore } from './membersStore';
import { useCopiesStore } from './copiesStore';
import { useRequestsStore } from './requestsStore';
import { calculateDueDate, calculateRenewedDueDate, canIssueMoreBooks, canRenew } from '@/utils/loanCalculator';
import { calculateFine } from '@/utils/fineCalculator';
import { overdueDays, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

export type IssueResult = { success: true; loan: Loan } | { success: false; error: string };
export type ReturnResult = { success: true; loan: Loan; fineAmount: number } | { success: false; error: string };
export type RenewResult = { success: true; loan: Loan } | { success: false; error: string };

interface LoansState {
  loans: Loan[];
  setLoans: (loans: Loan[]) => void;
  issueBook: (memberId: string, accessionNumber: string, copyBarcode?: string) => IssueResult;
  returnBook: (loanId: string) => ReturnResult;
  renewLoan: (loanId: string) => RenewResult;
  getActiveByMember: (memberId: string) => Loan[];
  getHistoryByMember: (memberId: string) => Loan[];
  getOverdue: () => Loan[];
  getIssuedToday: () => Loan[];
  getActive: () => Loan[];
  getReturned: () => Loan[];
}

export const useLoansStore = create<LoansState>()(
  persist(
    (set, get) => ({
      loans: [],
      setLoans: (loans) => set({ loans }),

      issueBook: (memberId, accessionNumber, copyBarcode) => {
        const { settings } = useSettingsStore.getState();
        const book = useBooksStore.getState().getByAccession(accessionNumber);

        if (!book) return { success: false, error: 'Book not found for that accession number.' };
        if (book.status === 'Retired') return { success: false, error: 'This book has been retired and cannot be issued.' };
        if (book.libraryUseOnly) return { success: false, error: 'This title is library-use-only and cannot be issued out.' };

        const copiesApi = useCopiesStore.getState();
        let copy;
        if (copyBarcode) {
          copy = copiesApi.getByBarcode(copyBarcode);
          if (!copy || copy.accessionNumber !== accessionNumber) {
            return { success: false, error: 'That barcode does not match this book.' };
          }
          if (copy.status === 'Issued') return { success: false, error: 'This copy is already issued to another member.' };
          if (copy.status === 'Lost' || copy.status === 'Damaged') {
            return { success: false, error: `This copy is marked ${copy.status} and cannot be issued.` };
          }
          if (copy.status === 'Held') {
            const heldFor = useRequestsStore.getState().findApprovedByCopy(copy.barcode);
            if (heldFor && heldFor.memberId !== memberId) {
              return { success: false, error: 'This copy is held for another member\'s approved request.' };
            }
          }
        } else {
          if (book.availableCopies <= 0) return { success: false, error: 'No copies of this book are currently available.' };
          copy = copiesApi.pickAvailable(accessionNumber);
          if (!copy) return { success: false, error: 'No copies of this book are currently available.' };
        }

        const activeLoans = get().getActiveByMember(memberId);
        if (!canIssueMoreBooks(activeLoans, settings)) {
          return {
            success: false,
            error: `This member already has ${activeLoans.length} active loan(s), the maximum allowed (${settings.maxConcurrentLoans}).`,
          };
        }

        const issueDate = todayISO();
        const loan: Loan = {
          id: generateId('loan'),
          memberId,
          accessionNumber,
          bookId: book.id,
          bookTitle: book.title,
          copyBarcode: copy.barcode,
          issueDate,
          dueDate: calculateDueDate(issueDate, settings),
          status: 'Active',
          renewalCount: 0,
        };

        set((state) => ({ loans: [loan, ...state.loans] }));
        copiesApi.setStatus(copy.barcode, 'Issued');

        const fulfilledRequest = useRequestsStore.getState().findApprovedByCopy(copy.barcode);
        if (fulfilledRequest) useRequestsStore.getState().markIssued(fulfilledRequest.id, loan.id);

        return { success: true, loan };
      },

      returnBook: (loanId) => {
        const loan = get().loans.find((l) => l.id === loanId);
        if (!loan) return { success: false, error: 'Loan record not found.' };
        if (loan.status === 'Returned') return { success: false, error: 'This loan has already been returned.' };

        const { settings } = useSettingsStore.getState();
        const returnDate = todayISO();
        const { days, amount } = calculateFine(loan.dueDate, settings, returnDate);

        // A loan that was already overdue before this return may already have a
        // seed-generated "live estimate" Pending fine (see data/fines.ts) — finalize
        // that one instead of creating a duplicate for the same loan.
        const existingFine = useFinesStore.getState().getPendingByLoan(loan.id);
        let fineId: string | undefined = existingFine?.id;
        if (amount > 0) {
          if (existingFine) {
            useFinesStore.getState().finalizeFine(existingFine.id, amount, days);
          } else {
            const member = useMembersStore.getState().getByMemberId(loan.memberId);
            const fine = useFinesStore.getState().createFine({
              loanId: loan.id,
              memberId: loan.memberId,
              memberName: member?.name ?? 'Unknown Member',
              bookTitle: loan.bookTitle,
              overdueDays: days,
              amount,
            });
            fineId = fine.id;
          }
        }

        const updatedLoan: Loan = { ...loan, status: 'Returned', returnDate, fineId };
        set((state) => ({ loans: state.loans.map((l) => (l.id === loanId ? updatedLoan : l)) }));

        useCopiesStore.getState().setStatus(loan.copyBarcode, 'Available');
        useReservationsStore.getState().promoteNext(loan.accessionNumber);

        return { success: true, loan: updatedLoan, fineAmount: amount };
      },

      renewLoan: (loanId) => {
        const loan = get().loans.find((l) => l.id === loanId);
        if (!loan) return { success: false, error: 'Loan record not found.' };

        const hasPending = useReservationsStore.getState().hasPendingReservation(loan.accessionNumber);
        const check = canRenew(loan, hasPending);
        if (!check.allowed) return { success: false, error: check.reason ?? 'Renewal not allowed.' };

        const { settings } = useSettingsStore.getState();
        const updatedLoan: Loan = {
          ...loan,
          dueDate: calculateRenewedDueDate(loan, settings),
          renewalCount: 1,
        };
        set((state) => ({ loans: state.loans.map((l) => (l.id === loanId ? updatedLoan : l)) }));
        return { success: true, loan: updatedLoan };
      },

      getActiveByMember: (memberId) =>
        get().loans.filter((l) => l.memberId === memberId && l.status === 'Active'),
      getHistoryByMember: (memberId) => get().loans.filter((l) => l.memberId === memberId),
      getOverdue: () => get().loans.filter((l) => l.status === 'Active' && overdueDays(l.dueDate) > 0),
      getIssuedToday: () => get().loans.filter((l) => l.issueDate === todayISO()),
      getActive: () => get().loans.filter((l) => l.status === 'Active'),
      getReturned: () => get().loans.filter((l) => l.status === 'Returned'),
    }),
    { name: 'psc-lms-loans' },
  ),
);
