import type { BookCategory } from '@/types';

export const CATEGORY_SHELF_PREFIX: Record<BookCategory, string> = {
  Science: 'B',
  Commerce: 'D',
  Arts: 'A',
  'Journals and Magazines': 'J',
};

export const CATEGORY_CHART_COLORS: Record<BookCategory, string> = {
  Science: '#0f766e',
  Commerce: '#d97706',
  Arts: '#1e3a5f',
  'Journals and Magazines': '#6366f1',
};

