import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Clock3, LogOut, Menu, PackageCheck, Search, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/access/useCan';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { useLoansStore } from '@/store/loansStore';
import { useReservationsStore } from '@/store/reservationsStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { ActivityItem } from '@/utils/activity';
import { formatDate, overdueDays, daysUntil } from '@/utils/date';
import { Avatar } from '@/components/common/Avatar';
import { useClickOutside } from '@/hooks/useClickOutside';
import { ROUTES } from '@/routes/routePaths';
import { cn } from '@/utils/cn';

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
  searchRoute?: string;
  searchPlaceholder?: string;
  activities: ActivityItem[];
  alertCount?: number;
}

export function Navbar({ title, onMenuClick, searchRoute, searchPlaceholder = 'Search books, members...', activities, alertCount }: NavbarProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const can = useCan();
  // Library search and activity feed are only for students and staff who may view the catalogue.
  const canSeeLibrary = currentUser?.role === 'student' || can('books', 'view');

  const member = useCurrentMember();
  const loans = useLoansStore((s) => s.loans);
  const reservations = useReservationsStore((s) => s.reservations);
  const dueReminderLeadDays = useSettingsStore((s) => s.settings.dueReminderLeadDays ?? 2);

  const studentAlerts = useMemo(() => {
    if (currentUser?.role !== 'student' || !member) return null;
    const myActive = loans.filter((l) => l.memberId === member.memberId && l.status === 'Active');
    const overdue = myActive.filter((l) => overdueDays(l.dueDate) > 0);
    const dueSoon = myActive.filter((l) => {
      const days = daysUntil(l.dueDate);
      return days >= 0 && days <= dueReminderLeadDays;
    });
    const ready = reservations.filter((r) => r.memberId === member.memberId && r.status === 'Ready');
    return {
      overdue: overdue.length,
      dueSoon: dueSoon.length,
      ready: ready.length,
      total: overdue.length + dueSoon.length + ready.length,
    };
  }, [currentUser, member, loans, reservations, dueReminderLeadDays]);

  const effectiveAlertCount = alertCount ?? (studentAlerts ? studentAlerts.total : 0);

  const [searchValue, setSearchValue] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchRoute || !searchValue.trim()) return;
    navigate(`${searchRoute}?q=${encodeURIComponent(searchValue.trim())}`);
  }

  function handleLogout() {
    logout();
    navigate(ROUTES.login);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-none items-center gap-3 border-b border-secondary-100 bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-secondary-500 hover:bg-secondary-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <p className="hidden truncate text-base font-semibold text-ink sm:block">{title}</p>

      {searchRoute && canSeeLibrary && (
        <form onSubmit={handleSearchSubmit} className="ml-2 hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-500" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </form>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {canSeeLibrary && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-secondary-500 hover:bg-secondary-100"
              aria-label={effectiveAlertCount > 0 ? `Notifications (${effectiveAlertCount} alerts)` : 'Notifications'}
            >
              <Bell className="size-5" />
              {effectiveAlertCount > 0 ? (
                <span
                  aria-label={`${effectiveAlertCount} unread alerts`}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white"
                >
                  {effectiveAlertCount > 99 ? '99+' : effectiveAlertCount}
                </span>
              ) : activities.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger-500" />
              ) : null}
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-secondary-100 bg-white shadow-lg">
                {studentAlerts && studentAlerts.total > 0 && (
                  <div className="border-b border-secondary-100 bg-secondary-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
                      Alerts ({studentAlerts.total})
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {studentAlerts.overdue > 0 && (
                        <Link
                          to={ROUTES.studentMyBooks}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-center justify-between rounded-lg bg-danger-50 px-2.5 py-1.5 text-xs font-medium text-danger-700 hover:bg-danger-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <AlertCircle className="size-3.5 text-danger-600" />
                            {studentAlerts.overdue} overdue {studentAlerts.overdue === 1 ? 'book' : 'books'}
                          </span>
                          <span className="underline text-[11px]">View</span>
                        </Link>
                      )}
                      {studentAlerts.dueSoon > 0 && (
                        <Link
                          to={ROUTES.studentMyBooks}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-center justify-between rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock3 className="size-3.5 text-amber-600" />
                            {studentAlerts.dueSoon} {studentAlerts.dueSoon === 1 ? 'book' : 'books'} due soon
                          </span>
                          <span className="underline text-[11px]">View</span>
                        </Link>
                      )}
                      {studentAlerts.ready > 0 && (
                        <Link
                          to={ROUTES.studentRequests}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <PackageCheck className="size-3.5 text-emerald-600" />
                            {studentAlerts.ready} {studentAlerts.ready === 1 ? 'reservation' : 'reservations'} ready
                          </span>
                          <span className="underline text-[11px]">Pick up</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-b border-secondary-100 px-4 py-2.5">
                  <p className="text-xs font-semibold text-secondary-700">Recent Activity</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-secondary-500">No recent activity</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 border-b border-secondary-50 px-4 py-3 last:border-0">
                        <activity.icon className="mt-0.5 size-4 flex-none text-accent-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-secondary-700">{activity.message}</p>
                          <p className="text-xs text-secondary-500">{formatDate(activity.date)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-label={`Account menu for ${currentUser?.name ?? 'user'}`}
            aria-expanded={profileOpen}
            className={cn(
              'flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary-100',
              profileOpen && 'bg-secondary-100',
            )}
          >
            <Avatar name={currentUser?.name ?? 'User'} size="sm" />
            <span className="hidden text-sm font-medium text-ink sm:block">{currentUser?.name}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-40 mt-2 w-52 rounded-xl border border-secondary-100 bg-white py-1 shadow-lg">
              <div className="border-b border-secondary-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-ink">{currentUser?.name}</p>
                <p className="truncate text-xs capitalize text-secondary-500">{currentUser?.role}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate(currentUser?.role === 'student' ? ROUTES.studentProfile : ROUTES.profile);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-secondary-600 hover:bg-secondary-50"
              >
                <UserIcon className="size-4" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
