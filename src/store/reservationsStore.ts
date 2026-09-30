import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reservation } from '@/types';
import { useSettingsStore } from './settingsStore';
import { addDaysISO, todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

interface ReservationsState {
  reservations: Reservation[];
  setReservations: (reservations: Reservation[]) => void;
  reserve: (memberId: string, accessionNumber: string, bookId: string, bookTitle: string) => void;
  cancel: (id: string) => void;
  hasPendingReservation: (accessionNumber: string) => boolean;
  promoteNext: (accessionNumber: string) => void;
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
        if (!next) return;

        const today = todayISO();
        set((state) => ({
          reservations: state.reservations.map((r) =>
            r.id === next.id
              ? { ...r, status: 'Ready', readyDate: today, expiryDate: addDaysISO(today, reservationHoldDays) }
              : r,
          ),
        }));
      },

      checkExpiries: () => {
        const today = todayISO();
        set((state) => ({
          reservations: state.reservations.map((r) => {
            if (r.status === 'Ready' && r.expiryDate && r.expiryDate < today) {
              return { ...r, status: 'Expired' };
            }
            return r;
          }),
        }));
        // Cascade: any book that just lost a Ready reservation promotes its next Waiting entry.
        const expiredAccessions = new Set(
          get()
            .reservations.filter((r) => r.status === 'Expired' && r.expiryDate === today)
            .map((r) => r.accessionNumber),
        );
        expiredAccessions.forEach((accessionNumber) => get().promoteNext(accessionNumber));
      },
    }),
    { name: 'psc-lms-reservations' },
  ),
);
