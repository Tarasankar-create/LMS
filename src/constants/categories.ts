import type { BookCategory } from '@/types';

export const CATEGORY_SHELF_PREFIX: Record<BookCategory, string> = {
  Arts: 'A',
  Science: 'B',
  Literature: 'C',
  Commerce: 'D',
  Reference: 'E',
};

export const CATEGORY_CHART_COLORS: Record<BookCategory, string> = {
  Arts: '#1e3a5f',
  Science: '#0f766e',
  Commerce: '#d97706',
  Literature: '#475569',
  Reference: '#7aa2c6',
};
