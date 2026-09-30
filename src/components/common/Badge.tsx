import type { ReactNode } from 'react';
import { STATUS_BADGE_COLORS } from '@/constants/colors';
import { cn } from '@/utils/cn';

type Tone = keyof typeof STATUS_BADGE_COLORS;

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  withDot?: boolean;
}

export function Badge({ tone = 'neutral', children, className, withDot = true }: BadgeProps) {
  const colors = STATUS_BADGE_COLORS[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        colors.bg,
        colors.text,
        className,
      )}
    >
      {withDot && <span className={cn('size-1.5 rounded-full', colors.dot)} />}
      {children}
    </span>
  );
}
