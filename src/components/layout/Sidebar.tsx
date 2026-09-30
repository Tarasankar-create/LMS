import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, GraduationCap } from 'lucide-react';
import type { NavItem } from '@/constants/navigation';
import { cn } from '@/utils/cn';

interface SidebarProps {
  navItems: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
  subtitle?: string;
}

export function Sidebar({ navItems, collapsed, onToggle, subtitle = 'Library Management System' }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen flex-none flex-col border-r border-secondary-100 bg-primary-500 text-white transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-white/10">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Pathani Samanta College</p>
            <p className="truncate text-xs text-white/60">{subtitle}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={item.path}>
              {item.group && item.group !== navItems[index - 1]?.group && (
                collapsed ? (
                  <div aria-hidden className="mx-2 mb-2 mt-3 border-t border-white/15" />
                ) : (
                  <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-white/70">{item.group}</p>
                )
              )}
              <NavLink
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive ? 'bg-white text-primary-600' : 'text-white/80 hover:bg-white/10 hover:text-white',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="size-5 flex-none" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.badge ? (
                  <span
                    className={cn(
                      'ml-auto flex-none rounded-full bg-accent-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white',
                      collapsed && 'absolute right-1.5 top-1.5',
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
