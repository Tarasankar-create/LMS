import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Book } from '@/types';

interface BooksState {
  books: Book[];
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  addBooks: (books: Book[]) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  retireBook: (id: string) => void;
  decrementAvailable: (accessionNumber: string) => void;
  incrementAvailable: (accessionNumber: string) => void;
  getByAccession: (accessionNumber: string) => Book | undefined;
  getById: (id: string) => Book | undefined;
}

export const useBooksStore = create<BooksState>()(
  persist(
    (set, get) => ({
      books: [],
      setBooks: (books) => set({ books }),
      addBook: (book) => set((state) => ({ books: [book, ...state.books] })),
      addBooks: (newBooks) => set((state) => ({ books: [...newBooks, ...state.books] })),
      updateBook: (id, updates) =>
        set((state) => ({ books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
      retireBook: (id) =>
        set((state) => ({ books: state.books.map((b) => (b.id === id ? { ...b, status: 'Retired' } : b)) })),
      decrementAvailable: (accessionNumber) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.accessionNumber === accessionNumber
              ? {
                  ...b,
                  availableCopies: Math.max(0, b.availableCopies - 1),
                  status: b.availableCopies - 1 <= 0 ? 'Fully Issued' : b.status,
                }
              : b,
          ),
        })),
      incrementAvailable: (accessionNumber) =>
        set((state) => ({
          books: state.books.map((b) =>
            b.accessionNumber === accessionNumber
              ? {
                  ...b,
                  availableCopies: Math.min(b.totalCopies, b.availableCopies + 1),
                  status: b.status === 'Retired' ? b.status : 'Available',
                }
              : b,
          ),
        })),
      getByAccession: (accessionNumber) => get().books.find((b) => b.accessionNumber === accessionNumber),
      getById: (id) => get().books.find((b) => b.id === id),
    }),
    { name: 'psc-lms-books' },
  ),
);
