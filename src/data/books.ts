import { BOOK_CATEGORIES, type Book, type BookCategory } from '@/types';
import { CATEGORY_SHELF_PREFIX } from '@/constants/categories';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom, randomInt } from './seededRandom';

/**
 * totalCopies only — availableCopies/status are computed by reconcileBookAvailability()
 * once loans have been generated, so the two never drift out of sync. The four
 * accession numbers and total-copy counts below match the source spec exactly;
 * reconciling against 4/5/5/4 active loans (assigned in loans.ts) reproduces the
 * spec's stated available-copy counts of 6/3/0/8.
 */
const FIXED_BOOKS: Omit<Book, 'availableCopies' | 'status'>[] = [
  {
    id: 'book_psc0001',
    accessionNumber: 'PSC-0001',
    title: 'Indian Polity',
    author: 'M. Laxmikanth',
    category: 'Arts',
    isbn: '978-93-5260-363-3',
    totalCopies: 10,
    shelfLocation: 'A-101',
    libraryUseOnly: false,
    addedDate: '2023-06-12',
  },
  {
    id: 'book_psc0002',
    accessionNumber: 'PSC-0002',
    title: 'Introduction to Physics',
    author: 'H.C. Verma',
    category: 'Science',
    isbn: '978-81-7709-187-1',
    totalCopies: 8,
    shelfLocation: 'B-204',
    libraryUseOnly: false,
    addedDate: '2023-06-12',
  },
  {
    id: 'book_psc0003',
    accessionNumber: 'PSC-0003',
    title: 'Odia Literature',
    author: 'Fakir Mohan Senapati',
    category: 'Literature',
    totalCopies: 5,
    shelfLocation: 'C-102',
    libraryUseOnly: false,
    addedDate: '2023-06-12',
  },
  {
    id: 'book_psc0004',
    accessionNumber: 'PSC-0004',
    title: 'Computer Fundamentals',
    author: 'P.K. Sinha',
    category: 'Commerce',
    totalCopies: 12,
    shelfLocation: 'D-301',
    libraryUseOnly: false,
    addedDate: '2023-06-12',
  },
];

const TITLES_BY_CATEGORY: Record<BookCategory, string[]> = {
  Arts: [
    'History of Modern India',
    'Ancient Indian History',
    'Introduction to Sociology',
    'Principles of Political Science',
    'World History: A Survey',
    'Indian Freedom Struggle',
    'Public Administration',
    'Fundamentals of Psychology',
    'Geography of Odisha',
    'Indian Culture and Heritage',
    'Introduction to Philosophy',
    'Economics of Development',
  ],
  Science: [
    'Concepts of Modern Physics',
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Botany: A Textbook',
    'Zoology and Animal Diversity',
    'Calculus and Analytic Geometry',
    'Linear Algebra',
    'Environmental Science',
    'Cell Biology and Genetics',
    'Physical Chemistry',
    'Engineering Mathematics',
    'Fundamentals of Electronics',
  ],
  Commerce: [
    'Computer Fundamentals and Applications',
    'Principles of Accountancy',
    'Business Statistics',
    'Introduction to Economics',
    'Financial Management',
    'Business Communication',
    'Income Tax Law and Practice',
    'Principles of Marketing',
    'Cost Accounting',
    'E-Commerce Fundamentals',
    'Auditing Principles',
    'Company Law',
  ],
  Literature: [
    'Odia Short Stories Anthology',
    'English Literature: The Victorian Age',
    'A Study of Indian Poetry',
    'Modern Odia Poetry',
    'Sanskrit Grammar and Composition',
    'Comparative Literature Studies',
    'The Art of the Novel',
    'Hindi Sahitya ka Itihas',
    'Folk Tales of Odisha',
    'Introduction to Linguistics',
  ],
  Reference: [
    'Encyclopedia of General Knowledge',
    "Oxford English Dictionary",
    'Atlas of the World',
    "Who's Who in Indian History",
    'Manual of Indian Constitution',
    'Scientific and Technical Terms Dictionary',
    'Directory of Indian Universities',
    'Almanac of Current Affairs',
  ],
};

const AUTHORS = [
  'R.K. Mishra', 'S. Patnaik', 'A. Sharma', 'N. Behera', 'P. Das', 'K. Rao',
  'D. Iyer', 'M. Nayak', 'B. Sahoo', 'T. Panda', 'V. Reddy', 'J. Sethi',
];

function buildGeneratedBooks(count: number): Omit<Book, 'availableCopies' | 'status'>[] {
  const rng = createSeededRandom(42);
  const books: Omit<Book, 'availableCopies' | 'status'>[] = [];
  let accessionCounter = FIXED_BOOKS.length + 1;

  for (let i = 0; i < count; i += 1) {
    const category = BOOK_CATEGORIES[i % BOOK_CATEGORIES.length];
    const titles = TITLES_BY_CATEGORY[category];
    const title = titles[i % titles.length];
    const totalCopies = randomInt(rng, 2, 8);
    const isReference = category === 'Reference' && rng() > 0.4;

    accessionCounter += 1;
    const accessionNumber = `PSC-${String(accessionCounter).padStart(4, '0')}`;

    books.push({
      id: `book_${accessionNumber.toLowerCase()}`,
      accessionNumber,
      title,
      author: pickFrom(rng, AUTHORS),
      category,
      totalCopies,
      shelfLocation: `${CATEGORY_SHELF_PREFIX[category]}-${randomInt(rng, 100, 399)}`,
      libraryUseOnly: isReference,
      addedDate: '2023-07-01',
    });
  }

  return books;
}

/** Book records with placeholder full availability — reconciled once loans exist. */
export function buildBookRecords(): Book[] {
  const all = [...FIXED_BOOKS, ...buildGeneratedBooks(SEED_COUNTS.generatedBooks)];
  return all.map((book) => ({
    ...book,
    availableCopies: book.totalCopies,
    status: 'Available' as const,
  }));
}

/** Recomputes availableCopies/status from actual active-loan counts per accession number. */
export function reconcileBookAvailability(books: Book[], issuedCountByAccession: Map<string, number>): Book[] {
  return books.map((book) => {
    if (book.libraryUseOnly) {
      return { ...book, availableCopies: book.totalCopies, status: 'Available' as const };
    }
    const issued = issuedCountByAccession.get(book.accessionNumber) ?? 0;
    const availableCopies = Math.max(0, book.totalCopies - issued);
    return {
      ...book,
      availableCopies,
      status: availableCopies > 0 ? ('Available' as const) : ('Fully Issued' as const),
    };
  });
}
