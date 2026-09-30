import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Fine } from '@/types';
import { todayISO } from '@/utils/date';
import { generateId } from '@/utils/id';

interface FinesState {
  fines: Fine[];
  setFines: (fines: Fine[]) => void;
  createFine: (input: Omit<Fine, 'id' | 'status' | 'createdDate'>) => Fine;
  finalizeFine: (fineId: string, amount: number, overdueDays: number) => void;
  getPendingByLoan: (loanId: string) => Fine | undefined;
  collectPayment: (fineId: string) => void;
  waiveFine: (fineId: string, reason: string) => void;
  totalsByStatus: () => { pending: number; collected: number; waived: number };
  getByMember: (memberId: string) => Fine[];
}

export const useFinesStore = create<FinesState>()(
  persist(
    (set, get) => ({
      fines: [],
      setFines: (fines) => set({ fines }),

      createFine: (input) => {
        const fine: Fine = { ...input, id: generateId('fine'), status: 'Pending', createdDate: todayISO() };
        set((state) => ({ fines: [fine, ...state.fines] }));
        return fine;
      },

      finalizeFine: (fineId, amount, overdueDays) =>
        set((state) => ({
          fines: state.fines.map((f) => (f.id === fineId ? { ...f, amount, overdueDays } : f)),
        })),

      getPendingByLoan: (loanId) => get().fines.find((f) => f.loanId === loanId && f.status === 'Pending'),

      collectPayment: (fineId) =>
        set((state) => ({
          fines: state.fines.map((f) =>
            f.id === fineId ? { ...f, status: 'Collected', collectedDate: todayISO() } : f,
          ),
        })),

      waiveFine: (fineId, reason) =>
        set((state) => ({
          fines: state.fines.map((f) => (f.id === fineId ? { ...f, status: 'Waived', reason } : f)),
        })),

      totalsByStatus: () => {
        const fines = get().fines;
        return {
          pending: fines.filter((f) => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0),
          collected: fines.filter((f) => f.status === 'Collected').reduce((sum, f) => sum + f.amount, 0),
          waived: fines.filter((f) => f.status === 'Waived').reduce((sum, f) => sum + f.amount, 0),
        };
      },

      getByMember: (memberId) => get().fines.filter((f) => f.memberId === memberId),
    }),
    { name: 'psc-lms-fines' },
  ),
);
