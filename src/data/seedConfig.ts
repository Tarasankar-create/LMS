/**
 * Fixed dashboard headline numbers representing the college's full physical
 * holdings. These are intentionally NOT derived from the generated arrays
 * below (generating literal thousands of dummy rows client-side has no UI
 * benefit and bloats localStorage) — they are displayed directly on the
 * Dashboard as the "real" library scale a backend would eventually report.
 */
export const DASHBOARD_TOTALS = {
  totalBookTitles: 4250,
  totalBookCopies: 8750,
  activeMembers: 2340,
};

/** Counts for the smaller, functional dataset that actually drives the UI. */
export const SEED_COUNTS = {
  generatedBooks: 60,
  generatedMembers: 100,
  overdueActiveLoans: 126,
  issuedTodayLoans: 48,
  extraOnTimeActiveLoans: 20,
  returnedLoans: 250,
  collectedFines: 80,
  waivedFines: 10,
  reservations: 18,
  requests: 6,
  notices: 14,
};

export const TARGET_PENDING_FINE_TOTAL = 12450;
