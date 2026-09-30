export const BOOK_CATEGORIES = ['Arts', 'Science', 'Commerce', 'Literature', 'Reference'] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export type BookStatus = 'Available' | 'Fully Issued' | 'Retired';

export interface Book {
  id: string;
  accessionNumber: string;
  title: string;
  author: string;
  category: BookCategory;
  isbn?: string;
  publisher?: string;
  edition?: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  status: BookStatus;
  libraryUseOnly: boolean;
  addedDate: string;
}
