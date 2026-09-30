import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookCopy, CopyStatus } from '@/types';
import { useBooksStore } from './booksStore';
import { generateCopyBarcode } from '@/utils/barcode';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

interface CopiesState {
  copies: BookCopy[];
  setCopies: (copies: BookCopy[]) => void;
  /** Creates `count` new Available copies for a book, numbered after its existing copies. */
  addCopies: (bookId: string, accessionNumber: string, count: number) => BookCopy[];
  getByBarcode: (barcode: string) => BookCopy | undefined;
  getByAccession: (accessionNumber: string) => BookCopy[];
  countAvailable: (accessionNumber: string) => number;
  /** Picks the lowest-numbered Available copy for direct/walk-up issuing. */
  pickAvailable: (accessionNumber: string) => BookCopy | undefined;
  /** Moves one Available copy to Held for an approved request; returns it. */
  holdOne: (accessionNumber: string) => BookCopy | undefined;
  setStatus: (barcode: string, status: CopyStatus) => BookCopy | undefined;
  /** Removes up to `count` currently-Available copies (highest copy numbers first), e.g. when totalCopies is reduced. Returns how many were actually removed. */
  removeAvailableCopies: (accessionNumber: string, count: number) => number;
}

/**
 * Per-copy status is the single source of truth for a book's availability.
 * Every transition into/out of "Available" here also updates Book.availableCopies,
 * so the two can never drift apart.
 */
export const useCopiesStore = create<CopiesState>()(
  persist(
    (set, get) => ({
      copies: [],
      setCopies: (copies) => set({ copies }),

      addCopies: (bookId, accessionNumber, count) => {
        const existing = get().getByAccession(accessionNumber);
        const startNumber = existing.reduce((max, c) => Math.max(max, c.copyNumber), 0) + 1;
        const added: BookCopy[] = Array.from({ length: count }, (_, i) => ({
          id: generateId('copy'),
          barcode: generateCopyBarcode(accessionNumber, startNumber + i),
          accessionNumber,
          bookId,
          copyNumber: startNumber + i,
          status: 'Available',
          addedDate: todayISO(),
        }));
        set((state) => ({ copies: [...state.copies, ...added] }));
        return added;
      },

      getByBarcode: (barcode) => get().copies.find((c) => c.barcode === barcode.trim().toUpperCase()),
      getByAccession: (accessionNumber) => get().copies.filter((c) => c.accessionNumber === accessionNumber),
      countAvailable: (accessionNumber) =>
        get().copies.filter((c) => c.accessionNumber === accessionNumber && c.status === 'Available').length,

      pickAvailable: (accessionNumber) =>
        get()
          .copies.filter((c) => c.accessionNumber === accessionNumber && c.status === 'Available')
          .sort((a, b) => a.copyNumber - b.copyNumber)[0],

      holdOne: (accessionNumber) => {
        const copy = get().pickAvailable(accessionNumber);
        if (!copy) return undefined;
        return get().setStatus(copy.barcode, 'Held');
      },

      setStatus: (barcode, status) => {
        const copy = get().getByBarcode(barcode);
        if (!copy) return undefined;
        const wasAvailable = copy.status === 'Available';
        const becomesAvailable = status === 'Available';
        const updated: BookCopy = { ...copy, status };
        set((state) => ({ copies: state.copies.map((c) => (c.barcode === updated.barcode ? updated : c)) }));
        if (wasAvailable && !becomesAvailable) useBooksStore.getState().decrementAvailable(copy.accessionNumber);
        if (!wasAvailable && becomesAvailable) useBooksStore.getState().incrementAvailable(copy.accessionNumber);
        return updated;
      },

      removeAvailableCopies: (accessionNumber, count) => {
        const removable = get()
          .copies.filter((c) => c.accessionNumber === accessionNumber && c.status === 'Available')
          .sort((a, b) => b.copyNumber - a.copyNumber)
          .slice(0, count);
        if (removable.length === 0) return 0;
        const removeIds = new Set(removable.map((c) => c.id));
        set((state) => ({ copies: state.copies.filter((c) => !removeIds.has(c.id)) }));
        return removable.length;
      },
    }),
    { name: 'psc-lms-copies' },
  ),
);
