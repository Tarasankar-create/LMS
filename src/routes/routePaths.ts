/** The app is served from the site root. (Set to e.g. '/lms' to mount it under a prefix.) */
export const LMS_BASE = '';

/** Converts an absolute LMS path into the path relative to the router root (used by nested <Route>s). */
export function lmsRelative(path: string): string {
  return path.replace(new RegExp(`^${LMS_BASE}/?`), '');
}

export const ROUTES = {
  lmsHome: '/',
  login: `${LMS_BASE}/login`,
  noAccess: `${LMS_BASE}/no-access`,

  dashboard: `${LMS_BASE}/dashboard`,
  books: `${LMS_BASE}/books`,
  bookDetails: (id: string) => `${LMS_BASE}/books/${id}`,

  circulationIssue: `${LMS_BASE}/circulation/issue`,
  circulationReturn: `${LMS_BASE}/circulation/return`,
  circulationActive: `${LMS_BASE}/circulation/active`,
  circulationReturned: `${LMS_BASE}/circulation/returned`,
  circulationOverdue: `${LMS_BASE}/circulation/overdue`,
  circulationTransactions: `${LMS_BASE}/circulation/transactions`,

  members: `${LMS_BASE}/members`,
  memberDetails: (id: string) => `${LMS_BASE}/members/${id}`,

  reservations: `${LMS_BASE}/reservations`,
  requests: `${LMS_BASE}/requests`,

  fines: `${LMS_BASE}/fines`,
  fineDetails: (id: string) => `${LMS_BASE}/fines/${id}`,

  reports: `${LMS_BASE}/reports`,
  notices: `${LMS_BASE}/notices`,
  settings: `${LMS_BASE}/settings`,
  profile: `${LMS_BASE}/profile`,


  studentDashboard: `${LMS_BASE}/student/dashboard`,
  studentCatalogue: `${LMS_BASE}/student/catalogue`,
  studentMyBooks: `${LMS_BASE}/student/my-books`,
  studentRequests: `${LMS_BASE}/student/requests`,
  studentFines: `${LMS_BASE}/student/fines`,
  studentNotices: `${LMS_BASE}/student/notices`,
  studentProfile: `${LMS_BASE}/student/profile`,
} as const;
