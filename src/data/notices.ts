import type { Notice, NoticeCategory } from '@/types';
import { addDaysISO, todayISO } from '@/utils/date';

interface NoticeSeed {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  publishOffset: number;
  expiryOffset?: number;
}

const SEEDS: NoticeSeed[] = [
  { id: 'n_stock_verification', title: 'Library closed for annual stock verification', content: 'The library will remain closed from the 24th to the 26th for annual stock verification. Regular services resume on the 27th.', category: 'Library Notices', publishOffset: -3, expiryOffset: 6 },
  { id: 'n_new_arrivals', title: 'New arrivals: Science and Commerce sections', content: '45 new titles have been added to the Science and Commerce sections. Visit the catalogue to check availability.', category: 'Library Notices', publishOffset: -10, expiryOffset: 20 },
  { id: 'n_extended_hours', title: 'Extended library hours during examinations', content: 'The library will remain open until 8:00 PM on weekdays during the examination period to support student preparation.', category: 'Examinations', publishOffset: -5, expiryOffset: 25 },
  { id: 'n_midsem_routine', title: 'Mid-semester examination routine released', content: 'The mid-semester examination routine for all streams has been published. Check the notice board for your slot.', category: 'Examinations', publishOffset: -15, expiryOffset: 10 },
  { id: 'n_sports_meet', title: 'Annual Sports Meet — 2026', content: 'The college annual sports meet will be held on the main campus ground. All students are encouraged to participate.', category: 'Events', publishOffset: -8, expiryOffset: 12 },
  { id: 'n_fee_reminder', title: 'Fee payment deadline reminder', content: 'Students yet to pay semester fees are reminded to complete payment before the deadline to avoid late fines.', category: 'Circulars', publishOffset: -4, expiryOffset: 8 },
  { id: 'n_overdue_reminder', title: 'Overdue book reminder — please return on time', content: 'Members with overdue books are requested to return them at the earliest to avoid accumulating fines.', category: 'Library Notices', publishOffset: -1, expiryOffset: 14 },
  { id: 'n_guest_lecture', title: 'Guest lecture on Indian Constitutional History', content: 'A guest lecture on Indian Constitutional History will be organised in the seminar hall. All are welcome to attend.', category: 'Events', publishOffset: -12, expiryOffset: -2 },
  { id: 'n_reference_section', title: 'Reference section reorganisation complete', content: 'The reference and rare-books section has been reorganised by subject for easier access. Please check the updated shelf map at the desk.', category: 'Library Notices', publishOffset: -18, expiryOffset: 30 },
  { id: 'n_upcoming_hours', title: 'Revised library working hours (winter term)', content: 'From next week the library will open at 9:00 AM and close at 5:00 PM on weekdays.', category: 'Library Notices', publishOffset: 5 },
];

export function seedNotices(): Notice[] {
  const today = todayISO();
  return SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    content: seed.content,
    category: seed.category,
    publishDate: addDaysISO(today, seed.publishOffset),
    expiryDate: seed.expiryOffset !== undefined ? addDaysISO(today, seed.expiryOffset) : undefined,
    createdBy: 'Librarian',
  }));
}
