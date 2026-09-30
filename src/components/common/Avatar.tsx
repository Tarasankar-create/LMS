import { cn } from '@/utils/cn';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn('rounded-full object-cover', SIZE_CLASSES[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-500 font-semibold text-white',
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
