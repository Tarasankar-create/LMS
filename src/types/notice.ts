export const NOTICE_CATEGORIES = [
  'Admissions',
  'Examinations',
  'Events',
  'Circulars',
  'Library Notices',
] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

/** A notice on the library notice board, shown to staff and in the student portal. */
export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  /** ISO date (yyyy-mm-dd) from which the notice is visible to students. */
  publishDate: string;
  /** ISO date after which the notice is archived. */
  expiryDate?: string;
  createdBy: string;
}
