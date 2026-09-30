import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, { bar: string; chip: string }> = {
  primary: { bar: 'bg-primary-500', chip: 'bg-primary-50 text-primary-600' },
  accent: { bar: 'bg-accent-500', chip: 'bg-accent-50 text-accent-600' },
  success: { bar: 'bg-success-500', chip: 'bg-success-50 text-success-600' },
  warning: { bar: 'bg-warning-500', chip: 'bg-warning-50 text-warning-600' },
  danger: { bar: 'bg-danger-500', chip: 'bg-danger-50 text-danger-600' },
};

interface MiniStatProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  tone: Tone;
  href?: string;
}

/** Compact secondary metric: white tile with a coloured edge, sitting under the headline gradient cards. */
export function MiniStat({ label, value, detail, icon: Icon, tone, href }: MiniStatProps) {
  const t = TONES[tone];
  const className = cn(
    'relative flex items-center gap-3 overflow-hidden rounded-xl border border-secondary-100 bg-white py-3.5 pl-5 pr-4 shadow-sm',
    href && 'transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  );
  const body = (
    <>
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1.5', t.bar)} />
      <span className={cn('flex size-10 flex-none items-center justify-center rounded-lg', t.chip)}>
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-secondary-500">{label}</span>
        <span className="block text-xl font-semibold leading-tight text-ink">{value}</span>
        {detail && <span className="block truncate text-xs text-secondary-500">{detail}</span>}
      </span>
    </>
  );
  return href ? (
    <Link to={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
