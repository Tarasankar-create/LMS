import type { Book } from '@/types';

/**
 * Checks whether a book belongs to a given student department.
 * Supports direct category matches ('Science', 'Arts', 'Commerce')
 * and specific subjects/sub-departments.
 */
export function isBookInDepartment(book: Book, department?: string): boolean {
  if (!department) return true;
  const dept = department.trim().toLowerCase();

  // Direct match with category or department
  if (book.category && book.category.toLowerCase() === dept) {
    return true;
  }
  if (book.department && book.department.toLowerCase() === dept) {
    return true;
  }

  // Science department mapping
  if (dept === 'science' || dept.includes('science') || dept.includes('b.sc')) {
    if (book.category === 'Science' || book.classification === 'Stream - Science') return true;
    const scienceKeywords = [
      'physics',
      'chemistry',
      'mathematics',
      'math',
      'botany',
      'zoology',
      'biology',
      'computer science',
      'natural sciences',
      'science',
    ];
    if (book.department && scienceKeywords.some((k) => book.department!.toLowerCase().includes(k))) return true;
    if (book.subject && scienceKeywords.some((k) => book.subject!.toLowerCase().includes(k))) return true;
  }

  // Arts department mapping
  if (dept === 'arts' || dept.includes('art') || dept.includes('b.a')) {
    if (book.category === 'Arts' || book.classification === 'Stream - Arts') return true;
    const artsKeywords = [
      'political science',
      'polity',
      'history',
      'odia',
      'english',
      'sociology',
      'philosophy',
      'sanskrit',
      'education',
      'psychology',
      'geography',
      'social studies',
      'arts',
    ];
    if (book.department && artsKeywords.some((k) => book.department!.toLowerCase().includes(k))) return true;
    if (book.subject && artsKeywords.some((k) => book.subject!.toLowerCase().includes(k))) return true;
  }

  // Commerce department mapping
  if (dept === 'commerce' || dept.includes('commerce') || dept.includes('b.com')) {
    if (book.category === 'Commerce') return true;
    const commerceKeywords = [
      'commerce',
      'accountancy',
      'accounting',
      'business',
      'economics',
      'tax',
      'marketing',
      'finance',
      'auditing',
      'banking',
      'commerce & computing',
    ];
    if (book.department && commerceKeywords.some((k) => book.department!.toLowerCase().includes(k))) return true;
    if (book.subject && commerceKeywords.some((k) => book.subject!.toLowerCase().includes(k))) return true;
  }

  // Fallback partial matching
  if (book.department && (book.department.toLowerCase().includes(dept) || dept.includes(book.department.toLowerCase()))) {
    return true;
  }
  if (book.subject && (book.subject.toLowerCase().includes(dept) || dept.includes(book.subject.toLowerCase()))) {
    return true;
  }

  return false;
}
