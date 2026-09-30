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

export function isNoticeExpired(notice: Pick<Notice, 'expiryDate'>, today: string = todayISO()): boolean {
  return notice.expiryDate !== undefined && notice.expiryDate < today;
}

export function isNoticeLive(notice: Notice, today: string = todayISO()): boolean {
  return notice.publishDate <= today && !isNoticeExpired(notice, today);
}

/** Notices students can see right now (published and not expired), newest first. */
export function selectLiveNotices(items: Notice[]): Notice[] {
  const today = todayISO();
  return items.filter((n) => isNoticeLive(n, today)).sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
}
