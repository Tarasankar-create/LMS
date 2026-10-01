export const BOOK_CATEGORIES = ['Arts', 'Science', 'Commerce', 'Literature', 'Reference'] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export const BOOK_CLASSIFICATIONS = [
  'Course',
  'Stream - Arts',
  'Stream - Science',
  'Journals',
  'Current Affairs',
  'Others',
] as const;
export type BookClassification = (typeof BOOK_CLASSIFICATIONS)[number];

export type BookStatus = 'Available' | 'Fully Issued' | 'Retired';

export interface Book {
  id: string;
  accessionNumber: string;
  title: string;
  author: string;
  category: BookCategory;
  classification: BookClassification;
  subject?: string;
  price?: number;
  isbn?: string;
  publisher?: string;
  edition?: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  status: BookStatus;
  libraryUseOnly: boolean;
  coverImage?: string;
  acquisitionDate?: string;
  acquisitionSource?: string;
  addedDate: string;
}

