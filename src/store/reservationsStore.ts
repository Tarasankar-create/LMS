import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reservation } from '@/types';
import { useSettingsStore } from './settingsStore';
import { useCopiesStore } from './copiesStore';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

interface ReservationsState {
  reservations: Reservation[];
  setReservations: (reservations: Reservation[]) => void;
  reserve: (memberId: string, accessionNumber: string, bookId: string, bookTitle: string) => void;
  cancel: (id: string) => void;
  hasPendingReservation: (accessionNumber: string) => boolean;
  promoteNext: (accessionNumber: string) => Reservation | undefined;
  checkExpiries: () => void;
}

export const useReservationsStore = create<ReservationsState>()(
  persist(
    (set, get) => ({
      reservations: [],
      setReservations: (reservations) => set({ reservations }),

      reserve: (memberId, accessionNumber, bookId, bookTitle) => {
        const waitingCount = get().reservations.filter(
          (r) => r.accessionNumber === accessionNumber && (r.status === 'Waiting' || r.status === 'Ready'),
        ).length;
        const reservation: Reservation = {
          id: generateId('resv'),
          memberId,
          accessionNumber,
          bookId,
          bookTitle,
          queuePosition: waitingCount + 1,
          status: 'Waiting',
          reservedDate: todayISO(),
        };
        set((state) => ({ reservations: [reservation, ...state.reservations] }));
      },

      cancel: (id) =>
        set((state) => ({
          reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r)),
        })),

      hasPendingReservation: (accessionNumber) =>
        get().reservations.some(
          (r) => r.accessionNumber === accessionNumber && (r.status === 'Waiting' || r.status === 'Ready'),
        ),

      promoteNext: (accessionNumber) => {
        const { reservationHoldDays } = useSettingsStore.getState().settings;
        const candidates = get()
          .reservations.filter((r) => r.accessionNumber === accessionNumber && r.status === 'Waiting')
          .sort((a, b) => a.queuePosition - b.queuePosition);
        const next = candidates[0];
        if (!next) return undefined;

        const today = todayISO();
        const updatedReservation: Reservation = {
          ...next,
          status: 'Ready',
          readyDate: today,
          expiryDate: addDaysISO(today, reservationHoldDays),
        };
        set((state) => ({
          reservations: state.reservations.map((r) => (r.id === next.id ? updatedReservation : r)),
        }));
        return updatedReservation;
      },

      checkExpiries: () => {
        const today = todayISO();
        const expiring = get().reservations.filter(
          (r) => r.status === 'Ready' && r.expiryDate && r.expiryDate < today,
        );
        if (expiring.length === 0) return;

        set((state) => ({
          reservations: state.reservations.map((r) => {
            if (r.status === 'Ready' && r.expiryDate && r.expiryDate < today) {
              return { ...r, status: 'Expired' };
            }
            return r;
          }),
        }));

        // Cascade: For any book that lost a Ready reservation, promote next Waiting or release held copy
        const expiredAccessions = new Set(expiring.map((r) => r.accessionNumber));
        expiredAccessions.forEach((accessionNumber) => {
          const nextPromoted = get().promoteNext(accessionNumber);
          if (!nextPromoted) {
            // No further waiting reservations: release one held copy back to general circulation (FR-RES-04)
            const heldCopy = useCopiesStore
              .getState()
              .copies.find((c) => c.accessionNumber === accessionNumber && c.status === 'Held');
            if (heldCopy) {
              useCopiesStore.getState().setStatus(heldCopy.barcode, 'Available');
            }
          }
        });
      },
    }),
    { name: 'psc-lms-reservations' },
  ),
);

