import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/access/useCan';
import type { ActivityItem } from '@/utils/activity';
import { formatDate } from '@/utils/date';
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
}

export function Navbar({ title, onMenuClick, searchRoute, searchPlaceholder = 'Search books, members...', activities }: NavbarProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const can = useCan();
  // Library search and activity feed are only for students and staff who may view the catalogue.
  const canSeeLibrary = currentUser?.role === 'student' || can('books', 'view');

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
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {activities.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger-500" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-secondary-100 bg-white shadow-lg">
                <div className="border-b border-secondary-100 px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Recent Activity</p>
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
