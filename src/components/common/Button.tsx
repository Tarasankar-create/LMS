import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-primary-500',
  secondary: 'bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-500',
  outline: 'border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50 focus-visible:outline-primary-400',
  ghost: 'text-secondary-600 hover:bg-secondary-100 focus-visible:outline-primary-400',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 focus-visible:outline-danger-500',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-5 py-2.5 gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
