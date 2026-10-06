import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notice } from '@/types';
import { todayISO } from '@/utils/date';
import { seedNotices } from '@/data/notices';

interface NoticesState {
  notices: Notice[];
  addNotice: (notice: Notice) => void;
  updateNotice: (id: string, patch: Partial<Omit<Notice, 'id'>>) => void;
  deleteNotice: (id: string) => void;
}

export const useNoticesStore = create<NoticesState>()(
  persist(
    (set) => ({
      notices: seedNotices(),
      addNotice: (notice) => set((s) => ({ notices: [notice, ...s.notices] })),
      updateNotice: (id, patch) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),
      deleteNotice: (id) => set((s) => ({ notices: s.notices.filter((n) => n.id !== id) })),
    }),
    { name: 'psc-lms-notices-v3' },
  ),
);

export const SYSTEM_DEFAULT_NOTICE: Notice = {
  id: 'system_default_notice',
  title: 'Welcome to Central Library — General Guidelines & Timings',
  content:
    'The central library is open Monday through Saturday from 9:00 AM to 5:00 PM. All students and faculty are welcome to access physical and digital collections. Please maintain quiet study etiquette and return borrowed books on or before due dates.',
  category: 'Library Notices',
  publishDate: '2026-01-01',
  expiryDate: '2099-12-31',
  createdBy: 'Library Administration',
  isDefault: true,
};

export function isNoticeExpired(notice: Pick<Notice, 'expiryDate' | 'isDefault'>, today: string = todayISO()): boolean {
  if (notice.isDefault) return false;
  return notice.expiryDate !== undefined && notice.expiryDate < today;
}

export function isNoticeLive(notice: Notice, today: string = todayISO()): boolean {
  return notice.publishDate <= today && !isNoticeExpired(notice, today);
}

/**
 * Notices displayed to students and on dashboards.
 * Active regular (non-default) notices are shown when available.
 * If all regular notices are expired or no active notices exist, default notice(s) will be shown.
 */
export function selectLiveNotices(items: Notice[]): Notice[] {
  const today = todayISO();
  const liveRegular = items
    .filter((n) => !n.isDefault && isNoticeLive(n, today))
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  if (liveRegular.length > 0) {
    return liveRegular;
  }

  const customDefaults = items
    .filter((n) => Boolean(n.isDefault))
    .sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));

  if (customDefaults.length > 0) {
    return customDefaults;
  }

  return [SYSTEM_DEFAULT_NOTICE];
}
