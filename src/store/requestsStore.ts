import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookRequest } from '@/types';
import { useBooksStore } from './booksStore';
import { useCopiesStore } from './copiesStore';
import { useSettingsStore } from './settingsStore';
import { useLoansStore } from './loansStore';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

export type RequestResult = { success: true; request: BookRequest } | { success: false; error: string };
export type ApproveResult = { success: true; request: BookRequest } | { success: false; error: string };

interface RequestsState {
  requests: BookRequest[];
  setRequests: (requests: BookRequest[]) => void;

  /** Student applies to borrow a title. Only offered when the catalogue shows a copy available. */
  request: (memberId: string, accessionNumber: string, bookId: string, bookTitle: string) => RequestResult;
  cancel: (id: string) => void;

  /** Librarian approves: holds one Available copy for the student to collect. */
  approve: (id: string) => ApproveResult;
  reject: (id: string, reason?: string) => void;
  markIssued: (id: string, loanId: string) => void;

  hasOpenRequest: (memberId: string, accessionNumber: string) => boolean;
  countPending: () => number;
  findApprovedByCopy: (barcode: string) => BookRequest | undefined;
  checkExpiries: () => void;
  isAtLoanLimit: (memberId: string) => boolean;
}

export const useRequestsStore = create<RequestsState>()(
  persist(
    (set, get) => ({
      requests: [],
      setRequests: (requests) => set({ requests }),

            request: (memberId, accessionNumber, bookId, bookTitle) => {
        const book = useBooksStore.getState().getByAccession(accessionNumber);
        if (!book) return { success: false, error: 'Book not found.' };
        if (book.libraryUseOnly) return { success: false, error: 'This title is library-use-only and cannot be issued out.' };
        if (book.availableCopies <= 0) {
          return { success: false, error: 'No copies are available right now — reserve this title instead.' };
        }
        if (get().isAtLoanLimit(memberId)) {
          const { maxConcurrentLoans } = useSettingsStore.getState().settings;
          return {
            success: false,
            error: `You already have ${maxConcurrentLoans} book(s) issued, the maximum allowed. Return a book before requesting another.`,
          };
        }
        if (get().hasOpenRequest(memberId, accessionNumber)) {
          return { success: false, error: 'You already have an open request for this title.' };
        }
        const req: BookRequest = {
          id: generateId('req'),
          memberId,
          accessionNumber,
          bookId,
          bookTitle,
          requestedDate: todayISO(),
          status: 'Pending',
        };
        set((state) => ({ requests: [req, ...state.requests] }));
        return { success: true, request: req };
      },

      cancel: (id) =>
        set((state) => ({
          requests: state.requests.map((r) => {
            if (r.id !== id || r.status === 'Issued') return r;
            if (r.status === 'Approved' && r.heldCopyBarcode) {
              useCopiesStore.getState().setStatus(r.heldCopyBarcode, 'Available');
            }
            return { ...r, status: 'Cancelled' as const };
          }),
        })),

      approve: (id) => {
        const req = get().requests.find((r) => r.id === id);
        if (!req) return { success: false, error: 'Request not found.' };
        if (req.status !== 'Pending') return { success: false, error: 'This request has already been actioned.' };

        const copy = useCopiesStore.getState().holdOne(req.accessionNumber);
        if (!copy) return { success: false, error: 'No copies are available to hold for this request anymore.' };

        const { reservationHoldDays } = useSettingsStore.getState().settings;
        const today = todayISO();
        const updated: BookRequest = {
          ...req,
          status: 'Approved',
          heldCopyBarcode: copy.barcode,
          readyDate: today,
          expiryDate: addDaysISO(today, reservationHoldDays),
        };
        set((state) => ({ requests: state.requests.map((r) => (r.id === id ? updated : r)) }));
        return { success: true, request: updated };
      },

      reject: (id, reason) =>
        set((state) => ({
          requests: state.requests.map((r) => (r.id === id && r.status === 'Pending' ? { ...r, status: 'Rejected' as const, rejectReason: reason } : r)),
        })),

      markIssued: (id, loanId) =>
        set((state) => ({ requests: state.requests.map((r) => (r.id === id ? { ...r, status: 'Issued', loanId } : r)) })),

        hasOpenRequest: (memberId, accessionNumber) =>
        get().requests.some(
          (r) => r.memberId === memberId && r.accessionNumber === accessionNumber && (r.status === 'Pending' || r.status === 'Approved'),
        ),

      isAtLoanLimit: (memberId) => {
        const { maxConcurrentLoans } = useSettingsStore.getState().settings;
        return useLoansStore.getState().getActiveByMember(memberId).length >= maxConcurrentLoans;
      },

      countPending: () => get().requests.filter((r) => r.status === 'Pending').length,

      findApprovedByCopy: (barcode) => get().requests.find((r) => r.status === 'Approved' && r.heldCopyBarcode === barcode),

      checkExpiries: () => {
        const today = todayISO();
        const toExpire = get().requests.filter((r) => r.status === 'Approved' && r.expiryDate && r.expiryDate < today);
        toExpire.forEach((r) => {
          if (r.heldCopyBarcode) useCopiesStore.getState().setStatus(r.heldCopyBarcode, 'Available');
        });
        if (toExpire.length === 0) return;
        const expiredIds = new Set(toExpire.map((r) => r.id));
        set((state) => ({ requests: state.requests.map((r) => (expiredIds.has(r.id) ? { ...r, status: 'Expired' as const } : r)) }));
      },
    }),
    { name: 'psc-lms-requests' },
  ),
);
