import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Journal, JournalPublishStatus } from '@/types';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

export interface JournalsState {
  journals: Journal[];
  setJournals: (journals: Journal[]) => void;
  addJournal: (journal: Omit<Journal, 'id' | 'uploadedAt' | 'downloadCount'>) => Journal;
  updateJournal: (id: string, updates: Partial<Journal>) => void;
  deleteJournal: (id: string) => void;
  togglePublishStatus: (id: string) => void;
  incrementDownload: (id: string) => void;

  // Backward-compatibility properties & methods
  ebooks: Journal[];
  setEBooks: (ebooks: Journal[]) => void;
  addEBook: (ebook: Omit<Journal, 'id' | 'uploadedAt' | 'downloadCount'>) => Journal;
  updateEBook: (id: string, updates: Partial<Journal>) => void;
  deleteEBook: (id: string) => void;
}

export const INITIAL_JOURNALS: Journal[] = [
  {
    id: 'journal_01',
    title: 'Constitutional Law & Governance in India',
    author: 'Prof. S. N. Rath',
    classification: 'Stream - Arts',
    fileReference: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '2.4 MB',
    publishStatus: 'Published',
    description: 'Comprehensive study material for undergraduate Political Science students covering core constitutional frameworks.',
    uploadedBy: 'Smita Patra (Librarian)',
    uploadedAt: '2026-08-10',
    publishedAt: '2026-08-11',
    downloadCount: 42,
  },
  {
    id: 'journal_02',
    title: 'Concepts of Classical & Quantum Physics',
    author: 'Dr. P. K. Mohapatra',
    classification: 'Stream - Science',
    fileReference: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '4.8 MB',
    publishStatus: 'Published',
    description: 'Lecture notes and laboratory guidelines for +3 Science degree curriculum.',
    uploadedBy: 'Dr. Bijay Mohanty (Admin)',
    uploadedAt: '2026-08-14',
    publishedAt: '2026-08-15',
    downloadCount: 29,
  },
  {
    id: 'journal_03',
    title: 'Modern Odia Poetry: An Analytical Study',
    author: 'Dr. Sitakant Mahapatra',
    classification: 'Course',
    fileReference: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '1.9 MB',
    publishStatus: 'Published',
    description: 'Anthology critique prescribed for Odia Honours Degree students at Pathani Samanta College.',
    uploadedBy: 'Smita Patra (Librarian)',
    uploadedAt: '2026-08-20',
    publishedAt: '2026-08-22',
    downloadCount: 18,
  },
  {
    id: 'journal_04',
    title: 'Odisha Economic Survey & Current Affairs 2026',
    author: 'Planning & Convergence Dept, Odisha',
    classification: 'Current Affairs',
    fileReference: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '3.1 MB',
    publishStatus: 'Draft',
    description: 'Draft reference copy awaiting faculty verification before releasing to students.',
    uploadedBy: 'Smita Patra (Librarian)',
    uploadedAt: '2026-09-02',
    downloadCount: 0,
  },
];

export const INITIAL_EBOOKS = INITIAL_JOURNALS;

export const useJournalsStore = create<JournalsState>()(
  persist(
    (set) => ({
      journals: INITIAL_JOURNALS,
      ebooks: INITIAL_JOURNALS,
      setJournals: (journals) => set({ journals, ebooks: journals }),
      setEBooks: (ebooks) => set({ journals: ebooks, ebooks }),

      addJournal: (data) => {
        const item: Journal = {
          ...data,
          id: generateId('journal'),
          uploadedAt: todayISO(),
          publishedAt: data.publishStatus === 'Published' ? todayISO() : undefined,
          downloadCount: 0,
        };
        set((state) => {
          const list = [item, ...state.journals];
          return { journals: list, ebooks: list };
        });
        return item;
      },
      addEBook: (data) => {
        const item: Journal = {
          ...data,
          id: generateId('journal'),
          uploadedAt: todayISO(),
          publishedAt: data.publishStatus === 'Published' ? todayISO() : undefined,
          downloadCount: 0,
        };
        set((state) => {
          const list = [item, ...state.journals];
          return { journals: list, ebooks: list };
        });
        return item;
      },

      updateJournal: (id, updates) =>
        set((state) => {
          const list = state.journals.map((b) => (b.id === id ? { ...b, ...updates } : b));
          return { journals: list, ebooks: list };
        }),
      updateEBook: (id, updates) =>
        set((state) => {
          const list = state.journals.map((b) => (b.id === id ? { ...b, ...updates } : b));
          return { journals: list, ebooks: list };
        }),

      deleteJournal: (id) =>
        set((state) => {
          const list = state.journals.filter((b) => b.id !== id);
          return { journals: list, ebooks: list };
        }),
      deleteEBook: (id) =>
        set((state) => {
          const list = state.journals.filter((b) => b.id !== id);
          return { journals: list, ebooks: list };
        }),

      togglePublishStatus: (id) =>
        set((state) => {
          const list = state.journals.map((b) => {
            if (b.id !== id) return b;
            const newStatus: JournalPublishStatus = b.publishStatus === 'Published' ? 'Draft' : 'Published';
            return {
              ...b,
              publishStatus: newStatus,
              publishedAt: newStatus === 'Published' ? todayISO() : undefined,
            };
          });
          return { journals: list, ebooks: list };
        }),

      incrementDownload: (id) =>
        set((state) => {
          const list = state.journals.map((b) => (b.id === id ? { ...b, downloadCount: b.downloadCount + 1 } : b));
          return { journals: list, ebooks: list };
        }),
    }),
    { name: 'psc-lms-journals' },
  ),
);

export const useEBooksStore = useJournalsStore;

