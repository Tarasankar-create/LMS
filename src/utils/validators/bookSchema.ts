import { z } from 'zod';
import { BOOK_CATEGORIES } from '@/types';

export const bookSchema = z.object({
  accessionNumber: z.string().min(1, 'Accession number is required'),
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  category: z.enum(BOOK_CATEGORIES),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  totalCopies: z.number().int().min(1, 'Must have at least 1 copy'),
  shelfLocation: z.string().min(1, 'Shelf location is required'),
  libraryUseOnly: z.boolean(),
});

export type BookFormValues = z.infer<typeof bookSchema>;
