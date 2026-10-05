import { BOOK_CATEGORIES, type Book, type BookCategory, type BookDepartment } from '@/types';
import { CATEGORY_SHELF_PREFIX } from '@/constants/categories';
import { SEED_COUNTS } from './seedConfig';
import { createSeededRandom, pickFrom, randomInt } from './seededRandom';

/**
 * Maps book title / category / subject to canonical BookDepartment.
 */
export function resolveBookDepartment(title: string, category?: string, subject?: string): BookDepartment {
  const t = title.toLowerCase();
  const s = (subject ?? '').toLowerCase();

  if (t.includes('physics') || t.includes('electronics') || s.includes('physics')) return 'Physics';
  if (t.includes('chemistry') || s.includes('chemistry')) return 'Chemistry';
  if (t.includes('polity') || t.includes('political') || t.includes('public administration') || s.includes('polity')) return 'Political Science';
  if (t.includes('math') || t.includes('calculus') || t.includes('algebra') || t.includes('geometry') || t.includes('statistics')) return 'Mathematics';
  if (t.includes('botan') || t.includes('environmental')) return 'Botany';
  if (t.includes('zool') || t.includes('animal') || t.includes('cell biology') || t.includes('genetics')) return 'Zoology';
  if (t.includes('history') || t.includes('struggle') || t.includes('heritage')) return 'History';
  if (t.includes('econom') || t.includes('yojana')) return 'Economics';
  if (t.includes('odia') || t.includes('prativa') || t.includes('jhankar')) return 'Odia';
  if (t.includes('english') || t.includes('communication')) return 'English';
  if (t.includes('account') || t.includes('tax') || t.includes('marketing') || t.includes('audit') || t.includes('commerce') || t.includes('company law') || t.includes('financial')) return 'Commerce';
  if (t.includes('computer') || t.includes('e-commerce')) return 'Computer Science';
  if (t.includes('education') || t.includes('university') || t.includes('psychology')) return 'Education';
  if (t.includes('philosophy')) return 'Philosophy';
  if (t.includes('sanskrit')) return 'Sanskrit';
  if (t.includes('sociology') || t.includes('kurukshetra')) return 'Sociology';

  if (category === 'Science') return 'Physics';
  if (category === 'Commerce') return 'Commerce';
  if (category === 'Arts') return 'History';

  return 'Others';
}

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
    subject: 'Political Science',
    department: 'Political Science',
    dateOfPurchase: '2023-06-12',
    classification: 'Stream - Arts',
    category: 'Arts',
    isbn: '978-93-5260-363-3',
    publisher: 'McGraw Hill',
    edition: '6th',
    price: 450,
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
    subject: 'Physics',
    department: 'Physics',
    dateOfPurchase: '2023-06-12',
    classification: 'Stream - Science',
    category: 'Science',
    isbn: '978-81-7709-187-1',
    publisher: 'Bharati Bhawan',
    edition: '1st',
    price: 380,
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
    subject: 'Odia',
    department: 'Odia',
    dateOfPurchase: '2023-06-12',
    classification: 'Course',
    category: 'Arts',
    publisher: 'Grantha Mandir',
    edition: '2nd',
    price: 220,
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
    subject: 'Computer Science',
    department: 'Computer Science',
    dateOfPurchase: '2023-06-12',
    classification: 'Course',
    category: 'Commerce',
    publisher: 'BPB Publications',
    edition: '8th',
    price: 350,
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
  'Journals and Magazines': [
    'Indian Journal of History of Science',
    'Odisha Historical Research Journal',
    'Economic & Political Weekly',
    'Current Science Journal',
    'Yojana (Odisha Edition)',
    'Kurukshetra Development Journal',
    'The Indian Economic Journal',
    'Prativa Literary Journal',
    'Jhankar Odia Magazine',
    'University News Journal',
    'Journal of Educational Planning',
    'Down to Earth Magazine',
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
    const isReference = category === 'Journals and Magazines' && rng() > 0.4;

    accessionCounter += 1;
    const accessionNumber = `PSC-${String(accessionCounter).padStart(4, '0')}`;

    let classification: import('@/types').BookClassification = 'Course';
    if (category === 'Arts') classification = 'Stream - Arts';
    else if (category === 'Science') classification = 'Stream - Science';
    else if (category === 'Journals and Magazines') classification = 'Journals';
    else if (i % 5 === 0) classification = 'Others';

    const subject =
      category === 'Arts'
        ? 'Social Studies'
        : category === 'Science'
          ? 'Natural Sciences'
          : category === 'Commerce'
            ? 'Commerce & Computing'
            : 'Periodicals & Publications';

    const department = resolveBookDepartment(title, category, subject);

    books.push({
      id: `book_${accessionNumber.toLowerCase()}`,
      accessionNumber,
      title,
      author: pickFrom(rng, AUTHORS),
      subject,
      department,
      dateOfPurchase: '2023-07-01',
      classification,
      category,
      publisher: 'Odisha State Bureau of Textbooks',
      edition: `${(i % 3) + 1}st`,
      price: randomInt(rng, 150, 700),
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

