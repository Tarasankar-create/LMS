import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';

type Accent = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'slate';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: 'up' | 'down' };
  accent?: Accent;
  isLoading?: boolean;
  onClick?: () => void;
  /** `solid` = coloured gradient card with white text (dashboard headline numbers). */
  variant?: 'default' | 'solid';
  /** One short line under the value (solid cards). */
  note?: string;
  /** Makes the whole card a link to this route (solid cards). */
  href?: string;
}

const ACCENT_CLASSES: Record<Accent, string> = {
  primary: 'bg-primary-50 text-primary-500',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  slate: 'bg-secondary-100 text-secondary-600',
};

/** Gradients are dark enough that white text keeps at least 4.5:1 contrast across the whole card. */
const SOLID_CLASSES: Record<Accent, string> = {
  primary: 'from-primary-600 to-primary-500',
  accent: 'from-accent-600 to-accent-500',
  success: 'from-success-600 to-[#166534]',
  warning: 'from-warning-600 to-[#92400e]',
  danger: 'from-danger-600 to-[#991b1b]',
  slate: 'from-secondary-700 to-secondary-800',
};

export function StatCard({ title, value, icon: Icon, trend, accent = 'primary', isLoading, onClick, variant = 'default', note, href }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-secondary-100 bg-white p-5">
        <Skeleton variant="circle" count={1} className="mb-4" />
        <Skeleton count={2} />
      </div>
    );
  }

  if (variant === 'solid') {
    const interactive = Boolean(href || onClick);
    const className = cn(
      'group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-left text-white shadow-md ring-1 ring-black/5',
      SOLID_CLASSES[accent],
      interactive && 'transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    );
    const body = (
      <>
        {/* Decorative artwork: a soft circle and an oversized watermark of the icon. */}
        <span aria-hidden className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-white/10" />
        <Icon aria-hidden className="pointer-events-none absolute -bottom-4 -right-3 size-24 text-white/10" strokeWidth={1.5} />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-white">{title}</p>
          <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/25">
            <Icon aria-hidden className="size-5" />
          </span>
        </div>
        <p className="relative mt-3 text-3xl font-bold tracking-tight">{value}</p>
        {(note || interactive) && (
          <p className="relative mt-2 flex items-center gap-1 text-xs font-medium text-white">
            <span className="truncate">{note}</span>
            {interactive && <ArrowUpRight aria-hidden className="size-3.5 flex-none transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
          </p>
        )}
      </>
    );
    if (href) {
      return (
        <Link to={href} className={className}>
          {body}
        </Link>
      );
    }
    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={className}>
          {body}
        </button>
      );
    }
    return <div className={className}>{body}</div>;
  }

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        'flex w-full items-start justify-between rounded-xl border border-secondary-100 bg-white p-5 text-left shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md',
      )}
    >
      <div>
        <p className="text-sm font-medium text-secondary-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        {trend && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1 text-xs font-medium',
              trend.direction === 'up' ? 'text-success-600' : 'text-danger-600',
            )}
          >
            {trend.direction === 'up' ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {trend.value}% vs last month
          </p>
        )}
      </div>
      <div className={cn('flex size-11 flex-none items-center justify-center rounded-lg', ACCENT_CLASSES[accent])}>
        <Icon className="size-5" />
      </div>
    </Wrapper>
  );
}
