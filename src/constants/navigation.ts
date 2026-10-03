import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  BookMarked,
  Receipt,
  BarChart3,
  Megaphone,
  Settings,
  ClipboardList,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/routes/routePaths';
import type { Action, Module } from '@/access/permissions';
import type { CanFn } from '@/access/useCan';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Heading the item is listed under (staff sidebar only). */
  group?: 'Library';
  /** Highlight only on an exact path match (for parents whose children have their own items). */
  end?: boolean;
  /** Visible only if the user holds this permission. */
  permission?: [Module, Action?];
  /** Small count pill shown next to the label (e.g. pending requests). */
  badge?: number;
}

/** Staff sidebar: every entry is filtered by the signed-in user's permissions. */
export const STAFF_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard, group: 'Library', permission: ['reports'] },
  { label: 'Books Catalogue', path: ROUTES.books, icon: BookOpen, group: 'Library', permission: ['books'] },
  { label: 'Digital Library', path: ROUTES.ebooks, icon: FileText, group: 'Library', permission: ['books'] },
  { label: 'Issue & Return', path: ROUTES.circulationActive, icon: ArrowLeftRight, group: 'Library', permission: ['circulation'] },
  { label: 'Members', path: ROUTES.members, icon: Users, group: 'Library', permission: ['members'] },
  { label: 'Reservations', path: ROUTES.reservations, icon: BookMarked, group: 'Library', permission: ['reservations'] },
  { label: 'Requests', path: ROUTES.requests, icon: ClipboardList, group: 'Library', permission: ['circulation'] },
  { label: 'Fines', path: ROUTES.fines, icon: Receipt, group: 'Library', permission: ['fines'] },
  { label: 'Reports', path: ROUTES.reports, icon: BarChart3, group: 'Library', permission: ['reports'] },
  { label: 'Notices', path: ROUTES.notices, icon: Megaphone, group: 'Library', permission: ['notices'] },
  { label: 'Staff & Users', path: ROUTES.adminUsers, icon: ShieldCheck, group: 'Library', permission: ['librarySettings'] },
  { label: 'Library Settings', path: ROUTES.settings, icon: Settings, group: 'Library', permission: ['librarySettings'] },
];

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.studentDashboard, icon: LayoutDashboard },
  { label: 'Catalogue', path: ROUTES.studentCatalogue, icon: BookOpen },
  { label: 'e-Books', path: ROUTES.studentEBooks, icon: FileText },
  { label: 'My Books', path: ROUTES.studentMyBooks, icon: BookMarked },
  { label: 'My Requests', path: ROUTES.studentRequests, icon: ClipboardList },
  { label: 'Fines', path: ROUTES.studentFines, icon: Receipt },
  { label: 'Notices', path: ROUTES.studentNotices, icon: Megaphone },
];

export function filterStaffNav(can: CanFn, badges: Partial<Record<string, number>> = {}): NavItem[] {
  return STAFF_NAV_ITEMS.filter((item) => {
    if (item.permission) return can(item.permission[0], item.permission[1] ?? 'view');
    return true;
  }).map((item) => {
    const badge = badges[item.path];
    return badge ? { ...item, badge } : item;
  });
}
