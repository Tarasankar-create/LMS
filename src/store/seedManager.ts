import { seedDemoData } from '@/data/bootstrap';
import { normalizeDepartment } from '@/constants/departments';
import { useBooksStore } from './booksStore';
import { useMembersStore } from './membersStore';
import { useLoansStore } from './loansStore';
import { useFinesStore } from './finesStore';
import { useReservationsStore } from './reservationsStore';
import { useCopiesStore } from './copiesStore';
import { useRequestsStore } from './requestsStore';

const SEEDED_FLAG_KEY = 'psc-lms-seeded-v3';

/** Populates every domain store from the generated demo dataset, once. */
export function ensureDemoDataSeeded(): void {
  // Auto-migrate any existing cached members whose department still has old B.Sc. / B.A. / B.Com format
  const existingMembers = useMembersStore.getState().members;
  if (existingMembers.length > 0) {
    const hasOldFormat = existingMembers.some(
      (m) =>
        m.department.startsWith('B.Sc.') ||
        m.department.startsWith('B.A.') ||
        m.department === 'B.Com' ||
        !['Science', 'Commerce', 'Arts'].includes(m.department),
    );
    if (hasOldFormat) {
      useMembersStore.getState().setMembers(
        existingMembers.map((m) => ({
          ...m,
          department: normalizeDepartment(m.department),
        })),
      );
    }
  }

  if (localStorage.getItem(SEEDED_FLAG_KEY) === 'true') return;

  const data = seedDemoData();
  useBooksStore.getState().setBooks(data.books);
  useMembersStore.getState().setMembers(data.members);
  useLoansStore.getState().setLoans(data.loans);
  useFinesStore.getState().setFines(data.fines);
  useReservationsStore.getState().setReservations(data.reservations);
  useCopiesStore.getState().setCopies(data.copies);
  useRequestsStore.getState().setRequests(data.requests);

  localStorage.setItem(SEEDED_FLAG_KEY, 'true');
}

/** Clears all persisted LMS data and reseeds from scratch (Settings "danger zone" action). */
export function resetDemoData(): void {
  const keys = [
    'psc-lms-auth',
    'psc-lms-settings',
    'psc-lms-books',
    'psc-lms-members',
    'psc-lms-loans',
    'psc-lms-fines',
    'psc-lms-reservations',
    'psc-lms-copies',
    'psc-lms-requests',
    'psc-lms-notices-v3',
    'psc-lms-ui',
    'psc-lms-access',
    'psc-lms-seeded', 
     SEEDED_FLAG_KEY,
  ];
  keys.forEach((key) => localStorage.removeItem(key));
  window.location.reload();
}
