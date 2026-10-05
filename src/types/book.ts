export const BOOK_CATEGORIES = ['Arts', 'Science', 'Commerce', 'Journals and Magazines'] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export const BOOK_DEPARTMENTS = [
  'Physics',
  'Chemistry',
  'Political Science',
  'Mathematics',
  'Botany',
  'Zoology',
  'History',
  'Economics',
  'Odia',
  'English',
  'Commerce',
  'Computer Science',
  'Education',
  'Philosophy',
  'Sanskrit',
  'Sociology',
  'General',
] as const;
export type BookDepartment = (typeof BOOK_DEPARTMENTS)[number];

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
  department?: string;
  dateOfPurchase?: string;
  price?: number;
  subject?: string;
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
