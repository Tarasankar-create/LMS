import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { GraduationCap, X } from 'lucide-react';
import type { NavItem } from '@/constants/navigation';
import { cn } from '@/utils/cn';

interface MobileNavProps {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void;
  subtitle?: string;
}

export function MobileNav({ navItems, isOpen, onClose, subtitle = 'Library Management System' }: MobileNavProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div className="absolute inset-0 bg-secondary-900/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-full w-72 max-w-[80vw] flex-col bg-primary-500 text-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Pathani Samanta College</p>
              <p className="text-xs text-white/60">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg p-1.5 hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              <li key={item.path}>
                {item.group && item.group !== navItems[index - 1]?.group && (
                  <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-white/70">{item.group}</p>
                )}
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-white text-primary-600' : 'text-white/80 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  <item.icon className="size-5 flex-none" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto flex-none rounded-full bg-accent-500 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>,
    document.body,
  );
}
