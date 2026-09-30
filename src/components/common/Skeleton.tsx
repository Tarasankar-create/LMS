import { cn } from '@/utils/cn';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'table-row' | 'circle';
  count?: number;
  className?: string;
}

export function Skeleton({ variant = 'text', count = 1, className }: SkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className={cn('grid gap-4', className)}>
        {items.map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary-100" />
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-secondary-100" />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={cn('flex gap-2', className)}>
        {items.map((_, i) => (
          <div key={i} className="size-10 animate-pulse rounded-full bg-secondary-100" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-secondary-100" />
      ))}
    </div>
  );
}
