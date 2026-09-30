import { Search, X } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

export function SearchInput({ value, onChange, containerClassName, className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-secondary-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-lg border border-secondary-200 bg-white py-2 pl-9 pr-8 text-sm text-ink',
          'placeholder:text-secondary-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100',
          className,
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary-500 hover:text-secondary-600"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
