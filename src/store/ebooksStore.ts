import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EBook, EBookPublishStatus } from '@/types';
import { generateId } from '@/utils/id';
import { todayISO } from '@/utils/date';

interface EBooksState {
  ebooks: EBook[];
  setEBooks: (ebooks: EBook[]) => void;
  addEBook: (ebook: Omit<EBook, 'id' | 'uploadedAt' | 'downloadCount'>) => EBook;
  updateEBook: (id: string, updates: Partial<EBook>) => void;
  deleteEBook: (id: string) => void;
  togglePublishStatus: (id: string) => void;
  incrementDownload: (id: string) => void;
}

export const INITIAL_EBOOKS: EBook[] = [
  {
    id: 'ebook_01',
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
    id: 'ebook_02',
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
    id: 'ebook_03',
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
    id: 'ebook_04',
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

export const useEBooksStore = create<EBooksState>()(
  persist(
    (set) => ({
      ebooks: INITIAL_EBOOKS,
      setEBooks: (ebooks) => set({ ebooks }),

      addEBook: (data) => {
        const ebook: EBook = {
          ...data,
          id: generateId('ebook'),
          uploadedAt: todayISO(),
          publishedAt: data.publishStatus === 'Published' ? todayISO() : undefined,
          downloadCount: 0,
        };
        set((state) => ({ ebooks: [ebook, ...state.ebooks] }));
        return ebook;
      },

      updateEBook: (id, updates) =>
        set((state) => ({
          ebooks: state.ebooks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      deleteEBook: (id) =>
        set((state) => ({
          ebooks: state.ebooks.filter((b) => b.id !== id),
        })),

      togglePublishStatus: (id) =>
        set((state) => ({
          ebooks: state.ebooks.map((b) => {
            if (b.id !== id) return b;
            const newStatus: EBookPublishStatus = b.publishStatus === 'Published' ? 'Draft' : 'Published';
            return {
              ...b,
              publishStatus: newStatus,
              publishedAt: newStatus === 'Published' ? todayISO() : undefined,
            };
          }),
        })),

      incrementDownload: (id) =>
        set((state) => ({
          ebooks: state.ebooks.map((b) => (b.id === id ? { ...b, downloadCount: b.downloadCount + 1 } : b)),
        })),
    }),
    { name: 'psc-lms-ebooks' },
  ),
);
